import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user using token directly
    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user: currentUser }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !currentUser) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // supabaseAdmin already created above

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

    let userId: string;
    let isExistingUser = false;

    if (createError) {
      // Se email já existe, buscar usuário existente
      if (createError.message?.includes("already been registered")) {
        console.log("Email já registrado, buscando usuário existente:", afiliado.email);
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = listData?.users?.find(u => u.email === afiliado.email);
        if (!existingUser) {
          return new Response(JSON.stringify({ error: "Usuário com este email não foi encontrado" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        userId = existingUser.id;
        isExistingUser = true;
        console.log("Usuário existente encontrado:", userId);
      } else {
        console.error("Erro ao criar usuário:", createError);
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      userId = newUser.user.id;
    }

    // Atualizar afiliado com user_id
    const { error: updateError } = await supabaseAdmin
      .from("afiliados")
      .update({ user_id: userId })
      .eq("id", afiliado_id);

    if (updateError) {
      console.error("Erro ao vincular usuário:", updateError);
      return new Response(JSON.stringify({ error: "Erro ao vincular usuário" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Enviar email com credenciais ou notificação
    try {
      if (isExistingUser) {
        // Usuário já existente - enviar email informando ativação do painel
        const emailHtml = `
          <h2>Seu acesso ao painel de afiliados foi ativado!</h2>
          <p>Olá ${afiliado.nome},</p>
          <p>Seu acesso ao painel de afiliados foi ativado com sucesso.</p>
          <p>Use seu email e senha atuais para acessar o painel.</p>
          <p><a href="${req.headers.get("origin")}/auth">Acessar o painel</a></p>
        `;

        await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            action: "send",
            from_email: "noreply@visitaprova.com.br",
            to: afiliado.email,
            subject: "Seu acesso ao painel de afiliados foi ativado",
            html: emailHtml,
          }),
        });
        console.log("Email de ativação enviado para:", afiliado.email);
      } else {
        // Novo usuário - enviar email com credenciais
        const emailHtml = `
          <h2>Bem-vindo ao painel de afiliados!</h2>
          <p>Olá ${afiliado.nome},</p>
          <p>Seu acesso ao painel de afiliados foi criado com sucesso.</p>
          <p><strong>Email:</strong> ${afiliado.email}</p>
          <p><strong>Senha temporária:</strong> ${tempPassword}</p>
          <p>Acesse o painel e altere sua senha no primeiro login.</p>
          <p><a href="${req.headers.get("origin")}/auth">Acessar o painel</a></p>
        `;

        await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            action: "send",
            from_email: "noreply@visitaprova.com.br",
            to: afiliado.email,
            subject: "Seu acesso ao painel de afiliados foi criado",
            html: emailHtml,
          }),
        });
        console.log("Email de credenciais enviado para:", afiliado.email);
      }
    } catch (emailError) {
      console.error("Erro ao enviar email:", emailError);
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