import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegistroCorretorRequest {
  corretor: {
    nome: string;
    email: string;
    telefone?: string;
    creci?: string;
    senha: string;
  };
  plano_id: string;
  codigo_imobiliaria?: number | null;
  codigo_cupom?: string | null;
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

    const body: RegistroCorretorRequest = await req.json();
    const { corretor, plano_id, codigo_imobiliaria, codigo_cupom } = body;

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
    console.log("Updating profile...");
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ 
        nome: corretor.nome,
        telefone: corretor.telefone || null,
        creci: corretor.creci || null,
        imobiliaria_id: imobiliariaId, // null se autônomo, ID se vinculado
      })
      .eq("user_id", userId);

    if (profileError) {
      console.error("Profile error:", profileError);
      // Non-critical, continue
    }

    // 4. Create subscription linked to user_id (only for autonomous brokers without imobiliaria)
    // If linked to imobiliaria, the subscription is managed by the imobiliaria
    if (plano_id && !imobiliariaId) {
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
        });

        // Increment coupon usage count
        await supabaseAdmin.rpc('increment_cupom_usos', { cupom_uuid: cupomData.cupom_id });
        console.log("Coupon usage registered");
      } else {
        console.log("Subscription created");
      }
    }

    console.log("Broker registration completed successfully", imobiliariaId ? "(linked to imobiliaria)" : "(autonomous)");

    return new Response(
      JSON.stringify({ 
        success: true,
        message: imobiliariaId 
          ? "Cadastro realizado com sucesso! Você foi vinculado à imobiliária."
          : "Cadastro realizado com sucesso!",
        user_id: userId,
        linked_to_imobiliaria: !!imobiliariaId,
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
