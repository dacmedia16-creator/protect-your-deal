import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { template, titulo, subtitulo, funcionalidade, formato, estilo }: MarketingImageRequest = await req.json();
    
    console.log('Generating marketing image:', { template, titulo, funcionalidade, formato, estilo });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Dimensões baseadas no formato
    const dimensions = formato === 'quadrado' 
      ? '1080x1080 pixels (1:1 square ratio)'
      : '1080x1350 pixels (4:5 vertical ratio)';

    // Cores baseadas no estilo
    const colors = estilo === 'claro'
      ? 'light background (white or soft gradient), with emerald green (#10B981) and royal blue (#3B82F6) accents'
      : 'dark background (black, deep navy, or dark gradient), with emerald green (#10B981) and electric blue (#60A5FA) accents';

    // Templates de prompt baseados no tipo
    const templateDescriptions: Record<string, string> = {
      'feature': 'Modern tech-style feature highlight with prominent icon, clean layout',
      'dica': 'Professional tip card with lightbulb icon, educational and friendly style',
      'antes-depois': 'Side-by-side visual comparison: traditional method (paper, pen, chaos) vs digital method (app, organization, modernity)',
      'estatistica': 'Clean infographic with large number display, data-driven style, minimalist charts',
      'depoimento': 'Elegant testimonial card with large quotation marks, profile placeholder',
      'carrossel': 'Carousel slide with corner numbering, consistent design for series',
    };

    // Descrições de funcionalidades para contexto visual
    const funcionalidadeDescriptions: Record<string, string> = {
      'otp-whatsapp': 'WhatsApp OTP verification - show phone with WhatsApp icon and security lock',
      'qr-code': 'QR Code scanning - show phone scanning QR code with checkmark',
      'pdf': 'PDF document generation - show professional document with signature icon',
      'crm': 'CRM system - show organized client cards and property listings',
      'mobile': 'Mobile app - show smartphone with app interface mockup',
      'parcerias': 'Partnership system - show two people/hands connecting or handshake icon',
      'dashboard': 'Dashboard analytics - show charts, graphs, and metrics display',
      'geral': 'Complete real estate management - show shield with house icon',
    };

    const templateDesc = templateDescriptions[template] || templateDescriptions['feature'];
    const funcDesc = funcionalidadeDescriptions[funcionalidade] || funcionalidadeDescriptions['geral'];

    // Prompt em inglês para melhor qualidade de geração
    const prompt = `Create a professional Instagram marketing image for "VisitaSegura", a Brazilian real estate management app.

SPECIFICATIONS:
- Dimensions: ${dimensions}
- Visual style: ${colors}
- Post type: ${templateDesc}
- Feature to highlight: ${funcDesc}

VISUAL ELEMENTS TO INCLUDE:
- Shield icon or house icon representing real estate security
- Modern, tech-inspired abstract graphics
- Professional gradient backgrounds
- Clean geometric shapes and patterns
- Smartphone mockups showing the app (optional)
- Icons representing the feature (locks, QR codes, documents, etc.)

CRITICAL TEXT RULES:
- Include ONLY the brand name "VisitaSegura" as text
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

    console.log('Sending prompt to AI Gateway');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          { 
            role: "user", 
            content: prompt
          }
        ],
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
    console.log('AI Gateway response received:', JSON.stringify(data, null, 2));

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

    // Extrair imagem do array images (estrutura correta da API)
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

    // Gerar legenda com hashtags
    const hashtags = [
      '#corretordeimoveis',
      '#imobiliaria', 
      '#mercadoimobiliario',
      '#visitasegura',
      '#tecnologia',
      '#imoveis',
      '#corretor',
      '#gestao'
    ];
    
    const legenda = `${titulo}

${subtitulo}

${hashtags.slice(0, 6).join(' ')}`;

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
