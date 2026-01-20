import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_OG_IMAGE = 'https://visitaprova.com.br/pwa-512x512.png';
const APP_URL = 'https://visitaprova.com.br';

console.log('[survey-og] v1.0.0 - Function loaded');

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    console.log('[survey-og] Token:', token);

    if (!token) {
      return new Response('Token não fornecido', { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Detect if request is from a crawler
    const userAgent = req.headers.get('user-agent') || '';
    const isCrawler = /WhatsApp|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Pinterest|Googlebot/i.test(userAgent);

    console.log('[survey-og] User-Agent:', userAgent);
    console.log('[survey-og] Is Crawler:', isCrawler);

    // If not a crawler, redirect to SPA
    if (!isCrawler) {
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${APP_URL}/survey/${token}`,
        },
      });
    }

    // For crawlers, fetch survey data and serve personalized OG tags
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch survey
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (surveyError || !survey) {
      console.error('[survey-og] Survey not found:', surveyError);
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${APP_URL}/survey/${token}`,
        },
      });
    }

    // Fetch ficha for property info
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

    // Fetch imobiliaria if applicable
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

    // Determine OG content
    let ogTitle: string;
    let ogImage: string;

    if (imobiliariaNome) {
      ogTitle = `Pesquisa de Satisfação - ${imobiliariaNome}`;
      ogImage = imobiliariaLogo || DEFAULT_OG_IMAGE;
    } else {
      const corretorNome = corretorProfile?.nome || 'Corretor';
      ogTitle = `Pesquisa de Satisfação - ${corretorNome}`;
      ogImage = corretorProfile?.foto_url || DEFAULT_OG_IMAGE;
    }

    // Build description
    let ogDescription: string;
    if (ficha?.imovel_endereco) {
      ogDescription = `Avalie sua visita ao imóvel: ${ficha.imovel_endereco}`;
    } else if (ficha?.imovel_tipo) {
      ogDescription = `Avalie sua visita ao ${ficha.imovel_tipo}`;
    } else {
      ogDescription = 'Sua opinião é muito importante para melhorarmos nosso atendimento.';
    }

    const surveyUrl = `${APP_URL}/survey/${token}`;

    // Escape HTML entities
    const escapeHtml = (text: string): string => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    console.log('[survey-og] Generating HTML - Title:', ogTitle, '- Image:', ogImage);

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
  
  <!-- Redirect -->
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

  } catch (error) {
    console.error('[survey-og] Error:', error);
    return new Response('Erro interno', { 
      status: 500,
      headers: corsHeaders
    });
  }
});
