import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { requireRole, corsHeaders } from "../_shared/auth.ts";

interface RequestBody {
  user_id: string;
  action: "set_password" | "send_reset_email";
  new_password?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const result = await requireRole(req, "super_admin");
    if (result instanceof Response) return result;

    const { user, supabaseAdmin } = result;

    const body: RequestBody = await req.json();
    const { user_id, action, new_password } = body;

    if (!user_id || !action) {
      return new Response(
        JSON.stringify({ error: "user_id e action são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (user_id === user.id) {
      return new Response(
        JSON.stringify({ error: "Você não pode alterar sua própria senha por esta rota" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: targetUser, error: targetError } = await supabaseAdmin.auth.admin.getUserById(user_id);
    if (targetError || !targetUser) {
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Target user found:", targetUser.user.email);

    if (action === "set_password") {
      if (!new_password) {
        return new Response(
          JSON.stringify({ error: "Nova senha é obrigatória" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (new_password.length < 6) {
        return new Response(
          JSON.stringify({ error: "A senha deve ter pelo menos 6 caracteres" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user_id,
        { password: new_password }
      );

      if (updateError) {
        console.error("Error updating password:", updateError);
        return new Response(
          JSON.stringify({ error: "Erro ao atualizar senha: " + updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Password updated successfully for user:", user_id);

      return new Response(
        JSON.stringify({ success: true, message: "Senha atualizada com sucesso" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "send_reset_email") {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: targetUser.user.email!,
      });

      if (linkError) {
        console.error("Error generating reset link:", linkError);
        return new Response(
          JSON.stringify({ error: "Erro ao gerar link de recuperação: " + linkError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Reset link generated for user:", targetUser.user.email);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Link de recuperação gerado. O usuário receberá um email para redefinir a senha.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: "Ação inválida. Use 'set_password' ou 'send_reset_email'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
