import { requireAnyRole, requireAuth, corsHeaders } from "../_shared/auth.ts";

interface UpdateCorretorRequest {
  user_id: string;
  nome?: string;
  telefone?: string | null;
  creci?: string | null;
  cpf?: string | null;
  email?: string | null;
  ativo?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("admin-update-corretor: Starting request");

    // Try admin roles first
    const authResult = await requireAnyRole(req, ["super_admin", "imobiliaria_admin", "construtora_admin"]);

    let user: { id: string; email?: string };
    let supabaseAdmin: any;
    let isSuperAdmin = false;
    let adminRole: { role: string; imobiliaria_id: string | null; construtora_id: string | null } | null = null;
    let construtoraAdminRole: { role: string; imobiliaria_id: string | null; construtora_id: string | null } | null = null;
    let isLiderOfMembro = false;
    let isAdminAuth = true;

    if (authResult instanceof Response) {
      // Not an admin role — fallback to leader check
      isAdminAuth = false;
      const basicAuth = await requireAuth(req);
      if (basicAuth instanceof Response) return basicAuth;

      user = basicAuth.user;
      supabaseAdmin = basicAuth.supabaseAdmin;
    } else {
      user = authResult.user;
      supabaseAdmin = authResult.supabaseAdmin;
      isSuperAdmin = authResult.role === "super_admin";
      if (authResult.role === "imobiliaria_admin") adminRole = authResult.roleData;
      if (authResult.role === "construtora_admin") construtoraAdminRole = authResult.roleData;
    }

    console.log("admin-update-corretor: Authenticated user:", user.id);

    // Parse request body
    const body: UpdateCorretorRequest = await req.json();
    const { user_id, nome, telefone, creci, cpf, email, ativo } = body;

    console.log("admin-update-corretor: Request body:", { user_id, nome, telefone, creci, cpf, email, ativo });

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If not an admin, check if user is a team leader for this corretor
    if (!isAdminAuth) {
      const { data: isLiderData } = await supabaseAdmin.rpc("is_membro_da_minha_equipe", {
        _lider_id: user.id,
        _membro_user_id: user_id,
      });
      isLiderOfMembro = isLiderData === true;

      if (!isLiderOfMembro) {
        console.log("admin-update-corretor: User has no permission (not admin, not leader)");
        return new Response(
          JSON.stringify({ error: "Sem permissão para alterar este corretor" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log("admin-update-corretor: isLiderOfMembro:", isLiderOfMembro);

    // Team leaders can ONLY toggle ativo status
    if (isLiderOfMembro && !isSuperAdmin && !adminRole) {
      if (nome !== undefined || telefone !== undefined || creci !== undefined || cpf !== undefined || email !== undefined) {
        console.log("admin-update-corretor: Leader tried to edit fields other than ativo");
        return new Response(
          JSON.stringify({ error: "Líder de equipe só pode ativar/desativar corretores" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const imobiliariaId = adminRole?.imobiliaria_id;
    const construtoraId = construtoraAdminRole?.construtora_id;

    // Verify the corretor belongs to the same org (unless super_admin or leader)
    if (!isSuperAdmin && !isLiderOfMembro) {
      if (construtoraAdminRole && !adminRole) {
        const { data: corretorRole, error: corretorRoleError } = await supabaseAdmin
          .from("user_roles")
          .select("construtora_id")
          .eq("user_id", user_id)
          .eq("role", "corretor")
          .single();

        if (corretorRoleError || !corretorRole || corretorRole.construtora_id !== construtoraId) {
          return new Response(
            JSON.stringify({ error: "Corretor not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else if (adminRole) {
        const { data: corretorRole, error: corretorRoleError } = await supabaseAdmin
          .from("user_roles")
          .select("imobiliaria_id")
          .eq("user_id", user_id)
          .eq("role", "corretor")
          .single();

        if (corretorRoleError || !corretorRole || corretorRole.imobiliaria_id !== imobiliariaId) {
          return new Response(
            JSON.stringify({ error: "Corretor not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Build update object
    const updateData: Record<string, any> = {};
    if (nome !== undefined) updateData.nome = nome;
    if (telefone !== undefined) updateData.telefone = telefone;
    if (creci !== undefined) updateData.creci = creci;
    if (cpf !== undefined) updateData.cpf = cpf;
    if (email !== undefined) updateData.email = email;
    if (ativo !== undefined) {
      updateData.ativo = ativo;
      if (ativo === false) {
        updateData.telefone = null;
        console.log("admin-update-corretor: Clearing phone due to deactivation");

        // Transfer fichas to imobiliaria admin (only if admin is doing this, not leader)
        if (imobiliariaId && !isLiderOfMembro) {
          const { data: adminRoleData } = await supabaseAdmin
            .from("user_roles")
            .select("user_id")
            .eq("imobiliaria_id", imobiliariaId)
            .eq("role", "imobiliaria_admin")
            .neq("user_id", user_id)
            .maybeSingle();

          if (adminRoleData?.user_id) {
            const { count: transferredCount } = await supabaseAdmin
              .from("fichas_visita")
              .update({ user_id: adminRoleData.user_id })
              .eq("user_id", user_id);

            console.log(`admin-update-corretor: Transferred ${transferredCount ?? 0} fichas to admin ${adminRoleData.user_id}`);
          } else {
            console.log("admin-update-corretor: No admin found, fichas will remain with deactivated user");
          }
        }

        // Clear corretor_parceiro_id references
        const { count: partnerCount } = await supabaseAdmin
          .from("fichas_visita")
          .update({ corretor_parceiro_id: null })
          .eq("corretor_parceiro_id", user_id);

        console.log(`admin-update-corretor: Cleared ${partnerCount ?? 0} corretor_parceiro_id references`);
      }
    }

    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({ error: "No fields to update" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("admin-update-corretor: Updating profile with:", updateData);

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("user_id", user_id)
      .select()
      .single();

    if (updateError) {
      console.log("admin-update-corretor: Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update corretor" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("admin-update-corretor: Successfully updated corretor:", user_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Corretor atualizado com sucesso",
        profile: updatedProfile,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("admin-update-corretor: Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
