import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface MarketingImageRequest {
  template: string;
  titulo: string;
  subtitulo: string;
  funcionalidade: string;
  formato: 'quadrado' | 'vertical' | 'stories';
  estilo: 'claro' | 'escuro';
  qualidade: 'rapido' | 'premium';
  onlyDescription?: boolean;
}

// ============================================================
// HASHTAGS
// ============================================================

const hashtagsPorFuncionalidade: Record<string, string[]> = {
  'otp-whatsapp': ['#whatsapp', '#seguranca', '#verificacao', '#confirmacao'],
  'qr-code': ['#qrcode', '#tecnologia', '#inovacao', '#digital'],
  'pdf': ['#documentos', '#comprovante', '#profissional', '#pdf'],
  'crm': ['#crm', '#gestao', '#clientes', '#organizacao'],
  'mobile': ['#app', '#mobile', '#aplicativo', '#praticidade'],
  'parcerias': ['#parcerias', '#networking', '#colaboracao', '#negocios'],
  'dashboard': ['#dashboard', '#metricas', '#dados', '#analytics'],
  'geral': ['#gestao', '#produtividade', '#eficiencia', '#transformacao']
};

const hashtagsBase = [
  '#corretordeimoveis', '#imobiliaria', '#mercadoimobiliario',
  '#visitaprova', '#corretor', '#imoveis'
];

// ============================================================
// DESCRIPTION GENERATION
// ============================================================

const templateStyles: Record<string, string> = {
  'feature': 'Foque nos benefícios da funcionalidade. Tom entusiasmado mas profissional.',
  'dica': 'Tom educativo e amigável. Comece com "Você sabia?" ou "Dica de corretor:".',
  'antes-depois': 'Contraste dramático entre método antigo e novo. Use "Antes:" e "Depois:".',
  'estatistica': 'Destaque números impressionantes. Use dados como "70% dos corretores...".',
  'depoimento': 'Escreva como corretor satisfeito. Tom pessoal e autêntico.',
  'carrossel': 'Crie curiosidade para o próximo slide. Use "Deslize para ver mais".'
};

const funcDescriptions: Record<string, string> = {
  'otp-whatsapp': 'confirmação de visitas via código OTP no WhatsApp',
  'qr-code': 'verificação de comprovantes por QR Code instantâneo',
  'pdf': 'geração de comprovantes em PDF profissionais',
  'crm': 'CRM para organizar clientes em um só lugar',
  'mobile': 'app mobile/PWA que funciona em qualquer celular',
  'parcerias': 'sistema de parcerias entre corretores',
  'dashboard': 'dashboard com métricas em tempo real',
  'geral': 'plataforma completa de gestão de visitas imobiliárias'
};

async function generateDescription(
  apiKey: string, template: string, titulo: string, subtitulo: string, funcionalidade: string
): Promise<string> {
  const style = templateStyles[template] || templateStyles['feature'];
  const func = funcDescriptions[funcionalidade] || funcDescriptions['geral'];

  const prompt = `Crie descrição para Instagram sobre o app VisitaProva (gestão de visitas imobiliárias, prova de intermediação).
Funcionalidade: ${func}. Título: ${titulo}. Subtítulo: ${subtitulo}. Estilo: ${style}

Estrutura: 1) Hook com emoji 2) Problema do corretor 3) Solução VisitaProva 4) Benefício 5) Pergunta engajamento 6) CTA
Regras: PT-BR natural, max 250 palavras, sem hashtags, fale "você" ao corretor. APENAS o texto.`;

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }]
      }),
    });
    if (resp.ok) {
      const data = await resp.json();
      return data.choices?.[0]?.message?.content || '';
    }
    console.error('Description generation failed:', resp.status);
    return '';
  } catch (e) {
    console.error('Error generating description:', e);
    return '';
  }
}

function getFallbackDescription(titulo: string, subtitulo: string): string {
  return `🔐 ${titulo}\n\n${subtitulo}\n\n✅ Com o VisitaProva, sua prova de intermediação fica garantida.\n\n👉 Já conhece o app?\n\n📲 Link na bio`;
}

function buildLegenda(descricao: string, funcionalidade: string) {
  const hashtagsFunc = hashtagsPorFuncionalidade[funcionalidade] || hashtagsPorFuncionalidade['geral'];
  const allHashtags = [...hashtagsBase, ...hashtagsFunc].slice(0, 10);
  return { legenda: `${descricao}\n\n${allHashtags.join(' ')}`, hashtags: allHashtags };
}

// ============================================================
// CONCISE IMAGE PROMPTS - "STYLE ANCHORING" APPROACH
// ============================================================

// Scene per template (~100-150 chars each)
const sceneByTemplate: Record<string, string> = {
  'feature': 'Brazilian real estate agent (35yo, business casual) showing smartphone verification code to impressed client at luxury property entrance.',
  'antes-depois': 'Split image: LEFT chaotic desk with scattered papers, stressed agent. RIGHT clean digital workspace, calm confident agent with phone showing green checkmarks.',
  'dica': 'Friendly agent confidently showing smartphone screen with green checkmark to reassured property owner at upscale entrance.',
  'estatistica': 'Bold "98%" statistic overlaid on blurred modern property with silhouettes of agent and client shaking hands.',
  'depoimento': 'Editorial portrait of successful Brazilian agent (30s-40s, blazer), genuine smile, modern glass office background, large quotation marks framing.',
  'carrossel': 'Angled smartphone showing clean app interface on dark navy gradient (#0F172A), subtle real estate icons, numbered "01" corner indicator.'
};

// Context per feature (~80-100 chars each)
const contextByFeature: Record<string, string> = {
  'otp-whatsapp': 'Phone screen shows WhatsApp-style message with 6-digit OTP code. Lock/shield icons. Person TYPING code on keyboard, NOT handwriting.',
  'qr-code': 'Smartphone scanning QR code on official document. Screen shows green "Verified" checkmark. Anti-fraud, cutting-edge.',
  'pdf': 'Tablet displaying premium PDF receipt with typed confirmations, OTP codes, dates. Executive desk setting. NO handwritten signatures.',
  'crm': 'Laptop showing organized CRM dashboard with client cards, property thumbnails, activity timeline. Modern office.',
  'mobile': 'Agent walking outside luxury property, using smartphone. Candid lifestyle shot, natural lighting, on-the-go.',
  'parcerias': 'Two agents collaborating, one showing phone with partnership details. Modern meeting room, diverse professionals.',
  'dashboard': 'Large monitor with analytics dashboard: charts, KPIs, graphs. Manager viewing with satisfaction.',
  'geral': 'Hero shot: confident agent with satisfied client at stunning modern property. Agent holds phone with app checkmarks, client holds keys.'
};

function buildImagePrompt(
  template: string, funcionalidade: string, formato: string, estilo: string
): string {
  const { aspectRatio } = getAspectRatioAndDimensions(formato);
  const scene = sceneByTemplate[template] || sceneByTemplate['feature'];
  const context = contextByFeature[funcionalidade] || contextByFeature['geral'];

  const palette = estilo === 'claro'
    ? 'Bright airy studio lighting. Whites, cream, soft gray. Accents: navy #2563EB, emerald #10B981, subtle gold.'
    : 'Premium dark tones. Navy #0F172A, charcoal. Accents: electric blue #60A5FA, emerald #10B981, amber highlights.';

  // Concise, ~600-800 char prompt with style anchoring
  return `Professional advertising photography, Annie Leibovitz editorial style. ${aspectRatio} aspect ratio.
Scene: ${scene}
Detail: ${context}
Style: 8K, shallow DOF, cinematic warm tones. Magazine-quality commercial photography.
Palette: ${palette}
Mood: Security, trust, professionalism, innovation, legal authority.
Brazilian real estate market. Diverse, attractive, aspirational people.
AVOID: text, words, logos, watermarks, signature pads, stylus pens, handwriting.
Keep top-left 15% clean and uncluttered for logo overlay.
CRITICAL: People TYPING on phone keyboards, NOT drawing signatures.`;
}

// Simplified fallback prompt for retry (~300 chars)
function buildSimplifiedPrompt(template: string, formato: string, estilo: string): string {
  const { aspectRatio } = getAspectRatioAndDimensions(formato);
  const bg = estilo === 'claro' ? 'bright, airy, white background' : 'dark navy #0F172A background';
  const scenes: Record<string, string> = {
    'feature': 'real estate agent showing phone to client at modern property',
    'antes-depois': 'split: messy desk vs clean digital workspace',
    'dica': 'agent showing phone with checkmark to property owner',
    'estatistica': 'bold statistic number over blurred property',
    'depoimento': 'portrait of confident agent in modern office',
    'carrossel': 'smartphone showing app interface on gradient background'
  };
  const scene = scenes[template] || scenes['feature'];
  return `Professional photo, ${aspectRatio}. ${scene}. ${bg}. 8K, cinematic. No text, no logos. Clean top-left corner.`;
}

function getAspectRatioAndDimensions(formato: string) {
  switch (formato) {
    case 'quadrado': return { aspectRatio: '1:1', width: 1080, height: 1080 };
    case 'vertical': return { aspectRatio: '4:5', width: 1080, height: 1350 };
    case 'stories': return { aspectRatio: '9:16', width: 1080, height: 1920 };
    default: return { aspectRatio: '1:1', width: 1080, height: 1080 };
  }
}

// ============================================================
// IMAGE GENERATION WITH RETRY
// ============================================================

async function generateImage(apiKey: string, prompt: string): Promise<{ imageData: string | null; textContent: string | null }> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-pro-image-preview",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"]
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI Gateway error:', response.status, errorText);
    if (response.status === 429 || response.status === 402) {
      throw { status: response.status, message: response.status === 429
        ? "Limite de requisições excedido. Tente novamente em alguns minutos."
        : "Créditos insuficientes. Adicione créditos ao workspace." };
    }
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message;
  let imageData: string | null = null;
  const textContent = typeof message?.content === 'string' ? message.content : null;

  if (message?.images && Array.isArray(message.images)) {
    for (const img of message.images) {
      if (img.type === 'image_url' && img.image_url?.url) {
        imageData = img.image_url.url;
        break;
      }
    }
  }

  return { imageData, textContent };
}

async function generateImageWithRetry(
  apiKey: string, fullPrompt: string, simplifiedPrompt: string
): Promise<{ imageData: string; textContent: string | null }> {
  // Attempt 1: full prompt
  console.log('Attempt 1: full prompt (' + fullPrompt.length + ' chars)');
  let result = await generateImage(apiKey, fullPrompt);
  if (result.imageData) return { imageData: result.imageData, textContent: result.textContent };

  // Attempt 2: simplified prompt
  console.log('Attempt 2: simplified prompt (' + simplifiedPrompt.length + ' chars)');
  await new Promise(r => setTimeout(r, 1000));
  result = await generateImage(apiKey, simplifiedPrompt);
  if (result.imageData) return { imageData: result.imageData, textContent: result.textContent };

  throw new Error('Não foi possível gerar a imagem após 2 tentativas.');
}

// ============================================================
// TEXT OVERLAY VIA GEMINI (2nd pass)
// ============================================================

async function addTextOverlay(
  apiKey: string, imageBase64: string, titulo: string, subtitulo: string, estilo: string
): Promise<string> {
  const textColor = estilo === 'claro' ? 'dark navy (#0F172A)' : 'white';
  const barColor = estilo === 'claro'
    ? 'semi-transparent white (rgba 255,255,255,0.85)'
    : 'semi-transparent dark (rgba 15,23,42,0.80)';

  const instruction = `Add text overlay to this marketing image for Instagram.
At the BOTTOM of the image, add a ${barColor} gradient bar spanning the full width (about 20% of image height).
On this bar, center the following text:
- Main title: "${titulo}" in large, bold ${textColor} sans-serif font
- Below it: "${subtitulo}" in smaller, regular ${textColor} sans-serif font
The text must be PERFECTLY READABLE against the bar background.
Keep the rest of the image UNCHANGED. Do NOT crop or resize.
Output the SAME aspect ratio and dimensions.`;

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: instruction },
            { type: "image_url", image_url: { url: imageBase64 } }
          ]
        }],
        modalities: ["image", "text"]
      }),
    });

    if (!resp.ok) {
      console.error('Text overlay failed:', resp.status);
      return imageBase64; // Return original on failure
    }

    const data = await resp.json();
    const newImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (newImage) {
      console.log('Text overlay applied successfully');
      return newImage;
    }
    console.warn('No image returned from text overlay, using original');
    return imageBase64;
  } catch (e) {
    console.error('Error adding text overlay:', e);
    return imageBase64;
  }
}

// ============================================================
// REFINEMENT PASS (premium only)
// ============================================================

async function refineImage(apiKey: string, imageBase64: string): Promise<string> {
  const instruction = `Enhance this advertising photograph:
- Improve lighting to be more cinematic and professional
- Increase photorealism and sharpness
- Make colors more vibrant but natural
- Add subtle depth of field effect
- Keep the same composition and content
Output at the same dimensions and aspect ratio.`;

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: instruction },
            { type: "image_url", image_url: { url: imageBase64 } }
          ]
        }],
        modalities: ["image", "text"]
      }),
    });

    if (!resp.ok) {
      console.warn('Refinement failed:', resp.status);
      return imageBase64;
    }

    const data = await resp.json();
    const refined = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (refined) {
      console.log('Image refined successfully');
      return refined;
    }
    return imageBase64;
  } catch (e) {
    console.error('Error refining image:', e);
    return imageBase64;
  }
}

// ============================================================
// RESIZE + LOGO OVERLAY
// ============================================================

async function processImage(imageData: string, targetWidth: number, targetHeight: number): Promise<string> {
  const base64Match = imageData.match(/^data:image\/\w+;base64,(.+)$/);
  if (!base64Match) return imageData;

  const base64Data = base64Match[1];
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const img = await Image.decode(bytes);
  console.log(`Original: ${img.width}x${img.height} → Target: ${targetWidth}x${targetHeight}`);
  const resized = img.cover(targetWidth, targetHeight);

  // Logo overlay
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const logoUrl = `${SUPABASE_URL}/storage/v1/object/public/logos-imobiliarias/vp-logo.png`;
    const logoResp = await fetch(logoUrl);
    if (logoResp.ok) {
      const logoBuffer = await logoResp.arrayBuffer();
      const logoImage = await Image.decode(new Uint8Array(logoBuffer));
      const logoSize = Math.round(resized.width * 0.12);
      const logoAspect = logoImage.width / logoImage.height;
      const resizedLogo = logoImage.resize(logoSize, Math.round(logoSize / logoAspect));
      const margin = Math.round(resized.width * 0.03);
      resized.composite(resizedLogo, margin, margin);
      console.log('Logo overlay applied');
    }
  } catch (e) {
    console.error('Logo overlay error:', e);
  }

  const outputBytes = await resized.encode();
  let binaryStr = '';
  for (let i = 0; i < outputBytes.length; i++) {
    binaryStr += String.fromCharCode(outputBytes[i]);
  }
  return `data:image/png;base64,${btoa(binaryStr)}`;
}

// ============================================================
// MAIN HANDLER
// ============================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: MarketingImageRequest = await req.json();
    const { template, titulo, subtitulo, funcionalidade, formato, estilo, onlyDescription } = body;
    const qualidade = body.qualidade || 'rapido';
    
    console.log('Request:', { template, titulo, funcionalidade, formato, estilo, qualidade, onlyDescription });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Only description
    if (onlyDescription) {
      let descricao = await generateDescription(LOVABLE_API_KEY, template, titulo, subtitulo, funcionalidade);
      if (!descricao) descricao = getFallbackDescription(titulo, subtitulo);
      const { legenda, hashtags } = buildLegenda(descricao, funcionalidade);
      return new Response(JSON.stringify({ success: true, legenda, hashtags }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate image
    const { width: targetWidth, height: targetHeight } = getAspectRatioAndDimensions(formato);
    const fullPrompt = buildImagePrompt(template, funcionalidade, formato, estilo);
    const simplePrompt = buildSimplifiedPrompt(template, formato, estilo);

    console.log('Full prompt length:', fullPrompt.length, '| Simple prompt length:', simplePrompt.length);

    let { imageData, textContent } = await generateImageWithRetry(LOVABLE_API_KEY, fullPrompt, simplePrompt);

    // Premium: refine image
    if (qualidade === 'premium') {
      console.log('Premium mode: refining image...');
      imageData = await refineImage(LOVABLE_API_KEY, imageData);
    }

    // Add text overlay (title + subtitle on the image)
    if (titulo.trim() || subtitulo.trim()) {
      console.log('Adding text overlay...');
      imageData = await addTextOverlay(LOVABLE_API_KEY, imageData, titulo, subtitulo, estilo);
    }

    // Resize + logo
    console.log('Processing image (resize + logo)...');
    try {
      imageData = await processImage(imageData, targetWidth, targetHeight);
    } catch (e) {
      console.error('Image processing error:', e);
    }

    // Generate description in parallel would be ideal but we need it sequential
    console.log('Generating description...');
    let descricao = await generateDescription(LOVABLE_API_KEY, template, titulo, subtitulo, funcionalidade);
    if (!descricao) descricao = getFallbackDescription(titulo, subtitulo);
    const { legenda, hashtags } = buildLegenda(descricao, funcionalidade);

    return new Response(JSON.stringify({
      success: true,
      image: imageData,
      description: textContent,
      legenda,
      hashtags
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error('Error:', error);
    const status = error?.status || 500;
    const message = error?.message || (error instanceof Error ? error.message : "Erro desconhecido");
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
