import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RegistroCorretorRequest {
  corretor: {
    nome: string;
    email: string;
    telefone?: string;
    creci?: string;
    cpf?: string;
    senha: string;
  };
  plano_id: string;
  codigo_imobiliaria?: number | null;
  codigo_cupom?: string | null;
  codigo_indicacao?: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Parse body with error handling
    let rawBody: any;
    try {
      rawBody = await req.json();
      console.log("Received body:", JSON.stringify(rawBody));
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize body to support both nested (corretor: {...}) and flat format
    let corretor: RegistroCorretorRequest["corretor"];
    let plano_id: string | undefined;
    let codigo_imobiliaria: number | null | undefined;
    let codigo_cupom: string | null | undefined;

    if (rawBody.corretor) {
      // New format: { corretor: {...}, plano_id, codigo_imobiliaria, codigo_cupom }
      corretor = rawBody.corretor;
      plano_id = rawBody.plano_id;
      codigo_imobiliaria = rawBody.codigo_imobiliaria;
      codigo_cupom = rawBody.codigo_cupom;
    } else if (rawBody.email) {
      // Old flat format: { nome, email, senha, codigo_imobiliaria, codigo_cupom }
      corretor = {
        nome: rawBody.nome,
        email: rawBody.email,
        senha: rawBody.senha || rawBody.password,
        telefone: rawBody.telefone,
        creci: rawBody.creci,
      };
      plano_id = rawBody.plano_id;
      codigo_imobiliaria = rawBody.codigo_imobiliaria;
      codigo_cupom = rawBody.codigo_cupom;
    } else {
      console.error("Invalid request format. Body received:", rawBody);
      return new Response(
        JSON.stringify({ error: "Dados do corretor não informados" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize codigo_imobiliaria to number if it's a string
    if (codigo_imobiliaria && typeof codigo_imobiliaria === 'string') {
      codigo_imobiliaria = parseInt(codigo_imobiliaria, 10);
      if (isNaN(codigo_imobiliaria)) {
        codigo_imobiliaria = null;
      }
    }

    console.log("Starting autonomous broker registration for:", corretor.email);
    console.log("Codigo imobiliaria:", codigo_imobiliaria);
    console.log("Cupom code:", codigo_cupom || "none");

    // Validate coupon if provided
    let cupomData: { cupom_id: string; valor_desconto: number; tipo_desconto: string; comissao_percentual: number } | null = null;
    if (codigo_cupom) {
      const { data: cupomResult, error: cupomError } = await supabaseAdmin.rpc('validar_cupom', {
        codigo_cupom: codigo_cupom
      });

      if (cupomError) {
        console.error("Cupom validation error:", cupomError);
      } else if (cupomResult && cupomResult.length > 0 && cupomResult[0].valido) {
        cupomData = {
          cupom_id: cupomResult[0].cupom_id,
          valor_desconto: cupomResult[0].valor_desconto,
          tipo_desconto: cupomResult[0].tipo_desconto,
          comissao_percentual: cupomResult[0].comissao_percentual
        };
        console.log("Valid coupon found:", cupomData);
      }
    }

    // Validate codigo_imobiliaria if provided
    let imobiliariaId: string | null = null;
    if (codigo_imobiliaria) {
      console.log("Validating imobiliaria code:", codigo_imobiliaria);
      const { data: imobiliariaData, error: imobError } = await supabaseAdmin
        .from("imobiliarias")
        .select("id, nome, status")
        .eq("codigo", codigo_imobiliaria)
        .maybeSingle();

      if (imobError) {
        console.error("Error finding imobiliaria:", imobError);
        return new Response(
          JSON.stringify({ error: "Erro ao buscar imobiliária" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!imobiliariaData) {
        return new Response(
          JSON.stringify({ error: "Código de imobiliária inválido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (imobiliariaData.status !== "ativo") {
        return new Response(
          JSON.stringify({ error: "Esta imobiliária não está ativa" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      imobiliariaId = imobiliariaData.id;
      console.log("Found imobiliaria:", imobiliariaData.nome);
    }

    // Validate required fields
    if (!corretor.nome || !corretor.email || !corretor.senha) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios faltando" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (corretor.senha.length < 6) {
      return new Response(
        JSON.stringify({ error: "A senha deve ter pelo menos 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Create the user account
    console.log("Creating user account...");
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: corretor.email,
      password: corretor.senha,
      email_confirm: true, // Auto-confirm email
      user_metadata: { nome: corretor.nome },
    });

    if (authError) {
      console.error("Auth error:", authError);
      if (authError.message?.includes("already")) {
        return new Response(
          JSON.stringify({ error: "Este email já está cadastrado" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: "Erro ao criar usuário" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;
    console.log("User created:", userId);

    // 2. Create the user_role (corretor autônomo ou vinculado à imobiliária)
    console.log("Creating user role...");
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: userId,
        role: "corretor",
        imobiliaria_id: imobiliariaId, // null se autônomo, ID se vinculado
      });

    if (roleError) {
      console.error("Role error:", roleError);
      // Rollback: delete the user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: "Erro ao criar permissões: " + roleError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User role created");

  // 3. Update profile with additional data (profile is created by trigger)
    // Se vinculado a imobiliária, começa desativado (admin precisa ativar)
    // Se autônomo, permanece ativo
    // IMPORTANT: Separate critical updates from optional ones to ensure linking always works
    console.log("Updating profile (critical fields)...");
    const { error: criticalProfileError } = await supabaseAdmin
      .from("profiles")
      .update({ 
        nome: corretor.nome,
        imobiliaria_id: imobiliariaId,
        ativo: imobiliariaId ? false : true,
      })
      .eq("user_id", userId);

    if (criticalProfileError) {
      console.error("Critical profile error:", criticalProfileError);
      // Rollback: delete the user since we couldn't set essential data
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: "Erro ao criar perfil: " + criticalProfileError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update optional fields (telefone, creci, cpf, email) - these may fail due to duplicates
    if (corretor.telefone || corretor.creci || corretor.cpf || corretor.email) {
      console.log("Updating profile (optional fields)...");
      const { error: optionalProfileError } = await supabaseAdmin
        .from("profiles")
        .update({ 
          telefone: corretor.telefone || null,
          creci: corretor.creci || null,
          cpf: corretor.cpf || null,
          email: corretor.email || null,
        })
        .eq("user_id", userId);

      if (optionalProfileError) {
        console.warn("Optional profile fields error (non-critical):", optionalProfileError);
        // Non-critical: user can update these later in their profile
        // This handles duplicate phone/cpf cases gracefully
      }
    }

    // 4. Create subscription linked to user_id (only for autonomous brokers without imobiliaria)
    // If linked to imobiliaria, the subscription is managed by the imobiliaria
    // Also check if user already has a subscription (edge case: re-registration)
    if (plano_id && !imobiliariaId) {
      // Check if user already has an active subscription
      const { data: existingSub } = await supabaseAdmin
        .from('assinaturas')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingSub) {
        console.log("User already has a subscription, skipping creation");
      } else {
        console.log("Creating subscription for autonomous broker...");
      
        // Get plan value
        const { data: planoData } = await supabaseAdmin
          .from("planos")
          .select("valor_mensal")
          .eq("id", plano_id)
          .single();

        const valorOriginal = planoData?.valor_mensal || 0;
        
        // Buscar afiliado_id do cupom se existir
        let afiliadoId: string | null = null;
        if (cupomData) {
          const { data: cupomInfo } = await supabaseAdmin
            .from("cupons")
            .select("afiliado_id")
            .eq("id", cupomData.cupom_id)
            .single();
          afiliadoId = cupomInfo?.afiliado_id || null;
        }

        const { data: assinData, error: assinError } = await supabaseAdmin
          .from("assinaturas")
          .insert({
            user_id: userId, // Vinculado ao usuário, não à imobiliária
            imobiliaria_id: null,
            plano_id: plano_id,
            status: "ativa", // Plano gratuito já começa ativo
            data_inicio: new Date().toISOString().split("T")[0],
            // Novos campos para comissões recorrentes
            afiliado_id: afiliadoId,
            cupom_id: cupomData?.cupom_id || null,
            comissao_percentual: cupomData?.comissao_percentual || 0,
          })
          .select()
          .single();

        if (assinError) {
          console.error("Subscription error:", assinError);
          // Non-critical, continue
        } else if (cupomData && assinData) {
          // Register initial coupon usage (first payment commission)
          console.log("Registering coupon usage...");
          
          let valorDesconto = 0;
          if (cupomData.tipo_desconto === 'percentual') {
            valorDesconto = valorOriginal * (cupomData.valor_desconto / 100);
          } else {
            valorDesconto = Math.min(cupomData.valor_desconto, valorOriginal);
          }
          
          const valorComissao = valorOriginal * (cupomData.comissao_percentual / 100);

          await supabaseAdmin.from("cupons_usos").insert({
            cupom_id: cupomData.cupom_id,
            assinatura_id: assinData.id,
            user_id: userId,
            valor_original: valorOriginal,
            valor_desconto: valorDesconto,
            valor_comissao: valorComissao,
            tipo_comissao: 'direta',
            afiliado_id: afiliadoId,
          });

          // Increment coupon usage count
          await supabaseAdmin.rpc('increment_cupom_usos', { cupom_uuid: cupomData.cupom_id });
          console.log("Coupon usage registered");
        } else {
          console.log("Subscription created");
        }
      }
    }

    console.log("Broker registration completed successfully", imobiliariaId ? "(linked to imobiliaria)" : "(autonomous)");

    // Send welcome email (non-blocking)
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const emailPayload = {
        action: 'send-template',
        to: corretor.email,
        template_tipo: 'boas_vindas',
        variables: {
          nome: corretor.nome,
          email: corretor.email,
          link: 'https://visitaprova.com.br/auth',
        }
      };

      console.log("Welcome email vars:", Object.keys(emailPayload.variables).join(', '));
      console.log("Sending welcome email to:", corretor.email);
      
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify(emailPayload),
      });

      if (emailResponse.ok) {
        const emailResult = await emailResponse.json();
        console.log("Welcome email sent successfully:", emailResult);
      } else {
        const errorText = await emailResponse.text();
        console.error("Failed to send welcome email:", errorText);
      }
    } catch (emailError) {
      // Non-blocking: log error but don't fail registration
      console.error("Error sending welcome email:", emailError);
    }

    // Send welcome WhatsApp (non-blocking)
    if (corretor.telefone) {
      try {
        const mensagemBoasVindas = `Seja bem-vindo ${corretor.nome} ao Visita Prova – Sistema de Segurança para Visitas Imobiliárias.\n\nSeu acesso já está ativo e pronto para uso.\n\nA partir de agora, você pode registrar e validar suas visitas com mais organização, controle e proteção operacional.\n\nNosso objetivo é oferecer mais segurança ao corretor e mais profissionalismo ao processo de atendimento.\n\n📌 Importante:\nSalve esse contato na sua agenda agora.\nCaso precise de ajuda, tirar dúvidas ou receber orientação sobre o uso do sistema, este mesmo canal funciona como suporte oficial.\n\nBasta enviar sua mensagem que nossa equipe irá te auxiliar.\n\nConte conosco para elevar o padrão das suas visitas.`;

        console.log("Sending welcome WhatsApp to:", corretor.telefone);
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const whatsResponse = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            action: 'send-text',
            phone: corretor.telefone,
            message: mensagemBoasVindas,
            channel: 'default',
          }),
        });

        if (whatsResponse.ok) {
          console.log("Welcome WhatsApp sent successfully");
        } else {
          const errText = await whatsResponse.text();
          console.error("Failed to send welcome WhatsApp:", errText);
        }
      } catch (whatsErr) {
        console.error("Error sending welcome WhatsApp:", whatsErr);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: imobiliariaId 
          ? "Cadastro realizado com sucesso! Aguarde a ativação pelo administrador da imobiliária."
          : "Cadastro realizado com sucesso!",
        user_id: userId,
        imobiliaria_id: imobiliariaId,
        linked_to_imobiliaria: !!imobiliariaId,
        requires_activation: !!imobiliariaId,
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
