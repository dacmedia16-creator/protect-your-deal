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
    console.log('[send-otp] ZionTalk API not configured, using simulation mode');
    return false;
  }

  try {
    // Log detalhado para diagnóstico
    console.log(`[send-otp] ========== ENVIO ZIONTALK ==========`);
    console.log(`[send-otp] Telefone ORIGINAL recebido: "${phone}"`);
    
    const formattedPhone = `+${formatPhoneNumber(phone)}`;
    console.log(`[send-otp] Telefone FORMATADO para API: "${formattedPhone}"`);
    
    const authHeader = btoa(`${apiKey}:`);

    // Use FormData as per ZionTalk API documentation
    const formData = new FormData();
    formData.append('mobile_phone', formattedPhone);
    formData.append('msg', message);
    
    console.log(`[send-otp] FormData mobile_phone: "${formattedPhone}"`);

    const response = await fetch('https://app.ziontalk.com/api/send_message/', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
      },
      body: formData,
    });

    const responseText = await response.text();
    console.log(`[send-otp] ZionTalk status: ${response.status}`);
    console.log(`[send-otp] ZionTalk resposta COMPLETA: ${responseText}`);
    
    // Tentar parsear JSON para ver detalhes do destinatário
    try {
      const responseJson = JSON.parse(responseText);
      console.log(`[send-otp] ZionTalk destinatário confirmado:`, responseJson.to || responseJson.phone || responseJson.mobile_phone || 'não informado na resposta');
      console.log(`[send-otp] ZionTalk response JSON:`, JSON.stringify(responseJson));
    } catch (e) {
      console.log(`[send-otp] Resposta não é JSON válido, conteúdo raw: ${responseText.substring(0, 500)}`);
    }

    if (!response.ok) {
      console.error('[send-otp] ZionTalk error:', responseText);
      return false;
    }

    console.log('[send-otp] ========== ENVIO CONCLUÍDO ==========');
    return true;
  } catch (error) {
    console.error('[send-otp] ZionTalk error:', error);
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

    const { ficha_id, tipo, app_url } = await req.json();

    if (!ficha_id || !tipo || !['proprietario', 'comprador'].includes(tipo)) {
      return new Response(
        JSON.stringify({ error: 'ficha_id e tipo (proprietario/comprador) são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from JWT token
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Check user role for rate limiting
    let userRole: string | null = null;
    if (userId) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      userRole = roleData?.role || null;
    }

    // Rate limit: 30 minutes for corretor role only
    const RATE_LIMIT_MINUTES = 30;
    if (userRole === 'corretor') {
      const thirtyMinutesAgo = new Date(Date.now() - RATE_LIMIT_MINUTES * 60 * 1000);
      
      // Check for recent OTP send for this ficha/tipo
      const { data: recentOtp } = await supabase
        .from('confirmacoes_otp')
        .select('created_at')
        .eq('ficha_id', ficha_id)
        .eq('tipo', tipo)
        .gte('created_at', thirtyMinutesAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentOtp) {
        const lastSent = new Date(recentOtp.created_at);
        const nextAvailable = new Date(lastSent.getTime() + RATE_LIMIT_MINUTES * 60 * 1000);
        const minutesRemaining = Math.ceil((nextAvailable.getTime() - Date.now()) / 60000);
        
        console.log(`Rate limit hit for corretor ${userId}. Last OTP sent at ${lastSent.toISOString()}. Minutes remaining: ${minutesRemaining}`);
        
        return new Response(
          JSON.stringify({ 
            error: `Aguarde ${minutesRemaining} minuto${minutesRemaining > 1 ? 's' : ''} para enviar novamente.`,
            rate_limited: true,
            next_available: nextAvailable.toISOString(),
            minutes_remaining: minutesRemaining
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get ficha data
    const { data: ficha, error: fichaError } = await supabase
      .from('fichas_visita')
      .select('*')
      .eq('id', ficha_id)
      .single();

    if (fichaError || !ficha) {
      return new Response(
        JSON.stringify({ error: 'Registro não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get phone based on tipo
    const telefone = tipo === 'proprietario' ? ficha.proprietario_telefone : ficha.comprador_telefone;
    const nome = tipo === 'proprietario' ? ficha.proprietario_nome : ficha.comprador_nome;
    const autopreenchimento = tipo === 'proprietario' ? ficha.proprietario_autopreenchimento : ficha.comprador_autopreenchimento;

    // Generate OTP and token
    const codigo = generateOTP();
    const token = generateToken();
    const expiraEm = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

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

    // Build verification URL - use app_url from request or fallback to env/default
    const baseUrl = app_url || Deno.env.get('APP_URL') || 'https://visitaseguras.com.br';
    const verificationUrl = `${baseUrl}/confirmar/${token}`;

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
      const saudacao = nome && nome.trim() ? `Olá ${nome}!` : 'Olá!';
      const instrucaoExtra = autopreenchimento 
        ? '\n\n📝 *Você precisará preencher seus dados (nome e CPF) ao confirmar.*'
        : '';
      
      message = `🏠 *Confirmação de Visita*\n\n${saudacao}\n\nVocê está sendo convidado a confirmar uma visita ao imóvel:\n\n📍 *${ficha.imovel_endereco}*\n🏷️ ${ficha.imovel_tipo}\n📅 ${dataFormatada}\n📋 Protocolo: ${ficha.protocolo}\n\nComo ${tipoLabel}, seu código de confirmação é:\n\n🔐 *${codigo}*\n\nOu clique no link para confirmar:\n${verificationUrl}${instrucaoExtra}\n\n⏰ Este código expira em 1 hora.\n\n_Não compartilhe este código com ninguém._`;
      
      console.log('Using default template, autopreenchimento:', autopreenchimento);
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

    // Send second message with just the code for easy copying
    if (sent) {
      console.log('[send-otp] Enviando mensagem separada com código para facilitar cópia');
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      
      const codigoMessage = codigo; // Just the 6-digit code
      const codeSent = await sendViaZionTalk(telefone, codigoMessage);
      if (!codeSent) {
        const codeSentEvo = await sendViaEvolutionAPI(telefone, codigoMessage);
        if (!codeSentEvo) {
          await sendViaZAPI(telefone, codigoMessage);
        }
      }
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
