import { requireAnyRole, corsHeaders } from "../_shared/auth.ts";

interface CreateCorretorRequest {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  creci?: string;
  cpf?: string;
  autonomo?: boolean;
  construtora?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await requireAnyRole(req, ["imobiliaria_admin", "super_admin", "construtora_admin"]);
    if (authResult instanceof Response) return authResult;

    const { supabaseAdmin, role: callerRole, roleData } = authResult;

    const body: CreateCorretorRequest = await req.json();
    const { nome, email, senha, telefone, creci, cpf, autonomo, construtora } = body;

    console.log("Creating corretor:", email, "autonomo:", autonomo, "construtora:", construtora);
    console.log("Caller role:", callerRole, "construtora_id:", roleData.construtora_id, "imobiliaria_id:", roleData.imobiliaria_id);

    // Determine linking
    let imobiliariaId: string | null = null;
    let construtoraId: string | null = null;

    if (construtora) {
      // Construtora flow
      if (callerRole !== "construtora_admin" && callerRole !== "super_admin") {
        return new Response(
          JSON.stringify({ error: "Apenas administradores de construtora podem criar corretores vinculados à construtora" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      construtoraId = roleData.construtora_id || null;
      if (!construtoraId && callerRole !== "super_admin") {
        return new Response(
          JSON.stringify({ error: "Usuário não está vinculado a uma construtora" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (autonomo) {
      if (callerRole !== "super_admin") {
        return new Response(
          JSON.stringify({ error: "Apenas super admins podem criar corretores autônomos" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Regular imobiliaria flow
      imobiliariaId = roleData.imobiliaria_id;
      if (!imobiliariaId && callerRole !== "super_admin") {
        return new Response(
          JSON.stringify({ error: "Usuário não está vinculado a uma imobiliária" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Validate
    if (!nome || !email || !senha) {
      return new Response(
        JSON.stringify({ error: "Nome, email e senha são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (senha.length < 6) {
      return new Response(
        JSON.stringify({ error: "A senha deve ter pelo menos 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome },
    });

    if (createError) {
      console.error("Auth create error:", createError.message);
      if (createError.message?.includes("already")) {
        return new Response(
          JSON.stringify({ error: "Este email já está cadastrado" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User created successfully:", authData.user?.id);

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: "Erro ao criar usuário" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;

    // Create role
    const { error: userRoleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: userId,
        role: "corretor",
        imobiliaria_id: imobiliariaId,
        construtora_id: construtoraId,
      });

    if (userRoleError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: "Erro ao criar permissões: " + userRoleError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update profile
    await supabaseAdmin
      .from("profiles")
      .update({
        imobiliaria_id: imobiliariaId,
        construtora_id: construtoraId,
        nome,
        telefone: telefone || null,
        creci: creci || null,
        cpf: cpf || null,
        email: email || null,
        ativo: true,
      })
      .eq("user_id", userId);

    return new Response(
      JSON.stringify({
        success: true,
        message: construtora ? "Corretor da construtora criado com sucesso!" : autonomo ? "Corretor autônomo criado com sucesso!" : "Corretor criado com sucesso!",
        user_id: userId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
