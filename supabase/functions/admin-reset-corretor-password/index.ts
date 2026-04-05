import { requireAnyRole, corsHeaders } from "../_shared/auth.ts";

interface ResetPasswordRequest {
  user_id: string;
  new_password: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await requireAnyRole(req, ["super_admin", "imobiliaria_admin", "construtora_admin"]);
    if (authResult instanceof Response) return authResult;

    const { supabaseAdmin, role, roleData } = authResult;
    const isSuperAdmin = role === "super_admin";

    const body: ResetPasswordRequest = await req.json();
    const { user_id, new_password } = body;

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!new_password || new_password.length < 6) {
      return new Response(
        JSON.stringify({ error: "A senha deve ter pelo menos 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the corretor belongs to the same org (unless super_admin)
    if (!isSuperAdmin) {
      if (role === "imobiliaria_admin" && roleData.imobiliaria_id) {
        const { data: corretorRole } = await supabaseAdmin
          .from("user_roles")
          .select("imobiliaria_id")
          .eq("user_id", user_id)
          .eq("role", "corretor")
          .single();

        if (!corretorRole || corretorRole.imobiliaria_id !== roleData.imobiliaria_id) {
          return new Response(
            JSON.stringify({ error: "Corretor not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else if (role === "construtora_admin" && roleData.construtora_id) {
        const { data: corretorRole } = await supabaseAdmin
          .from("user_roles")
          .select("construtora_id")
          .eq("user_id", user_id)
          .eq("role", "corretor")
          .single();

        if (!corretorRole || corretorRole.construtora_id !== roleData.construtora_id) {
          return new Response(
            JSON.stringify({ error: "Corretor not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Update the password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      { password: new_password }
    );

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to reset password: " + updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Senha redefinida com sucesso" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("admin-reset-corretor-password: Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
