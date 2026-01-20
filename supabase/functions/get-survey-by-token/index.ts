import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Default OG image when no logo/photo is available
const DEFAULT_OG_IMAGE = 'https://visitaprova.com.br/pwa-512x512.png';
const APP_URL = 'https://visitaprova.com.br';

// Helper function to escape HTML entities
const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase admin client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check if this is a GET request (for OG meta tags / crawlers)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const token = url.searchParams.get('token');

      if (!token) {
        return new Response('Token não fornecido', { status: 400 });
      }

      // Detect if request is from a crawler (WhatsApp, Facebook, Twitter, etc.)
      const userAgent = req.headers.get('user-agent') || '';
      const isCrawler = /WhatsApp|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Pinterest|Googlebot/i.test(userAgent);

      console.log('[get-survey-by-token] GET request - User-Agent:', userAgent);
      console.log('[get-survey-by-token] Is Crawler:', isCrawler);

      // If not a crawler, redirect to the SPA
      if (!isCrawler) {
        return Response.redirect(`${APP_URL}/survey/${token}`, 302);
      }

      // For crawlers, fetch survey data and serve HTML with personalized OG tags
      const { data: survey, error: surveyError } = await supabase
        .from('surveys')
        .select('*')
        .eq('token', token)
        .maybeSingle();

      if (surveyError || !survey) {
        console.error('[get-survey-by-token] Survey not found:', surveyError);
        return Response.redirect(`${APP_URL}/survey/${token}`, 302);
      }

      // Fetch ficha data for property info
      const { data: ficha } = await supabase
        .from('fichas_visita')
        .select('imovel_endereco, imovel_tipo')
        .eq('id', survey.ficha_id)
        .maybeSingle();

      // Fetch corretor profile
      const { data: corretorProfile } = await supabase
        .from('profiles')
        .select('nome, foto_url')
        .eq('user_id', survey.corretor_id)
        .maybeSingle();

      // Fetch imobiliaria data if applicable
      let imobiliariaNome = null;
      let imobiliariaLogo = null;
      
      if (survey.imobiliaria_id) {
        const { data: imobiliaria } = await supabase
          .from('imobiliarias')
          .select('nome, logo_url')
          .eq('id', survey.imobiliaria_id)
          .maybeSingle();
        
        imobiliariaNome = imobiliaria?.nome;
        imobiliariaLogo = imobiliaria?.logo_url;
      }

      // Determine OG content based on imobiliaria or corretor autônomo
      let ogTitle: string;
      let ogDescription: string;
      let ogImage: string;

      if (imobiliariaNome) {
        // For real estate agency
        ogTitle = `Pesquisa de Satisfação - ${imobiliariaNome}`;
        ogImage = imobiliariaLogo || DEFAULT_OG_IMAGE;
      } else {
        // For autonomous broker
        const corretorNome = corretorProfile?.nome || 'Corretor';
        ogTitle = `Pesquisa de Satisfação - ${corretorNome}`;
        ogImage = corretorProfile?.foto_url || DEFAULT_OG_IMAGE;
      }

      // Build description with property info
      if (ficha?.imovel_endereco) {
        ogDescription = `Avalie sua visita ao imóvel: ${ficha.imovel_endereco}`;
      } else if (ficha?.imovel_tipo) {
        ogDescription = `Avalie sua visita ao ${ficha.imovel_tipo}`;
      } else {
        ogDescription = 'Sua opinião é muito importante para melhorarmos nosso atendimento.';
      }

      const surveyUrl = `${APP_URL}/survey/${token}`;

      console.log('[get-survey-by-token] Generating HTML with OG tags');
      console.log('[get-survey-by-token] Title:', ogTitle);

      // Generate HTML with personalized OG tags
      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(ogTitle)}</title>
  
  <!-- Open Graph / WhatsApp / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${surveyUrl}">
  <meta property="og:title" content="${escapeHtml(ogTitle)}">
  <meta property="og:description" content="${escapeHtml(ogDescription)}">
  <meta property="og:image" content="${escapeHtml(ogImage)}">
  <meta property="og:image:width" content="512">
  <meta property="og:image:height" content="512">
  <meta property="og:site_name" content="VisitaProva">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${surveyUrl}">
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}">
  <meta name="twitter:description" content="${escapeHtml(ogDescription)}">
  <meta name="twitter:image" content="${escapeHtml(ogImage)}">
  
  <!-- Redirect for browsers that somehow reach here -->
  <meta http-equiv="refresh" content="0;url=${surveyUrl}">
</head>
<body>
  <p>Redirecionando para a pesquisa...</p>
  <script>window.location.href = "${surveyUrl}";</script>
</body>
</html>`;

      return new Response(html, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    // Handle POST request (original API functionality)
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Buscando survey com token:', token.substring(0, 8) + '...');

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
      .select('nome, foto_url')
      .eq('user_id', survey.corretor_id)
      .maybeSingle();

    // Fetch imobiliaria name and logo
    let imobiliariaNome = null;
    let imobiliariaLogoUrl = null;
    if (survey.imobiliaria_id) {
      const { data: imobiliaria } = await supabase
        .from('imobiliarias')
        .select('nome, logo_url')
        .eq('id', survey.imobiliaria_id)
        .maybeSingle();
      imobiliariaNome = imobiliaria?.nome;
      imobiliariaLogoUrl = imobiliaria?.logo_url;
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
        corretor_foto_url: corretorProfile?.foto_url || null,
        imobiliaria_nome: imobiliariaNome,
        imobiliaria_logo_url: imobiliariaLogoUrl,
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
