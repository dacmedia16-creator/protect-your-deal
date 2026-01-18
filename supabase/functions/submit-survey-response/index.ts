import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SurveyResponseData {
  token: string;
  rating_location: number;
  rating_size: number;
  rating_layout: number;
  rating_finishes: number;
  rating_conservation: number;
  rating_common_areas: number;
  rating_price: number;
  liked_most?: string;
  liked_least?: string;
  would_buy: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: SurveyResponseData = await req.json();

    // Validate required fields
    const {
      token,
      rating_location,
      rating_size,
      rating_layout,
      rating_finishes,
      rating_conservation,
      rating_common_areas,
      rating_price,
      liked_most,
      liked_least,
      would_buy,
    } = body;

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate all ratings are between 1 and 5
    const ratings = [
      { name: 'rating_location', value: rating_location },
      { name: 'rating_size', value: rating_size },
      { name: 'rating_layout', value: rating_layout },
      { name: 'rating_finishes', value: rating_finishes },
      { name: 'rating_conservation', value: rating_conservation },
      { name: 'rating_common_areas', value: rating_common_areas },
      { name: 'rating_price', value: rating_price },
    ];

    for (const rating of ratings) {
      if (rating.value === undefined || rating.value === null || rating.value < 1 || rating.value > 5) {
        return new Response(
          JSON.stringify({ error: `${rating.name} deve ser um número entre 1 e 5` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (typeof would_buy !== 'boolean') {
      return new Response(
        JSON.stringify({ error: '"Compraria este imóvel?" é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processando resposta para token:', token.substring(0, 8) + '...');

    // Create Supabase admin client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch survey by token
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('id, status, expires_at')
      .eq('token', token)
      .maybeSingle();

    if (surveyError) {
      console.error('Erro ao buscar survey:', surveyError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar pesquisa' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!survey) {
      return new Response(
        JSON.stringify({ error: 'Pesquisa não encontrada', code: 'NOT_FOUND' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already responded
    if (survey.status === 'responded') {
      return new Response(
        JSON.stringify({ error: 'Esta pesquisa já foi respondida', code: 'ALREADY_RESPONDED' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    if (new Date(survey.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Esta pesquisa expirou', code: 'EXPIRED' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client IP and user agent
    const ip_address = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                       req.headers.get('cf-connecting-ip') || 
                       'unknown';
    const user_agent = req.headers.get('user-agent') || 'unknown';

    // Insert survey response
    const { error: insertError } = await supabase
      .from('survey_responses')
      .insert({
        survey_id: survey.id,
        rating_location,
        rating_size,
        rating_layout,
        rating_finishes,
        rating_conservation,
        rating_common_areas,
        rating_price,
        liked_most: liked_most || null,
        liked_least: liked_least || null,
        would_buy,
        ip_address,
        user_agent,
      });

    if (insertError) {
      console.error('Erro ao inserir resposta:', insertError);
      
      // Check if it's a duplicate
      if (insertError.code === '23505') {
        return new Response(
          JSON.stringify({ error: 'Esta pesquisa já foi respondida', code: 'ALREADY_RESPONDED' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar resposta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update survey status
    const { error: updateError } = await supabase
      .from('surveys')
      .update({
        status: 'responded',
        responded_at: new Date().toISOString(),
      })
      .eq('id', survey.id);

    if (updateError) {
      console.error('Erro ao atualizar status da survey:', updateError);
      // Response was saved, so we don't return error to user
    }

    console.log('Resposta salva com sucesso para survey:', survey.id);

    return new Response(
      JSON.stringify({ success: true, message: 'Resposta registrada com sucesso!' }),
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
