import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate unique token for verification link
function generateToken(): string {
  return crypto.randomUUID();
}

// Format phone number for WhatsApp (E.164 format without +)
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  return cleaned;
}

// Send WhatsApp message via ZionTalk (using correct API format)
async function sendViaZionTalk(phone: string, message: string): Promise<boolean> {
  const apiKey = Deno.env.get('ZIONTALK_API_KEY');

  if (!apiKey) {
    console.log('ZionTalk API not configured, using simulation mode');
    return false;
  }

  try {
    const formattedPhone = `+${formatPhoneNumber(phone)}`;
    const authHeader = btoa(`${apiKey}:`);
    
    console.log(`Sending WhatsApp to ${formattedPhone} via ZionTalk`);

    // Use FormData as per ZionTalk API documentation
    const formData = new FormData();
    formData.append('receiver', formattedPhone);
    formData.append('message', message);

    const response = await fetch('https://app.ziontalk.com/api/send_message/', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
      },
      body: formData,
    });

    const responseText = await response.text();
    console.log(`ZionTalk response status: ${response.status}`);
    console.log(`ZionTalk response: ${responseText.substring(0, 300)}`);

    if (!response.ok) {
      console.error('ZionTalk error:', responseText);
      return false;
    }

    console.log('Message sent via ZionTalk');
    return true;
  } catch (error) {
    console.error('ZionTalk error:', error);
    return false;
  }
}

// Legacy: Send WhatsApp message via Evolution API
async function sendViaEvolutionAPI(phone: string, message: string): Promise<boolean> {
  const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
  const evolutionInstance = Deno.env.get('EVOLUTION_INSTANCE');

  if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstance) {
    return false;
  }

  try {
    const response = await fetch(`${evolutionApiUrl}/message/sendText/${evolutionInstance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        number: `55${phone.replace(/\D/g, '')}`,
        text: message,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Evolution API error:', error);
      return false;
    }

    console.log('Message sent via Evolution API');
    return true;
  } catch (error) {
    console.error('Evolution API error:', error);
    return false;
  }
}

// Legacy: Send WhatsApp message via Z-API
async function sendViaZAPI(phone: string, message: string): Promise<boolean> {
  const zapiInstanceId = Deno.env.get('ZAPI_INSTANCE_ID');
  const zapiToken = Deno.env.get('ZAPI_TOKEN');
  const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

  if (!zapiInstanceId || !zapiToken) {
    return false;
  }

  try {
    const response = await fetch(`https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': zapiClientToken || '',
      },
      body: JSON.stringify({
        phone: `55${phone.replace(/\D/g, '')}`,
        message: message,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Z-API error:', error);
      return false;
    }

    console.log('Message sent via Z-API');
    return true;
  } catch (error) {
    console.error('Z-API error:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { ficha_id, tipo } = await req.json();

    if (!ficha_id || !tipo || !['proprietario', 'comprador'].includes(tipo)) {
      return new Response(
        JSON.stringify({ error: 'ficha_id e tipo (proprietario/comprador) são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get ficha data
    const { data: ficha, error: fichaError } = await supabase
      .from('fichas_visita')
      .select('*')
      .eq('id', ficha_id)
      .single();

    if (fichaError || !ficha) {
      return new Response(
        JSON.stringify({ error: 'Ficha não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get phone based on tipo
    const telefone = tipo === 'proprietario' ? ficha.proprietario_telefone : ficha.comprador_telefone;
    const nome = tipo === 'proprietario' ? ficha.proprietario_nome : ficha.comprador_nome;

    // Generate OTP and token
    const codigo = generateOTP();
    const token = generateToken();
    const expiraEm = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Check if there's already a pending OTP for this ficha/tipo
    const { data: existingOtp } = await supabase
      .from('confirmacoes_otp')
      .select('*')
      .eq('ficha_id', ficha_id)
      .eq('tipo', tipo)
      .eq('confirmado', false)
      .gte('expira_em', new Date().toISOString())
      .maybeSingle();

    if (existingOtp) {
      // Delete existing pending OTP
      await supabase
        .from('confirmacoes_otp')
        .delete()
        .eq('id', existingOtp.id);
    }

    // Insert new OTP
    const { error: insertError } = await supabase
      .from('confirmacoes_otp')
      .insert({
        ficha_id,
        tipo,
        codigo,
        telefone,
        token,
        expira_em: expiraEm.toISOString(),
      });

    if (insertError) {
      console.error('Error inserting OTP:', insertError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar OTP' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build verification URL
    const appUrl = Deno.env.get('APP_URL') || 'https://preview--visitasegura.lovable.app';
    const verificationUrl = `${appUrl}/confirmar/${token}`;

    // Format visit date
    const dataVisita = new Date(ficha.data_visita);
    const dataFormatada = dataVisita.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Try to get custom template for this user
    const templateTipo = tipo === 'proprietario' ? 'criacao_proprietario' : 'criacao_comprador';
    const { data: customTemplate } = await supabase
      .from('templates_mensagem')
      .select('conteudo')
      .eq('user_id', ficha.user_id)
      .eq('tipo', templateTipo)
      .eq('ativo', true)
      .maybeSingle();

    let message: string;

    if (customTemplate?.conteudo) {
      // Use custom template with variable replacement
      message = customTemplate.conteudo
        .replace(/{nome}/g, nome)
        .replace(/{endereco}/g, ficha.imovel_endereco)
        .replace(/{tipo_imovel}/g, ficha.imovel_tipo)
        .replace(/{data_visita}/g, dataFormatada)
        .replace(/{protocolo}/g, ficha.protocolo)
        .replace(/{codigo}/g, codigo)
        .replace(/{link}/g, verificationUrl);
      
      console.log('Using custom template for user:', ficha.user_id);
    } else {
      // Use default message
      const tipoLabel = tipo === 'proprietario' ? 'proprietário' : 'visitante';
      message = `🏠 *VisitaSegura*\n\nOlá ${nome}!\n\nVocê está sendo convidado a confirmar uma visita ao imóvel:\n\n📍 *${ficha.imovel_endereco}*\n🏷️ ${ficha.imovel_tipo}\n📅 ${dataFormatada}\n📋 Protocolo: ${ficha.protocolo}\n\nComo ${tipoLabel}, seu código de confirmação é:\n\n🔐 *${codigo}*\n\nOu clique no link para confirmar:\n${verificationUrl}\n\n⏰ Este código expira em 30 minutos.\n\n_Não compartilhe este código com ninguém._`;
      
      console.log('Using default template');
    }

    // Try to send via ZionTalk first (primary)
    let sent = await sendViaZionTalk(telefone, message);
    
    // Fallback to Evolution API
    if (!sent) {
      sent = await sendViaEvolutionAPI(telefone, message);
    }
    
    // Fallback to Z-API
    if (!sent) {
      sent = await sendViaZAPI(telefone, message);
    }

    // Update ficha status
    const newStatus = tipo === 'proprietario' 
      ? 'aguardando_proprietario'
      : 'aguardando_comprador';

    await supabase
      .from('fichas_visita')
      .update({ status: newStatus })
      .eq('id', ficha_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: sent ? 'OTP enviado via WhatsApp' : 'OTP gerado (modo simulação)',
        simulation: !sent,
        codigo: !sent ? codigo : undefined, // Only return code in simulation mode
        token,
        verification_url: verificationUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in send-otp function:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
