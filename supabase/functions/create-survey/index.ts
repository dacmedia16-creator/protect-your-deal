import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user context
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log('Criando survey para usuário:', userId);

    const { ficha_id, app_url } = await req.json();

    if (!ficha_id) {
      return new Response(
        JSON.stringify({ error: 'ficha_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch ficha FIRST to get imobiliaria_id
    const { data: ficha, error: fichaError } = await supabaseAdmin
      .from('fichas_visita')
      .select('id, status, user_id, imobiliaria_id, comprador_nome, comprador_telefone, comprador_cpf')
      .eq('id', ficha_id)
      .maybeSingle();

    if (fichaError || !ficha) {
      return new Response(
        JSON.stringify({ error: 'Ficha não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if feature is enabled
    if (ficha.imobiliaria_id) {
      // Imobiliária: check imobiliaria_feature_flags
      const { data: featureFlag } = await supabaseAdmin
        .from('imobiliaria_feature_flags')
        .select('enabled')
        .eq('imobiliaria_id', ficha.imobiliaria_id)
        .eq('feature_key', 'post_visit_survey')
        .maybeSingle();

      if (!featureFlag?.enabled) {
        return new Response(
          JSON.stringify({ error: 'Esta funcionalidade não está habilitada para esta imobiliária' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Corretor autônomo: check user_feature_flags
      const { data: userFlag } = await supabaseAdmin
        .from('user_feature_flags')
        .select('enabled')
        .eq('user_id', userId)
        .eq('feature_key', 'post_visit_survey')
        .maybeSingle();

      if (!userFlag?.enabled) {
        return new Response(
          JSON.stringify({ error: 'Esta funcionalidade não está habilitada para este usuário' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Verify user owns the ficha
    if (ficha.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Você não tem permissão para enviar pesquisa nesta ficha' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify ficha status
    if (!['completo', 'finalizado_parcial'].includes(ficha.status)) {
      return new Response(
        JSON.stringify({ error: 'A ficha precisa estar com assinatura confirmada para enviar pesquisa' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if survey already exists for this ficha
    const { data: existingSurvey } = await supabaseAdmin
      .from('surveys')
      .select('id, token, status')
      .eq('ficha_id', ficha_id)
      .maybeSingle();

    if (existingSurvey) {
      // Return existing survey info with edge function URL for personalized OG tags
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const surveyUrl = `${supabaseUrl}/functions/v1/survey-og-page?token=${existingSurvey.token}`;
      
      return new Response(
        JSON.stringify({
          success: true,
          survey_id: existingSurvey.id,
          token: existingSurvey.token,
          link: surveyUrl,
          already_exists: true,
          status: existingSurvey.status,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new survey
    const { data: newSurvey, error: insertError } = await supabaseAdmin
      .from('surveys')
      .insert({
        ficha_id,
        corretor_id: userId,
        imobiliaria_id: ficha.imobiliaria_id,
        client_name: ficha.comprador_nome,
        client_phone: ficha.comprador_telefone,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .select('id, token')
      .single();

    if (insertError) {
      console.error('Erro ao criar survey:', insertError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar pesquisa' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate link that points to the edge function for personalized OG tags
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const surveyUrl = `${supabaseUrl}/functions/v1/survey-og-page?token=${newSurvey.token}`;

    console.log('Survey criada com sucesso:', newSurvey.id);

    return new Response(
      JSON.stringify({
        success: true,
        survey_id: newSurvey.id,
        token: newSurvey.token,
        link: surveyUrl,
        already_exists: false,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro inesperado:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
