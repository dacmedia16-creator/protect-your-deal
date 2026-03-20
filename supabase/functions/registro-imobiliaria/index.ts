import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RegistroRequest {
  imobiliaria: {
    nome: string;
    cnpj?: string;
    creci_juridico?: string;
    email: string;
    telefone?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
  };
  admin: {
    nome: string;
    email: string;
    senha: string;
  };
  plano_id: string;
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

    const body: RegistroRequest = await req.json();
    const { imobiliaria, admin, plano_id, codigo_cupom, codigo_indicacao } = body;

    console.log("Starting registration for:", admin.email);
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

    console.log("Starting registration for:", admin.email);

    // Validate required fields
    if (!imobiliaria.nome || !imobiliaria.email || !admin.nome || !admin.email || !admin.senha) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios faltando" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (admin.senha.length < 6) {
      return new Response(
        JSON.stringify({ error: "A senha deve ter pelo menos 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Create the user account
    console.log("Creating user account...");
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: admin.email,
      password: admin.senha,
      email_confirm: true, // Auto-confirm email
      user_metadata: { nome: admin.nome },
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

    // 2. Create the imobiliaria
    console.log("Creating imobiliaria...");
    const { data: imobData, error: imobError } = await supabaseAdmin
      .from("imobiliarias")
      .insert({
        nome: imobiliaria.nome,
        cnpj: imobiliaria.cnpj || null,
        creci_juridico: imobiliaria.creci_juridico || null,
        email: imobiliaria.email,
        telefone: imobiliaria.telefone || null,
        endereco: imobiliaria.endereco || null,
        cidade: imobiliaria.cidade || null,
        estado: imobiliaria.estado || null,
        status: "ativo",
      })
      .select()
      .single();

    if (imobError) {
      console.error("Imobiliaria error:", imobError);
      // Rollback: delete the user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: "Erro ao criar imobiliária: " + imobError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Imobiliaria created:", imobData.id);

    // 3. Create the user_role
    console.log("Creating user role...");
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: userId,
        role: "imobiliaria_admin",
        imobiliaria_id: imobData.id,
      });

    if (roleError) {
      console.error("Role error:", roleError);
      // Rollback
      await supabaseAdmin.from("imobiliarias").delete().eq("id", imobData.id);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: "Erro ao criar permissões: " + roleError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User role created");

    // 4. Update profile with imobiliaria_id (profile is created by trigger)
    console.log("Updating profile...");
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ 
        imobiliaria_id: imobData.id,
        nome: admin.nome 
      })
      .eq("user_id", userId);

    if (profileError) {
      console.error("Profile error:", profileError);
      // Non-critical, continue
    }

    // 5. Create subscription
    if (plano_id) {
      console.log("Creating subscription...");
      
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
          imobiliaria_id: imobData.id,
          plano_id: plano_id,
          status: "trial",
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
          imobiliaria_id: imobData.id,
          valor_original: valorOriginal,
          valor_desconto: valorDesconto,
          valor_comissao: valorComissao,
          tipo_comissao: 'direta',
          afiliado_id: afiliadoId,
        });

        // Increment coupon usage count
        await supabaseAdmin.rpc('increment_cupom_usos', { cupom_uuid: cupomData.cupom_id });
      }
    }

    console.log("Registration completed successfully");

    // Send welcome WhatsApp (non-blocking)
    if (imobiliaria.telefone) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const mensagemBoasVindas = `Seja bem-vindo ${admin.nome} ao Visita Prova – Sistema de Segurança para Visitas Imobiliárias.\n\nSeu acesso já está ativo e pronto para uso.\n\nA partir de agora, você pode registrar e validar suas visitas com mais organização, controle e proteção operacional.\n\nNosso objetivo é oferecer mais segurança ao corretor e mais profissionalismo ao processo de atendimento.\n\n📌 Importante:\nSalve esse contato na sua agenda agora.\nCaso precise de ajuda, tirar dúvidas ou receber orientação sobre o uso do sistema, este mesmo canal funciona como suporte oficial.\n\nBasta enviar sua mensagem que nossa equipe irá te auxiliar.\n\nConte conosco para elevar o padrão das suas visitas.`;

        console.log("Sending welcome WhatsApp to:", imobiliaria.telefone);
        const whatsResponse = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            action: 'send-text',
            phone: imobiliaria.telefone,
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
        message: "Cadastro realizado com sucesso!",
        user_id: userId,
        imobiliaria_id: imobData.id,
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
