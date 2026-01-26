import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarketingImageRequest {
  template: string;
  titulo: string;
  subtitulo: string;
  funcionalidade: string;
  formato: 'quadrado' | 'vertical' | 'stories';
  estilo: 'claro' | 'escuro';
  onlyDescription?: boolean;
}

// Hashtags por funcionalidade
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
  '#corretordeimoveis',
  '#imobiliaria',
  '#mercadoimobiliario',
  '#visitaprova',
  '#corretor',
  '#imoveis'
];

// Descrições por tipo de template para a IA de descrição
const templateStyles: Record<string, string> = {
  'feature': 'Foque nos benefícios da funcionalidade. Use tom entusiasmado mas profissional.',
  'dica': 'Tom educativo e amigável. Comece com "Você sabia?" ou "Dica de corretor:". Ensine algo útil.',
  'antes-depois': 'Mostre o contraste dramático entre o método antigo (papel, desorganização) e o novo (digital, organizado). Use "Antes:" e "Depois:".',
  'estatistica': 'Destaque números impressionantes. Use dados como "70% dos corretores..." ou "Economize X horas por semana".',
  'depoimento': 'Escreva como se fosse um corretor satisfeito contando sua experiência. Tom pessoal e autêntico.',
  'carrossel': 'Crie curiosidade para o próximo slide. Use frases como "Deslize para ver mais" ou "No próximo slide...".'
};

// Descrições de funcionalidades para contexto de descrição
const funcionalidadeDescriptionsForText: Record<string, string> = {
  'otp-whatsapp': 'confirmação de visitas via código OTP no WhatsApp, que garante que comprador e proprietário realmente participaram da visita',
  'qr-code': 'verificação de comprovantes por QR Code, que permite validar a autenticidade do documento instantaneamente',
  'pdf': 'geração de comprovantes em PDF profissionais, com todos os dados da visita e assinaturas digitais',
  'crm': 'sistema de CRM para organizar clientes (compradores e proprietários) em um só lugar',
  'mobile': 'aplicativo mobile/PWA que funciona em qualquer celular, mesmo offline',
  'parcerias': 'sistema de parcerias entre corretores, facilitando a divisão de comissões e colaboração',
  'dashboard': 'dashboard com métricas e relatórios em tempo real sobre suas visitas e desempenho',
  'geral': 'plataforma completa de gestão de visitas imobiliárias com segurança e praticidade'
};

// ============================================================
// NOVOS PROMPTS PREMIUM - FOTOGRAFIA PUBLICITÁRIA REALISTA
// ============================================================

// Templates de cenário visual realista por tipo de post
const visualScenarios: Record<string, string> = {
  'feature': `
A photorealistic scene of a well-dressed Brazilian real estate agent (modern business casual, 
30-45 years old) standing next to a client in front of a high-end property. The client is 
signing something on their smartphone with an expression of security and confidence.
The agent looks professional and trustworthy, gesturing towards the phone screen.
Visual elements: smartphone with minimalist interface suggesting digital signature, 
subtle protection icons (shield, checkmark) as floating overlays.
Setting: elegant, modern property entrance - could be luxury apartment building or upscale house.
Lighting: professional advertising photography, warm and inviting.
`,
  'antes-depois': `
A conceptual split-image representing invisible risk in real estate transactions.
LEFT SIDE: A stressed, overwhelmed agent surrounded by scattered WhatsApp messages on screen, 
loose paper contracts, handwritten notes, and visual symbols of legal conflict (warning signs, 
red X marks). Chaotic, disorganized desk. Cold, harsh lighting.
RIGHT SIDE: A calm, confident agent with everything organized - phone showing clean app interface 
with green checkmarks, neat digital documents on screen, satisfied expression. Modern, clean 
workspace. Warm, professional lighting.
Visual concept: "Those who document don't argue later."
Clear visual contrast between chaos and control, old vs new methods.
`,
  'dica': `
A professional real estate agent (well-groomed, business casual) confidently showing their 
smartphone screen to a property owner at a property entrance. The phone displays a clean 
interface with a green verification checkmark. The owner looks reassured and satisfied, 
nodding in approval.
Background: upscale residential property entrance with modern architecture.
Lighting: warm golden hour, professional lifestyle photography style.
Both people appear trustworthy and professional.
`,
  'estatistica': `
Clean, modern infographic style with a real estate context. A large, bold statistic number 
prominently displayed (use abstract placeholder like "98%" or "3x"). 
Background: subtly blurred modern high-end property with silhouettes of happy professionals 
- an agent and client shaking hands or celebrating.
Style: data-driven, corporate, trustworthy. Mix of infographic elements with photorealistic background.
Color emphasis on the number with brand colors.
`,
  'depoimento': `
Portrait-style photo of a confident, successful Brazilian real estate agent in their 30s-40s.
Professionally dressed (blazer, modern business attire), looking directly at camera with 
a genuine, subtle smile that conveys trust and success.
Background: modern real estate office with glass walls, or upscale property lobby - slightly blurred 
to keep focus on the person.
Style: editorial portrait, authentic, relatable. Professional lighting.
Could include large quotation marks as design elements framing the person.
`,
  'carrossel': `
Clean, premium carousel slide design with consistent visual language for a series.
Feature a smartphone at an angle showing a clean VisitaProva-style app interface mockup.
Background: abstract premium gradient transitioning from dark navy (#0F172A) to deep slate.
Include subtle real estate iconography: small house icons, key symbols, checkmarks.
Modern geometric accents and subtle grid patterns for visual interest.
Numbered corner indicator (like "01" or "→") suggesting series continuation.
`
};

// Contexto específico por funcionalidade
const funcionalidadeScenes: Record<string, string> = {
  'otp-whatsapp': `
Focus on the moment of OTP confirmation via WhatsApp. 
Show a smartphone with WhatsApp-style interface open, displaying a verification code message 
(use abstract numbers like "1234" or asterisks).
The phone is held by a professional-looking hand (well-manicured, could show watch or blazer cuff).
A luxury property is visible in the soft background.
Emphasize: instant security verification, professional process, modern technology.
Include subtle elements: lock icon, checkmark, shield overlay.
`,
  'qr-code': `
Show a modern smartphone scanning a QR code on an official-looking document.
The phone screen displays a green checkmark and "Verified" style confirmation.
The document has a professional layout suggesting an official visit receipt.
Background: professional setting - could be desk, property entrance, or office.
Emphasize: instant verification, anti-fraud protection, cutting-edge technology.
Person holding phone should look professional and confident.
`,
  'pdf': `
Display a premium, professional PDF document visible on a tablet or large smartphone screen.
The document shows a clean, official visit receipt layout with visible sections 
for signatures (digital signature style), dates, and property info.
Background: executive desk setting with subtle real estate elements (property keys, 
branded folder, pen).
Emphasize: professionalism, legal documentation, permanent record keeping.
The document should look official and trustworthy.
`,
  'crm': `
Show an organized, beautiful CRM dashboard on a laptop or tablet screen in a modern office.
Display organized client cards, property listings with thumbnails, and activity timeline.
The interface should look clean, modern, and professional.
Background: contemporary real estate office with modern furniture, perhaps with 
an agent working confidently.
Emphasize: organization, efficiency, complete client overview, smart management.
`,
  'mobile': `
Lifestyle shot of a real estate agent walking or standing outside a luxury property, 
actively using their smartphone. Natural, candid moment.
The phone screen subtly shows an app interface (don't need to be detailed).
The agent is professionally dressed but in motion - showing the mobile, on-the-go nature.
Style: lifestyle photography, natural outdoor lighting, professional but relaxed.
Emphasize: mobility, convenience, always connected, work from anywhere.
Property in background should be impressive and high-end.
`,
  'parcerias': `
Two professional real estate agents collaborating or sealing a deal.
Could be shaking hands, one showing their phone to the other displaying partnership details,
or both looking at a shared screen/document with smiles.
Setting: modern office meeting room or upscale property entrance.
Both agents look professional, diverse, and successful.
Emphasize: collaboration, trust between professionals, shared success, easy partnership.
Subtle elements suggesting commission split or collaboration.
`,
  'dashboard': `
Beautiful analytics dashboard with charts, performance graphs, and KPIs on a large screen 
or modern monitor.
Show visually appealing metrics: bar charts, line graphs, percentage indicators, visit counts.
An agent or manager viewing the dashboard with an expression of satisfaction and insight.
Style: tech-forward, data-driven, executive decision-making aesthetic.
Emphasize: real-time insights, performance tracking, smart business decisions, analytics power.
`,
  'geral': `
Hero composition combining key brand elements in an aspirational scene:
A confident, successful real estate agent (professionally dressed, warm smile) standing 
with a satisfied client in front of an impressive modern property.
The agent holds a smartphone showing a clean app interface with checkmarks.
The client could be holding keys or signing something digitally.
Background: stunning high-end property facade - modern architecture, landscaping.
Emphasize: complete solution, total professionalism, trust, success, modern real estate.
This is the flagship, "about us" style hero image.
`
};

async function generateDescription(
  apiKey: string,
  template: string,
  titulo: string,
  subtitulo: string,
  funcionalidade: string
): Promise<string> {
  const templateStyle = templateStyles[template] || templateStyles['feature'];
  const funcDesc = funcionalidadeDescriptionsForText[funcionalidade] || funcionalidadeDescriptionsForText['geral'];

  const descriptionPrompt = `Crie uma descrição profissional para um post de Instagram sobre o app VisitaProva.

CONTEXTO:
- App: VisitaProva - plataforma de gestão de visitas imobiliárias para PROVA DE INTERMEDIAÇÃO
- O app protege o corretor juridicamente, registrando visitas com confirmação via WhatsApp
- Funcionalidade destacada: ${funcDesc}
- Título do post: ${titulo}
- Subtítulo: ${subtitulo}
- Tipo de post: ${template}

ESTILO DESTE POST:
${templateStyle}

ESTRUTURA OBRIGATÓRIA (siga essa ordem):
1. HOOK (primeira linha): Frase forte que chama atenção imediata. Use emoji relevante no início.
2. PROBLEMA (2-3 linhas): Descreva uma dor/frustração que corretores enfrentam (ex: cliente que some, disputa de comissão, falta de prova).
3. SOLUÇÃO (2-3 linhas): Como o VisitaProva resolve esse problema. Use ✅ ou 💡.
4. BENEFÍCIO (1-2 linhas): O resultado positivo - proteção jurídica, paz de espírito, profissionalismo.
5. PERGUNTA (1 linha): Uma pergunta para gerar engajamento nos comentários.
6. CTA (1 linha): Chamada para ação. Ex: "Link na bio" ou "Salve esse post".

REGRAS IMPORTANTES:
- Escreva em português brasileiro natural
- Use emojis estrategicamente (máximo 1 por seção, não exagere)
- Tom profissional mas acessível - fale de corretor para corretor
- Máximo 250 palavras
- NÃO inclua hashtags na descrição (serão adicionadas separadamente)
- Evite jargões técnicos demais
- Fale diretamente com o corretor (use "você")
- Foque em PROTEÇÃO JURÍDICA e PROVA DE INTERMEDIAÇÃO como conceitos centrais

Retorne APENAS o texto da descrição, sem explicações adicionais.`;

  try {
    const descResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: descriptionPrompt }]
      }),
    });

    if (descResponse.ok) {
      const descData = await descResponse.json();
      const content = descData.choices?.[0]?.message?.content || '';
      console.log('Generated description:', content.substring(0, 100) + '...');
      return content;
    } else {
      console.error('Description generation failed:', descResponse.status);
      return '';
    }
  } catch (descError) {
    console.error('Error generating description:', descError);
    return '';
  }
}

function getFallbackDescription(titulo: string, subtitulo: string): string {
  return `🔐 ${titulo}

${subtitulo}

✅ Com o VisitaProva, sua prova de intermediação fica garantida. Proteção jurídica real para o seu trabalho.

👉 Já conhece o app? Conta pra gente nos comentários!

📲 Link na bio`;
}

function buildLegenda(descricao: string, funcionalidade: string): { legenda: string; hashtags: string[] } {
  const hashtagsFunc = hashtagsPorFuncionalidade[funcionalidade] || hashtagsPorFuncionalidade['geral'];
  const allHashtags = [...hashtagsBase, ...hashtagsFunc].slice(0, 10);
  
  const legenda = `${descricao}

${allHashtags.join(' ')}`;

  return { legenda, hashtags: allHashtags };
}

function getAspectRatioAndDimensions(formato: string): { aspectRatio: string; dimensions: string; width: number; height: number } {
  switch (formato) {
    case 'quadrado':
      return { aspectRatio: '1:1', dimensions: '1080x1080 pixels', width: 1080, height: 1080 };
    case 'vertical':
      return { aspectRatio: '4:5', dimensions: '1080x1350 pixels', width: 1080, height: 1350 };
    case 'stories':
      return { aspectRatio: '9:16', dimensions: '1080x1920 pixels', width: 1080, height: 1920 };
    default:
      return { aspectRatio: '1:1', dimensions: '1080x1080 pixels', width: 1080, height: 1080 };
  }
}

function buildPremiumImagePrompt(
  template: string,
  funcionalidade: string,
  formato: string,
  estilo: string
): string {
  const { aspectRatio, dimensions } = getAspectRatioAndDimensions(formato);
  const visualScenario = visualScenarios[template] || visualScenarios['feature'];
  const funcScene = funcionalidadeScenes[funcionalidade] || funcionalidadeScenes['geral'];

  // Color palette based on style
  const colorPalette = estilo === 'claro'
    ? `Light, airy backgrounds with professional studio lighting. 
Soft whites, light creams, subtle gray tones.
Accent colors: deep navy blue (#2563EB), subtle gold or warm touches, emerald green (#10B981) for trust indicators and checkmarks.
Overall feel: clean, bright, modern, trustworthy.`
    : `Rich, sophisticated dark tones for a premium executive feel.
Deep navy (#0F172A), charcoal blacks, dark gradients.
Accent colors: bright electric blue (#60A5FA), gold/amber highlights for warmth, emerald green (#10B981) for trust indicators.
Overall feel: premium, executive, authoritative, modern tech.`;

  // Format-specific instructions
  const formatInstructions = formato === 'stories' 
    ? `CRITICAL: This is for Instagram STORIES - VERTICAL PORTRAIT orientation.
The image MUST be much TALLER than wide. Aspect ratio 9:16.
HEIGHT is approximately 1.78x the WIDTH.
Think phone screen in portrait mode.
Leave some space at top and bottom for text overlays.`
    : formato === 'vertical'
    ? `This is for Instagram FEED VERTICAL post - PORTRAIT orientation.
The image should be taller than wide. Aspect ratio 4:5.
Optimized for feed scroll - vertical rectangle.`
    : `This is for Instagram FEED SQUARE post.
The image MUST be PERFECTLY SQUARE. Aspect ratio 1:1.
Width equals height exactly.`;

  return `Create a PREMIUM ADVERTISING PHOTOGRAPHY image for VisitaProva, 
a Brazilian real estate visit management platform focused on LEGAL PROTECTION and 
PROOF OF BROKERAGE INTERMEDIATION.

=== CRITICAL: IMAGE DIMENSIONS ===
Aspect ratio: ${aspectRatio}
Output size: ${dimensions}
${formatInstructions}

=== VISUAL STYLE: ULTRA-REALISTIC ADVERTISING PHOTOGRAPHY ===
Style: Professional advertising campaign photography
Quality: High-end commercial photography, magazine-quality
Target market: Premium Brazilian real estate sector
Aesthetic: PropTech / LegalTech startup meets luxury real estate

IMPORTANT VISUAL RULES:
- PHOTOREALISTIC - must look like a real professional photo shoot
- Include REAL, ATTRACTIVE PEOPLE when the scenario calls for it
- Brazilian market aesthetic - diverse, professional, aspirational
- Professional advertising lighting - studio quality or golden hour outdoor
- NO cheesy stock photo vibes - authentic, premium feel
- NO text or Portuguese words in the image (text added separately)
- Clean composition with clear focal point

=== COLOR PALETTE ===
${colorPalette}

=== MAIN SCENARIO ===
${visualScenario}

=== FEATURE CONTEXT ===
${funcScene}

=== BRAND ELEMENTS (SUBTLE INTEGRATION) ===
Include the VisitaProva "VP" logo with these EXACT specifications:
- OUTER SHAPE: Dark navy/slate (#0F172A) rounded square with subtle rounded corners
- INNER FRAME: A white/light gray rounded rectangle frame inside the square
- GRID PATTERN: White/light gray horizontal and vertical lines creating a connection matrix pattern
- CONNECTION DOTS: Small circular dots at grid intersections - mix of white and bright blue dots
- The dots suggest connection points, like a network or circuit board pattern
- "VP" LETTERS: Bold, modern "VP" text in BRIGHT BLUE (#60A5FA) positioned on the right side of the grid
- The "VP" overlays part of the grid, creating depth
- Overall aesthetic: tech/network visualization, suggests connectivity and verification
- Logo placement: corner (top-left or bottom-right) - subtle, professional watermark style
- Logo size: approximately 10-15% of image width
- The logo represents: security, digital connections, verification network, modern technology

=== EMOTIONAL TONE ===
The image should evoke:
- SECURITY and PROTECTION - the viewer feels safe
- PROFESSIONALISM and TRUST - high credibility
- MODERNITY and INNOVATION - cutting-edge technology
- SUCCESS and CONFIDENCE - aspirational lifestyle
- LEGAL AUTHORITY - official, documented, protected

=== IMPLICIT MESSAGE ===
Without any text, the image should communicate:
"This is how modern, protected real estate professionals work.
Legal security is invisible but always present.
Professional documentation prevents future disputes."

TARGET AUDIENCE: Brazilian real estate agents and agencies seeking to protect their 
brokerage intermediation with documented, verified proof of property visits.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { template, titulo, subtitulo, funcionalidade, formato, estilo, onlyDescription }: MarketingImageRequest = await req.json();
    
    console.log('Request received:', { template, titulo, funcionalidade, formato, estilo, onlyDescription });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Se for apenas regenerar descrição
    if (onlyDescription) {
      console.log('Generating only description...');
      
      let descricao = await generateDescription(LOVABLE_API_KEY, template, titulo, subtitulo, funcionalidade);
      
      if (!descricao) {
        descricao = getFallbackDescription(titulo, subtitulo);
      }

      const { legenda, hashtags } = buildLegenda(descricao, funcionalidade);

      return new Response(JSON.stringify({ 
        success: true,
        legenda,
        hashtags
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gerar imagem completa com prompts premium
    console.log('Generating premium marketing image...');

    const { width: targetWidth, height: targetHeight } = getAspectRatioAndDimensions(formato);
    const prompt = buildPremiumImagePrompt(template, funcionalidade, formato, estilo);

    console.log('Sending premium image prompt to AI Gateway');
    console.log('Prompt length:', prompt.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Limite de requisições excedido. Tente novamente em alguns minutos." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Créditos insuficientes. Adicione créditos ao workspace." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI Gateway response received');

    // Extrair a imagem da resposta
    const message = data.choices?.[0]?.message;
    let imageData = null;
    let textContent = null;

    // Extrair texto do content
    if (message?.content) {
      if (typeof message.content === 'string') {
        textContent = message.content;
      }
    }

    // Extrair imagem do array images
    if (message?.images && Array.isArray(message.images)) {
      for (const img of message.images) {
        if (img.type === 'image_url' && img.image_url?.url) {
          imageData = img.image_url.url;
          break;
        }
      }
    }

    if (!imageData) {
      console.error('No image in response:', JSON.stringify(data, null, 2));
      return new Response(JSON.stringify({ 
        error: "Não foi possível gerar a imagem. Tente novamente.",
        debug: textContent || "Sem detalhes adicionais"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Redimensionar imagem para garantir formato correto
    console.log('Resizing image to correct dimensions:', targetWidth, 'x', targetHeight);
    try {
      // Extrair base64 da imagem
      const base64Match = imageData.match(/^data:image\/\w+;base64,(.+)$/);
      if (base64Match) {
        const base64Data = base64Match[1];
        
        // Decodificar base64 para bytes
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Carregar imagem
        const img = await Image.decode(bytes);
        console.log(`Original image size: ${img.width}x${img.height}`);
        
        // Redimensionar usando cover (preenche a área mantendo proporção, com crop se necessário)
        const resized = img.cover(targetWidth, targetHeight);
        console.log(`Resized image size: ${resized.width}x${resized.height}`);
        
        // Re-codificar para PNG
        const outputBytes = await resized.encode();
        
        // Converter para base64
        let binaryStr = '';
        for (let i = 0; i < outputBytes.length; i++) {
          binaryStr += String.fromCharCode(outputBytes[i]);
        }
        const newBase64 = btoa(binaryStr);
        imageData = `data:image/png;base64,${newBase64}`;
        
        console.log('Image successfully resized to', targetWidth, 'x', targetHeight);
      }
    } catch (resizeError) {
      console.error('Error resizing image:', resizeError);
      // Continua com a imagem original se houver erro no redimensionamento
    }

    // Gerar descrição profissional
    console.log('Generating professional description...');
    
    let descricao = await generateDescription(LOVABLE_API_KEY, template, titulo, subtitulo, funcionalidade);
    
    if (!descricao) {
      descricao = getFallbackDescription(titulo, subtitulo);
    }

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

  } catch (error) {
    console.error('Error generating marketing image:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro desconhecido ao gerar imagem" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
