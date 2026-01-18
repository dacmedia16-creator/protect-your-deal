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
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Buscando survey com token:', token.substring(0, 8) + '...');

    // Create Supabase admin client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch survey by token
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
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
      console.log('Survey não encontrada');
      return new Response(
        JSON.stringify({ error: 'Pesquisa não encontrada', code: 'NOT_FOUND' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already responded
    if (survey.status === 'responded') {
      console.log('Survey já respondida');
      return new Response(
        JSON.stringify({ error: 'Esta pesquisa já foi respondida', code: 'ALREADY_RESPONDED' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    if (new Date(survey.expires_at) < new Date()) {
      console.log('Survey expirada');
      return new Response(
        JSON.stringify({ error: 'Esta pesquisa expirou', code: 'EXPIRED' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch ficha data
    const { data: ficha, error: fichaError } = await supabase
      .from('fichas_visita')
      .select('id, imovel_endereco, imovel_tipo, data_visita, comprador_nome, imobiliaria_id')
      .eq('id', survey.ficha_id)
      .maybeSingle();

    if (fichaError) {
      console.error('Erro ao buscar ficha:', fichaError);
    }

    // Fetch corretor profile
    const { data: corretorProfile } = await supabase
      .from('profiles')
      .select('nome')
      .eq('user_id', survey.corretor_id)
      .maybeSingle();

    // Fetch imobiliaria name
    let imobiliariaNome = null;
    if (survey.imobiliaria_id) {
      const { data: imobiliaria } = await supabase
        .from('imobiliarias')
        .select('nome')
        .eq('id', survey.imobiliaria_id)
        .maybeSingle();
      imobiliariaNome = imobiliaria?.nome;
    }

    console.log('Survey encontrada com sucesso');

    return new Response(
      JSON.stringify({
        survey: {
          id: survey.id,
          status: survey.status,
          client_name: survey.client_name,
        },
        ficha: ficha ? {
          imovel_endereco: ficha.imovel_endereco,
          imovel_tipo: ficha.imovel_tipo,
          data_visita: ficha.data_visita,
          comprador_nome: ficha.comprador_nome,
        } : null,
        corretor_nome: corretorProfile?.nome || null,
        imobiliaria_nome: imobiliariaNome,
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
