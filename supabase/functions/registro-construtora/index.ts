import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RegistroRequest {
  construtora: {
    nome: string;
    cnpj?: string;
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
    const { construtora, admin, plano_id, codigo_cupom, codigo_indicacao } = body;

    console.log("Starting construtora registration for:", admin.email);

    // Validate coupon if provided
    let cupomData: { cupom_id: string; valor_desconto: number; tipo_desconto: string; comissao_percentual: number } | null = null;
    if (codigo_cupom) {
      const { data: cupomResult, error: cupomError } = await supabaseAdmin.rpc('validar_cupom', {
        codigo_cupom: codigo_cupom
      });
      if (!cupomError && cupomResult && cupomResult.length > 0 && cupomResult[0].valido) {
        cupomData = {
          cupom_id: cupomResult[0].cupom_id,
          valor_desconto: cupomResult[0].valor_desconto,
          tipo_desconto: cupomResult[0].tipo_desconto,
          comissao_percentual: cupomResult[0].comissao_percentual
        };
      }
    }

    // Validate required fields
    if (!construtora.nome || !construtora.email || !admin.nome || !admin.email || !admin.senha) {
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

    // 1. Create user account
    console.log("Creating user account...");
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: admin.email,
      password: admin.senha,
      email_confirm: true,
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

    // 2. Create the construtora
    console.log("Creating construtora...");
    const { data: constData, error: constError } = await supabaseAdmin
      .from("construtoras")
      .insert({
        nome: construtora.nome,
        cnpj: construtora.cnpj || null,
        email: construtora.email,
        telefone: construtora.telefone || null,
        endereco: construtora.endereco || null,
        cidade: construtora.cidade || null,
        estado: construtora.estado || null,
        status: "ativo",
      })
      .select()
      .single();

    if (constError) {
      console.error("Construtora error:", constError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: "Erro ao criar construtora: " + constError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Construtora created:", constData.id);

    // 2b. Create generic empreendimento
    const { error: empError } = await supabaseAdmin
      .from("empreendimentos")
      .insert({
        construtora_id: constData.id,
        nome: "Outro (Endereço Manual)",
        tipo: "misto",
        status: "ativo",
        descricao: "Empreendimento genérico para endereços manuais",
      });
    if (empError) {
      console.error("Generic empreendimento error:", empError);
    }

    // 3. Create user_role
    console.log("Creating user role...");
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: userId,
        role: "construtora_admin",
        construtora_id: constData.id,
      });

    if (roleError) {
      console.error("Role error:", roleError);
      await supabaseAdmin.from("construtoras").delete().eq("id", constData.id);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: "Erro ao criar permissões: " + roleError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Update profile
    console.log("Updating profile...");
    await supabaseAdmin
      .from("profiles")
      .update({
        construtora_id: constData.id,
        nome: admin.nome,
      })
      .eq("user_id", userId);

    // 5. Create subscription
    if (plano_id) {
      console.log("Creating subscription...");
      const { data: planoData } = await supabaseAdmin
        .from("planos")
        .select("valor_mensal")
        .eq("id", plano_id)
        .single();

      const valorOriginal = planoData?.valor_mensal || 0;

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
          construtora_id: constData.id,
          plano_id: plano_id,
          status: "trial",
          data_inicio: new Date().toISOString().split("T")[0],
          data_fim: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          afiliado_id: afiliadoId,
          cupom_id: cupomData?.cupom_id || null,
          comissao_percentual: cupomData?.comissao_percentual || 0,
        })
        .select()
        .single();

      if (assinError) {
        console.error("Subscription error:", assinError);
      } else if (cupomData && assinData) {
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
          valor_original: valorOriginal,
          valor_desconto: valorDesconto,
          valor_comissao: valorComissao,
          tipo_comissao: 'direta',
          afiliado_id: afiliadoId,
        });
        await supabaseAdmin.rpc('increment_cupom_usos', { cupom_uuid: cupomData.cupom_id });
      }
    }

    // Register referral if provided
    if (codigo_indicacao) {
      try {
        const { data: indicacao } = await supabaseAdmin
          .from("indicacoes_corretor")
          .select("id, indicador_user_id, comissao_percentual, tipo_comissao_indicacao")
          .eq("codigo", codigo_indicacao)
          .eq("status", "pendente")
          .is("indicado_user_id", null)
          .maybeSingle();

        if (indicacao) {
          await supabaseAdmin
            .from("indicacoes_corretor")
            .update({
              indicado_user_id: userId,
              tipo_indicado: "construtora",
              status: "cadastrado",
              updated_at: new Date().toISOString(),
            })
            .eq("id", indicacao.id);

          const newCode = `IND-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          await supabaseAdmin
            .from("indicacoes_corretor")
            .insert({
              indicador_user_id: indicacao.indicador_user_id,
              codigo: newCode,
              comissao_percentual: indicacao.comissao_percentual,
              tipo_comissao_indicacao: indicacao.tipo_comissao_indicacao || 'percentual',
              status: "pendente",
            });
        }
      } catch (refErr) {
        console.error("Error processing referral:", refErr);
      }
    }

    console.log("Construtora registration completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Cadastro realizado com sucesso!",
        user_id: userId,
        construtora_id: constData.id,
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
