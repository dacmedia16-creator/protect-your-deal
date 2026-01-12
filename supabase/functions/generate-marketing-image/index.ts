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
    const dimensoes = formato === 'quadrado' 
      ? '1080x1080 pixels (proporção 1:1)'
      : '1080x1350 pixels (proporção 4:5)';

    // Cores baseadas no estilo
    const cores = estilo === 'claro'
      ? 'fundo branco ou gradiente suave de tons claros, texto escuro (preto ou azul marinho), acentos em verde esmeralda (#10B981) ou azul royal (#3B82F6)'
      : 'fundo escuro (preto, azul marinho profundo ou gradiente escuro), texto branco ou claro, acentos em verde esmeralda (#10B981) ou azul elétrico (#60A5FA)';

    // Templates de prompt baseados no tipo
    const templateDescriptions: Record<string, string> = {
      'feature': `Um design de destaque para funcionalidade de app, estilo moderno e tech, com ícone representativo em destaque, título grande e impactante`,
      'dica': `Um card de dica profissional, estilo educativo e amigável, com ícone de lâmpada ou similar, layout tipo "Dica do Dia"`,
      'antes-depois': `Uma comparação visual lado a lado entre método tradicional (papel, caneta, desorganização) e método digital (app, organização, modernidade)`,
      'estatistica': `Um infográfico limpo com número grande em destaque, estilo data-driven, gráficos minimalistas`,
      'depoimento': `Um card de citação/testimonial elegante, com aspas grandes, foto placeholder de perfil, nome e cargo`,
      'carrossel': `Um slide de carrossel explicativo, numeração no canto, design consistente para série de posts`,
    };

    // Descrições de funcionalidades para contexto
    const funcionalidadeDescriptions: Record<string, string> = {
      'otp-whatsapp': 'Confirmação via código OTP no WhatsApp - segurança na palma da mão',
      'qr-code': 'QR Code para verificação instantânea de comprovantes',
      'pdf': 'Geração automática de PDFs profissionais com assinatura digital',
      'crm': 'CRM integrado para gestão de clientes e imóveis',
      'mobile': 'Aplicativo mobile para acesso em qualquer lugar',
      'parcerias': 'Sistema de parcerias entre corretores',
      'dashboard': 'Dashboard com métricas e relatórios em tempo real',
      'geral': 'Sistema completo de gestão para corretores de imóveis',
    };

    const templateDesc = templateDescriptions[template] || templateDescriptions['feature'];
    const funcDesc = funcionalidadeDescriptions[funcionalidade] || funcionalidadeDescriptions['geral'];

    const prompt = `Crie uma imagem profissional para post de Instagram sobre um aplicativo de gestão imobiliária chamado "VisitaSegura".

ESPECIFICAÇÕES:
- Dimensões: ${dimensoes}
- Estilo visual: ${cores}
- Tipo de post: ${templateDesc}
- Funcionalidade em destaque: ${funcDesc}

CONTEÚDO:
- Título principal: "${titulo}"
- Subtítulo: "${subtitulo}"

ELEMENTOS OBRIGATÓRIOS:
- Logo/marca "VisitaSegura" discretamente posicionado (canto inferior ou superior)
- Ícone de escudo ou casa estilizado representando segurança imobiliária
- Design clean, moderno e profissional
- Tipografia bold para o título, leve para o subtítulo
- Elementos gráficos abstratos ou ícones relacionados ao tema imobiliário (casas, chaves, documentos, celulares)

PÚBLICO-ALVO: Corretores de imóveis brasileiros que buscam modernizar seu trabalho

IMPORTANTE:
- NÃO incluir texto genérico ou placeholder
- Usar EXATAMENTE os textos fornecidos
- Design deve ser limpo e sem poluição visual
- Priorizar legibilidade e impacto visual`;

    console.log('Sending prompt to AI Gateway');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
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
    console.log('AI Gateway response received');

    // Extrair a imagem da resposta
    const message = data.choices?.[0]?.message;
    let imageData = null;
    let textContent = null;

    if (message?.content) {
      if (Array.isArray(message.content)) {
        for (const part of message.content) {
          if (part.type === 'image' && part.image) {
            imageData = part.image;
          } else if (part.type === 'text') {
            textContent = part.text;
          }
        }
      } else if (typeof message.content === 'string') {
        textContent = message.content;
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

    return new Response(JSON.stringify({ 
      success: true,
      image: imageData,
      description: textContent
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
