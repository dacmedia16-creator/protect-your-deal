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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already has a referral code
    const { data: existing } = await supabaseAdmin
      .from("indicacoes_corretor")
      .select("codigo")
      .eq("indicador_user_id", user.id)
      .eq("status", "pendente")
      .is("indicado_user_id", null)
      .is("indicado_imobiliaria_id", null)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ codigo: existing.codigo }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get default commission config
    const { data: configs } = await supabaseAdmin
      .from("configuracoes_sistema")
      .select("chave, valor")
      .in("chave", ["indicacao_comissao_corretor", "indicacao_comissao_imobiliaria", "indicacao_tipo_comissao"]);

    const tipoComissao = String(configs?.find(c => c.chave === "indicacao_tipo_comissao")?.valor || "percentual").replace(/"/g, "");
    const comissaoCorretor = tipoComissao === "primeira_mensalidade" ? 100 : Number(configs?.find(c => c.chave === "indicacao_comissao_corretor")?.valor || 10);

    // Generate unique code: IND-XXXXXX
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const codigo = `IND-${randomPart}`;

    // Create the referral entry (placeholder, will be updated when someone registers)
    const { error: insertError } = await supabaseAdmin
      .from("indicacoes_corretor")
      .insert({
        indicador_user_id: user.id,
        codigo,
        comissao_percentual: comissaoCorretor,
        tipo_comissao_indicacao: tipoComissao,
        status: "pendente",
      });

    if (insertError) {
      // If code collision, try again with different code
      if (insertError.message?.includes("unique")) {
        const retryCode = `IND-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        await supabaseAdmin
          .from("indicacoes_corretor")
          .insert({
            indicador_user_id: user.id,
            codigo: retryCode,
            comissao_percentual: comissaoCorretor,
            tipo_comissao_indicacao: tipoComissao,
            status: "pendente",
          });
        return new Response(
          JSON.stringify({ codigo: retryCode }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw insertError;
    }

    return new Response(
      JSON.stringify({ codigo }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
