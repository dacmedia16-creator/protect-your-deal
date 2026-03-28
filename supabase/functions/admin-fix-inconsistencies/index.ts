import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FixRequest {
  operation: 
    | "remove_super_admin_imobiliaria" 
    | "backfill_orphan_fichas" 
    | "sync_profiles" 
    | "create_missing_profiles";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Verify the requesting user is a super_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is super_admin
    const { data: isSuperAdmin } = await supabaseAdmin.rpc("is_super_admin", { _user_id: user.id });
    
    if (!isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: "Apenas super admins podem executar correções" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { operation }: FixRequest = await req.json();
    console.log(`Executing fix operation: ${operation} by user ${user.email}`);

    let affectedCount = 0;
    let message = "";

    switch (operation) {
      case "remove_super_admin_imobiliaria": {
        // Remove imobiliaria_id from super_admins (they shouldn't have one)
        const { data: superAdminsWithImob, error: selectError } = await supabaseAdmin
          .from("user_roles")
          .select("id")
          .eq("role", "super_admin")
          .not("imobiliaria_id", "is", null);

        if (selectError) throw selectError;

        if (superAdminsWithImob && superAdminsWithImob.length > 0) {
          const ids = superAdminsWithImob.map(r => r.id);
          const { error: updateError } = await supabaseAdmin
            .from("user_roles")
            .update({ imobiliaria_id: null })
            .in("id", ids);

          if (updateError) throw updateError;
          affectedCount = superAdminsWithImob.length;
        }

        message = affectedCount > 0 
          ? `Removido imobiliaria_id de ${affectedCount} super admin(s)`
          : "Nenhum super admin com imobiliaria_id encontrado";
        break;
      }

      case "backfill_orphan_fichas": {
        // Find orphan fichas and batch-update using user_roles data
        const { data: orphanFichas, error: selectError } = await supabaseAdmin
          .from("fichas_visita")
          .select("id, user_id")
          .is("imobiliaria_id", null)
          .not("user_id", "is", null);

        if (selectError) throw selectError;

        if (orphanFichas && orphanFichas.length > 0) {
          // Get all unique user_ids
          const userIds = [...new Set(orphanFichas.map(f => f.user_id).filter(Boolean))];
          
          // Batch fetch all user roles at once
          const { data: userRoles, error: rolesError } = await supabaseAdmin
            .from("user_roles")
            .select("user_id, imobiliaria_id")
            .in("user_id", userIds)
            .not("imobiliaria_id", "is", null);

          if (rolesError) throw rolesError;

          // Build a lookup map
          const roleMap = new Map<string, string>();
          if (userRoles) {
            for (const role of userRoles) {
              roleMap.set(role.user_id, role.imobiliaria_id);
            }
          }

          // Group fichas by imobiliaria_id for batch updates
          const updateGroups = new Map<string, string[]>();
          for (const ficha of orphanFichas) {
            const imobId = roleMap.get(ficha.user_id);
            if (imobId) {
              const group = updateGroups.get(imobId) || [];
              group.push(ficha.id);
              updateGroups.set(imobId, group);
            }
          }

          // Execute batch updates per imobiliaria
          for (const [imobId, fichaIds] of updateGroups) {
            const { error: updateError } = await supabaseAdmin
              .from("fichas_visita")
              .update({ imobiliaria_id: imobId })
              .in("id", fichaIds);

            if (!updateError) {
              affectedCount += fichaIds.length;
            }
          }
        }

        message = affectedCount > 0
          ? `Atualizado imobiliaria_id em ${affectedCount} ficha(s) órfã(s)`
          : "Nenhuma ficha órfã pôde ser corrigida (corretores sem imobiliária)";
        break;
      }

      case "sync_profiles": {
        // Batch sync: fetch all profiles and roles, compare in memory
        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from("profiles")
          .select("id, user_id, imobiliaria_id");

        if (profilesError) throw profilesError;

        const { data: allRoles, error: rolesError } = await supabaseAdmin
          .from("user_roles")
          .select("user_id, imobiliaria_id");

        if (rolesError) throw rolesError;

        if (profiles && allRoles) {
          // Build role lookup
          const roleMap = new Map<string, string | null>();
          for (const role of allRoles) {
            roleMap.set(role.user_id, role.imobiliaria_id);
          }

          // Find mismatches
          const updates: { id: string; imobiliaria_id: string | null }[] = [];
          for (const profile of profiles) {
            const roleImobId = roleMap.get(profile.user_id);
            if (roleImobId !== undefined && profile.imobiliaria_id !== roleImobId) {
              updates.push({ id: profile.id, imobiliaria_id: roleImobId });
            }
          }

          // Batch update mismatched profiles
          for (const update of updates) {
            const { error: updateError } = await supabaseAdmin
              .from("profiles")
              .update({ imobiliaria_id: update.imobiliaria_id })
              .eq("id", update.id);

            if (!updateError) {
              affectedCount++;
            }
          }
        }

        message = affectedCount > 0
          ? `Sincronizado imobiliaria_id em ${affectedCount} perfil(is)`
          : "Todos os perfis já estão sincronizados";
        break;
      }

      case "create_missing_profiles": {
        // Fetch all roles and profiles, find missing ones
        const { data: allRoles, error: rolesError } = await supabaseAdmin
          .from("user_roles")
          .select("user_id, imobiliaria_id");

        if (rolesError) throw rolesError;

        const { data: allProfiles, error: profilesError } = await supabaseAdmin
          .from("profiles")
          .select("user_id");

        if (profilesError) throw profilesError;

        if (allRoles) {
          const existingUserIds = new Set((allProfiles || []).map(p => p.user_id));
          const missingRoles = allRoles.filter(r => !existingUserIds.has(r.user_id));

          for (const roleEntry of missingRoles) {
            // Get user email from auth (this still requires individual calls)
            const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(roleEntry.user_id);
            
            if (authUser?.user) {
              const { error: insertError } = await supabaseAdmin
                .from("profiles")
                .insert({
                  user_id: roleEntry.user_id,
                  nome: authUser.user.email?.split("@")[0] || "Usuário",
                  imobiliaria_id: roleEntry.imobiliaria_id,
                });

              if (!insertError) {
                affectedCount++;
              }
            }
          }
        }

        message = affectedCount > 0
          ? `Criado ${affectedCount} perfil(is) faltante(s)`
          : "Todos os usuários já possuem perfil";
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Operação desconhecida: ${operation}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    console.log(`Operation ${operation} completed: ${message}`);

    return new Response(
      JSON.stringify({ success: true, message, affectedCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in admin-fix-inconsistencies:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
