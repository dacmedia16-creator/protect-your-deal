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
  formato: 'quadrado' | 'vertical';
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

// Descrições de funcionalidades para contexto visual (prompt de imagem)
const funcionalidadeDescriptionsForImage: Record<string, string> = {
  'otp-whatsapp': 'WhatsApp OTP verification - show phone with WhatsApp icon and security lock',
  'qr-code': 'QR Code scanning - show phone scanning QR code with checkmark',
  'pdf': 'PDF document generation - show professional document with signature icon',
  'crm': 'CRM system - show organized client cards and property listings',
  'mobile': 'Mobile app - show smartphone with app interface mockup',
  'parcerias': 'Partnership system - show two people/hands connecting or handshake icon',
  'dashboard': 'Dashboard analytics - show charts, graphs, and metrics display',
  'geral': 'Complete real estate management - show shield with house icon',
};

// Templates de prompt para imagem
const templateDescriptions: Record<string, string> = {
  'feature': 'Modern tech-style feature highlight with prominent icon, clean layout',
  'dica': 'Professional tip card with lightbulb icon, educational and friendly style',
  'antes-depois': 'Side-by-side visual comparison: traditional method (paper, pen, chaos) vs digital method (app, organization, modernity)',
  'estatistica': 'Clean infographic with large number display, data-driven style, minimalist charts',
  'depoimento': 'Elegant testimonial card with large quotation marks, profile placeholder',
  'carrossel': 'Carousel slide with corner numbering, consistent design for series',
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
- App: VisitaProva - plataforma de gestão de visitas imobiliárias
- Funcionalidade destacada: ${funcDesc}
- Título do post: ${titulo}
- Subtítulo: ${subtitulo}
- Tipo de post: ${template}

ESTILO DESTE POST:
${templateStyle}

ESTRUTURA OBRIGATÓRIA (siga essa ordem):
1. HOOK (primeira linha): Frase forte que chama atenção imediata. Use emoji relevante no início.
2. PROBLEMA (2-3 linhas): Descreva uma dor/frustração que corretores enfrentam.
3. SOLUÇÃO (2-3 linhas): Como o VisitaProva resolve esse problema. Use ✅ ou 💡.
4. BENEFÍCIO (1-2 linhas): O resultado positivo de usar a ferramenta.
5. PERGUNTA (1 linha): Uma pergunta para gerar engajamento nos comentários.
6. CTA (1 linha): Chamada para ação. Ex: "Link na bio" ou "Salve esse post".

REGRAS IMPORTANTES:
- Escreva em português brasileiro natural
- Use emojis estrategicamente (máximo 1 por seção, não exagere)
- Tom profissional mas acessível
- Máximo 250 palavras
- NÃO inclua hashtags na descrição (serão adicionadas separadamente)
- Evite jargões técnicos demais
- Fale diretamente com o corretor (use "você")

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

✅ Com o VisitaProva, sua rotina de visitas fica mais organizada e profissional.

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

    // Gerar imagem completa
    console.log('Generating marketing image...');

    // Dimensões baseadas no formato
    const aspectRatio = formato === 'quadrado' ? '1:1' : '4:5';
    const dimensions = formato === 'quadrado' 
      ? '1080x1080 pixels'
      : '1080x1350 pixels';

    // Cores baseadas no estilo
    const colors = estilo === 'claro'
      ? 'light background (white or soft gradient), with emerald green (#10B981) and royal blue (#3B82F6) accents'
      : 'dark background (black, deep navy, or dark gradient), with emerald green (#10B981) and electric blue (#60A5FA) accents';

    const templateDesc = templateDescriptions[template] || templateDescriptions['feature'];
    const funcDescImage = funcionalidadeDescriptionsForImage[funcionalidade] || funcionalidadeDescriptionsForImage['geral'];

    // Prompt em inglês para melhor qualidade de geração
    const prompt = `Create a professional Instagram marketing image for "VisitaProva", a Brazilian real estate management app.

=== CRITICAL: IMAGE DIMENSIONS ===
ASPECT RATIO: ${aspectRatio}
${formato === 'quadrado' 
  ? 'The image MUST be PERFECTLY SQUARE (1:1 ratio). Width equals height. Example: 1080x1080 pixels.' 
  : 'The image MUST be VERTICAL/PORTRAIT orientation (4:5 ratio). Height is GREATER than width. The image is TALLER than it is wide. Example: 1080x1350 pixels.'}
DO NOT generate a landscape (horizontal) image under any circumstances.
${formato === 'vertical' ? 'PORTRAIT MODE ONLY. HEIGHT > WIDTH.' : ''}

SPECIFICATIONS:
- Output size: ${dimensions}
- Visual style: ${colors}
- Post type: ${templateDesc}
- Feature to highlight: ${funcDescImage}

VISUAL ELEMENTS TO INCLUDE:
- Shield icon or house icon representing real estate security
- Modern, tech-inspired abstract graphics
- Professional gradient backgrounds
- Clean geometric shapes and patterns
- Smartphone mockups showing the app (optional)
- Icons representing the feature (locks, QR codes, documents, etc.)

CRITICAL TEXT RULES:
- Include ONLY the brand name "VisitaProva" as text
- DO NOT write any Portuguese sentences or phrases
- DO NOT include the title or subtitle as text in the image
- Use ONLY visual icons and graphics to represent concepts
- Maximum text allowed: 2 words total (just the brand name)
- If any text is needed, use UPPERCASE without accents

STYLE:
- Clean, modern, and professional
- Tech-focused aesthetic
- High contrast for visual impact
- Instagram-ready composition

TARGET AUDIENCE: Brazilian real estate agents looking to modernize their work`;

    console.log('Sending image prompt to AI Gateway');

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
    console.log('Resizing image to correct dimensions...');
    try {
      const targetWidth = 1080;
      const targetHeight = formato === 'quadrado' ? 1080 : 1350;
      
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
