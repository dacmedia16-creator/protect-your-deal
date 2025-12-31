import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ZIONTALK_API_URL = 'https://app.ziontalk.com/api';

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  return '+' + cleaned;
}

async function sendWhatsAppMessage(apiKey: string, phone: string, message: string): Promise<boolean> {
  const authHeader = btoa(`${apiKey}:`);
  const formattedPhone = formatPhoneNumber(phone);
  
  const formData = new FormData();
  formData.append('msg', message);
  formData.append('mobile_phone', formattedPhone);

  try {
    const response = await fetch(`${ZIONTALK_API_URL}/send_message/`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
      },
      body: formData,
    });
    
    console.log(`WhatsApp sent to ${formattedPhone}: status ${response.status}`);
    return response.status === 201;
  } catch (error) {
    console.error(`Error sending WhatsApp to ${formattedPhone}:`, error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Iniciando verificação de lembretes de visita ===');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const zionTalkApiKey = Deno.env.get('ZIONTALK_API_KEY');

    if (!zionTalkApiKey) {
      console.error('ZIONTALK_API_KEY não configurada');
      return new Response(
        JSON.stringify({ success: false, error: 'API Key não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar visitas que ocorrerão em aproximadamente 1 hora (entre 55min e 65min)
    const now = new Date();
    const minTime = new Date(now.getTime() + 55 * 60 * 1000); // 55 minutos a partir de agora
    const maxTime = new Date(now.getTime() + 65 * 60 * 1000); // 65 minutos a partir de agora

    console.log(`Buscando visitas entre ${minTime.toISOString()} e ${maxTime.toISOString()}`);

    const { data: fichas, error: fichasError } = await supabase
      .from('fichas_visita')
      .select(`
        id,
        protocolo,
        imovel_endereco,
        imovel_tipo,
        data_visita,
        comprador_nome,
        comprador_telefone,
        proprietario_nome,
        proprietario_telefone,
        user_id,
        status
      `)
      .gte('data_visita', minTime.toISOString())
      .lte('data_visita', maxTime.toISOString())
      .in('status', ['pendente', 'aguardando_comprador', 'aguardando_proprietario']);

    if (fichasError) {
      console.error('Erro ao buscar fichas:', fichasError);
      throw fichasError;
    }

    console.log(`Encontradas ${fichas?.length || 0} visitas para lembrete`);

    if (!fichas || fichas.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhuma visita próxima para lembrete',
          checked_at: now.toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = {
      total: fichas.length,
      enviados: 0,
      falhas: 0,
      detalhes: [] as Array<{ ficha: string; para: string; sucesso: boolean }>
    };

    for (const ficha of fichas) {
      // Buscar dados do corretor
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, telefone')
        .eq('user_id', ficha.user_id)
        .maybeSingle();

      const dataVisita = new Date(ficha.data_visita);
      const horaFormatada = dataVisita.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });

      // Mensagem para o corretor
      if (profile?.telefone) {
        const mensagemCorretor = `🏠 *Lembrete de Visita*\n\n` +
          `Olá ${profile.nome?.split(' ')[0] || 'Corretor'}!\n\n` +
          `Você tem uma visita agendada para *${horaFormatada}*:\n\n` +
          `📍 *Endereço:* ${ficha.imovel_endereco}\n` +
          `🏢 *Tipo:* ${ficha.imovel_tipo}\n` +
          (ficha.comprador_nome ? `👤 *Visitante:* ${ficha.comprador_nome}\n` : '') +
          `\n📋 Protocolo: ${ficha.protocolo}`;

        const sucessoCorretor = await sendWhatsAppMessage(zionTalkApiKey, profile.telefone, mensagemCorretor);
        results.detalhes.push({ 
          ficha: ficha.protocolo, 
          para: 'corretor', 
          sucesso: sucessoCorretor 
        });
        
        if (sucessoCorretor) {
          results.enviados++;
        } else {
          results.falhas++;
        }
      }

      // Mensagem para o comprador/visitante
      if (ficha.comprador_telefone && ficha.comprador_nome) {
        const mensagemComprador = `🏠 *Lembrete de Visita*\n\n` +
          `Olá ${ficha.comprador_nome.split(' ')[0]}!\n\n` +
          `Sua visita ao imóvel está agendada para *${horaFormatada}*:\n\n` +
          `📍 *Endereço:* ${ficha.imovel_endereco}\n` +
          `🏢 *Tipo:* ${ficha.imovel_tipo}\n` +
          (profile?.nome ? `👔 *Corretor:* ${profile.nome}\n` : '') +
          `\n📋 Protocolo: ${ficha.protocolo}`;

        const sucessoComprador = await sendWhatsAppMessage(zionTalkApiKey, ficha.comprador_telefone, mensagemComprador);
        results.detalhes.push({ 
          ficha: ficha.protocolo, 
          para: 'comprador', 
          sucesso: sucessoComprador 
        });
        
        if (sucessoComprador) {
          results.enviados++;
        } else {
          results.falhas++;
        }
      }

      // Pequeno delay entre envios para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Lembretes processados: ${results.enviados} enviados, ${results.falhas} falhas`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        ...results,
        checked_at: now.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro na função de lembretes:', errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
