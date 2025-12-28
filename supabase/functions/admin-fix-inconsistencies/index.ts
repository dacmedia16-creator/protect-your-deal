import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
        // Find orphan fichas and try to set imobiliaria_id based on the user who created them
        const { data: orphanFichas, error: selectError } = await supabaseAdmin
          .from("fichas_visita")
          .select("id, user_id")
          .is("imobiliaria_id", null);

        if (selectError) throw selectError;

        if (orphanFichas && orphanFichas.length > 0) {
          for (const ficha of orphanFichas) {
            // Get the imobiliaria_id from the user's role
            const { data: userRole } = await supabaseAdmin
              .from("user_roles")
              .select("imobiliaria_id")
              .eq("user_id", ficha.user_id)
              .not("imobiliaria_id", "is", null)
              .maybeSingle();

            if (userRole?.imobiliaria_id) {
              const { error: updateError } = await supabaseAdmin
                .from("fichas_visita")
                .update({ imobiliaria_id: userRole.imobiliaria_id })
                .eq("id", ficha.id);

              if (!updateError) {
                affectedCount++;
              }
            }
          }
        }

        message = affectedCount > 0
          ? `Atualizado imobiliaria_id em ${affectedCount} ficha(s) órfã(s)`
          : "Nenhuma ficha órfã pôde ser corrigida (corretores sem imobiliária)";
        break;
      }

      case "sync_profiles": {
        // Sync profiles.imobiliaria_id with user_roles.imobiliaria_id
        const { data: profiles, error: selectError } = await supabaseAdmin
          .from("profiles")
          .select("id, user_id, imobiliaria_id");

        if (selectError) throw selectError;

        if (profiles && profiles.length > 0) {
          for (const profile of profiles) {
            const { data: userRole } = await supabaseAdmin
              .from("user_roles")
              .select("imobiliaria_id")
              .eq("user_id", profile.user_id)
              .maybeSingle();

            // Only update if there's a difference
            if (userRole && profile.imobiliaria_id !== userRole.imobiliaria_id) {
              const { error: updateError } = await supabaseAdmin
                .from("profiles")
                .update({ imobiliaria_id: userRole.imobiliaria_id })
                .eq("id", profile.id);

              if (!updateError) {
                affectedCount++;
              }
            }
          }
        }

        message = affectedCount > 0
          ? `Sincronizado imobiliaria_id em ${affectedCount} perfil(is)`
          : "Todos os perfis já estão sincronizados";
        break;
      }

      case "create_missing_profiles": {
        // Create profiles for users that have a role but no profile
        const { data: rolesWithoutProfile, error: selectError } = await supabaseAdmin
          .from("user_roles")
          .select("user_id, imobiliaria_id");

        if (selectError) throw selectError;

        if (rolesWithoutProfile && rolesWithoutProfile.length > 0) {
          for (const roleEntry of rolesWithoutProfile) {
            // Check if profile exists
            const { data: existingProfile } = await supabaseAdmin
              .from("profiles")
              .select("id")
              .eq("user_id", roleEntry.user_id)
              .maybeSingle();

            if (!existingProfile) {
              // Get user email from auth
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
