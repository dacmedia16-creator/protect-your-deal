import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: currentUser }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !currentUser) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificar se é super_admin
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUser.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Obter dados do body
    const { afiliado_id } = await req.json();

    if (!afiliado_id) {
      return new Response(JSON.stringify({ error: "afiliado_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar dados do afiliado
    const { data: afiliado, error: afiliadoError } = await supabaseAdmin
      .from("afiliados")
      .select("*")
      .eq("id", afiliado_id)
      .single();

    if (afiliadoError || !afiliado) {
      return new Response(JSON.stringify({ error: "Afiliado não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificar se já tem user_id
    if (afiliado.user_id) {
      return new Response(JSON.stringify({ error: "Afiliado já possui acesso" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gerar senha temporária
    const tempPassword = Math.random().toString(36).slice(-8) + "A1!";

    // Criar usuário
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: afiliado.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        nome: afiliado.nome,
      },
    });

    if (createError) {
      console.error("Erro ao criar usuário:", createError);
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Atualizar afiliado com user_id
    const { error: updateError } = await supabaseAdmin
      .from("afiliados")
      .update({ user_id: newUser.user.id })
      .eq("id", afiliado_id);

    if (updateError) {
      console.error("Erro ao vincular usuário:", updateError);
      return new Response(JSON.stringify({ error: "Erro ao vincular usuário" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Enviar email de redefinição de senha
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: afiliado.email,
      options: {
        redirectTo: `${req.headers.get("origin")}/auth/redefinir-senha`,
      },
    });

    if (resetError) {
      console.error("Erro ao gerar link de recuperação:", resetError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Acesso criado. O afiliado receberá um email para definir a senha.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro:", error);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});