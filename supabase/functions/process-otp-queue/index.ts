import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration
const BATCH_SIZE = 10;
const DELAY_BETWEEN_SENDS = 2000; // 2 seconds between each send
const MAX_RETRIES = 3;

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

// Get configured WhatsApp channel from system settings
async function getDefaultChannel(supabase: any): Promise<'default' | 'meta' | 'meta2'> {
  try {
    const { data } = await supabase
      .from('configuracoes_sistema')
      .select('valor')
      .eq('chave', 'whatsapp_channel_padrao')
      .single();
    const val = data?.valor;
    if (val === 'meta2' || val === '"meta2"') return 'meta2';
    if (val === 'meta' || val === '"meta"') return 'meta';
    return 'default';
  } catch (_e) {
    return 'default';
  }
}

// Send WhatsApp message via ZionTalk
async function sendViaZionTalk(phone: string, message: string, channel: 'default' | 'meta' | 'meta2' = 'default'): Promise<boolean> {
  const secretName = channel === 'meta2' ? 'ZIONTALK_META2_API_KEY' : channel === 'meta' ? 'ZIONTALK_META_API_KEY' : 'ZIONTALK_API_KEY';
  const apiKey = Deno.env.get(secretName);
  console.log(`[process-otp-queue] Canal WhatsApp configurado: ${channel}, usando secret: ${secretName}`);

  if (!apiKey) {
    console.log('[process-otp-queue] ZionTalk API not configured');
    return false;
  }

  try {
    // Log detalhado para diagnóstico
    console.log(`[process-otp-queue] ========== ENVIO ZIONTALK ==========`);
    console.log(`[process-otp-queue] Telefone ORIGINAL recebido: "${phone}"`);
    
    const formattedPhone = `+${formatPhoneNumber(phone)}`;
    console.log(`[process-otp-queue] Telefone FORMATADO para API: "${formattedPhone}"`);
    
    const authHeader = btoa(`${apiKey}:`);

    const formData = new FormData();
    formData.append('mobile_phone', formattedPhone);
    formData.append('msg', message);
    
    console.log(`[process-otp-queue] FormData mobile_phone: "${formattedPhone}"`);

    const response = await fetch('https://app.ziontalk.com/api/send_message/', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
      },
      body: formData,
    });

    const responseText = await response.text();
    console.log(`[process-otp-queue] ZionTalk status: ${response.status}`);
    console.log(`[process-otp-queue] ZionTalk resposta COMPLETA: ${responseText}`);
    
    // Tentar parsear JSON para ver detalhes do destinatário
    try {
      const responseJson = JSON.parse(responseText);
      console.log(`[process-otp-queue] ZionTalk destinatário confirmado:`, responseJson.to || responseJson.phone || responseJson.mobile_phone || 'não informado na resposta');
      console.log(`[process-otp-queue] ZionTalk response JSON:`, JSON.stringify(responseJson));
    } catch (e) {
      console.log(`[process-otp-queue] Resposta não é JSON válido, conteúdo raw: ${responseText.substring(0, 500)}`);
    }

    if (!response.ok) {
      console.error('[process-otp-queue] ZionTalk error:', responseText);
      return false;
    }

    console.log('[process-otp-queue] ========== ENVIO CONCLUÍDO ==========');
    return true;
  } catch (error) {
    console.error('[process-otp-queue] ZionTalk error:', error);
    return false;
  }
}

// Send WhatsApp template message via ZionTalk (Meta API)
async function sendTemplateViaZionTalk(
  phone: string, 
  params: { nome: string; imovel: string; codigo: string; lembrete: string; token: string },
  channel: 'default' | 'meta' | 'meta2' = 'meta'
): Promise<boolean> {
  const secretName = channel === 'meta2' ? 'ZIONTALK_META2_API_KEY' : channel === 'meta' ? 'ZIONTALK_META_API_KEY' : 'ZIONTALK_API_KEY';
  const apiKey = Deno.env.get(secretName);
  console.log(`[process-otp-queue] Enviando template Meta visita_prova_2 via ${secretName}`);

  if (!apiKey) {
    console.log('[process-otp-queue] ZionTalk API not configured for template send');
    return false;
  }

  try {
    const formattedPhone = `+${formatPhoneNumber(phone)}`;
    const authHeader = btoa(`${apiKey}:`);

    const formData = new FormData();
    formData.append('mobile_phone', formattedPhone);
    formData.append('template_identifier', 'visita_prova_2');
    formData.append('language', 'pt_BR');
    formData.append('bodyParams[nome]', params.nome || 'Visitante');
    formData.append('bodyParams[imovel]', params.imovel);
    formData.append('bodyParams[codigo]', params.codigo);
    formData.append('bodyParams[lembrete]', params.lembrete);
    formData.append('buttonUrlDynamicParams[0]', `confirmar/${params.token}`);

    console.log(`[process-otp-queue] Template params: nome=${params.nome}, imovel=${params.imovel}, codigo=${params.codigo}`);

    const response = await fetch('https://app.ziontalk.com/api/send_template_message/', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
      },
      body: formData,
    });

    const responseText = await response.text();
    console.log(`[process-otp-queue] Template ZionTalk status: ${response.status}`);
    console.log(`[process-otp-queue] Template ZionTalk resposta COMPLETA: ${responseText}`);

    // Logging detalhado para diagnóstico meta2
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    console.log(`[process-otp-queue] Canal: ${channel} | Status: ${response.status} | Content-Type: ${response.headers.get('content-type')}`);
    console.log(`[process-otp-queue] Response Headers:`, JSON.stringify(responseHeaders));
    console.log(`[process-otp-queue] Response Body COMPLETO:`, responseText);

    if (!response.ok) {
      console.error('[process-otp-queue] ZionTalk template error:', responseText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[process-otp-queue] ZionTalk template error:', error);
    return false;
  }
}

// Send WhatsApp message via Evolution API (legacy fallback)
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
      console.error('[process-otp-queue] Evolution API error:', error);
      return false;
    }

    console.log('[process-otp-queue] Message sent via Evolution API');
    return true;
  } catch (error) {
    console.error('[process-otp-queue] Evolution API error:', error);
    return false;
  }
}

// Send WhatsApp message via Z-API (legacy fallback)
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
      console.error('[process-otp-queue] Z-API error:', error);
      return false;
    }

    console.log('[process-otp-queue] Message sent via Z-API');
    return true;
  } catch (error) {
    console.error('[process-otp-queue] Z-API error:', error);
    return false;
  }
}

// Process a single OTP queue item
async function processQueueItem(
  supabase: any,
  item: any
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[process-otp-queue] Processing item ${item.id} for ficha ${item.ficha_id}, tipo: ${item.tipo}`);

    // Get ficha data
    const { data: ficha, error: fichaError } = await supabase
      .from('fichas_visita')
      .select('*')
      .eq('id', item.ficha_id)
      .single();

    if (fichaError || !ficha) {
      console.error('[process-otp-queue] Ficha not found:', fichaError);
      return { success: false, error: 'Ficha não encontrada' };
    }

    // Get phone based on tipo
    const telefone = item.tipo === 'proprietario' ? ficha.proprietario_telefone : ficha.comprador_telefone;
    const nome = item.tipo === 'proprietario' ? ficha.proprietario_nome : ficha.comprador_nome;
    const autopreenchimento = item.tipo === 'proprietario' ? ficha.proprietario_autopreenchimento : ficha.comprador_autopreenchimento;

    if (!telefone) {
      return { success: false, error: 'Telefone não encontrado' };
    }

    // Generate OTP and token
    const codigo = generateOTP();
    const token = generateToken();
    const expiraEm = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Check if there's already a pending OTP for this ficha/tipo
    const { data: existingOtp } = await supabase
      .from('confirmacoes_otp')
      .select('*')
      .eq('ficha_id', item.ficha_id)
      .eq('tipo', item.tipo)
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
        ficha_id: item.ficha_id,
        tipo: item.tipo,
        codigo,
        telefone,
        token,
        expira_em: expiraEm.toISOString(),
      });

    if (insertError) {
      console.error('[process-otp-queue] Error inserting OTP:', insertError);
      return { success: false, error: 'Erro ao criar OTP' };
    }

    // Build verification URL
    const baseUrl = item.app_url || Deno.env.get('APP_URL') || 'https://visitaseguras.com.br';
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

    // Try to get custom template
    const templateTipo = item.tipo === 'proprietario' ? 'criacao_proprietario' : 'criacao_comprador';
    const { data: customTemplate } = await supabase
      .from('templates_mensagem')
      .select('conteudo')
      .eq('user_id', ficha.user_id)
      .eq('tipo', templateTipo)
      .eq('ativo', true)
      .maybeSingle();

    let message: string;

    if (customTemplate?.conteudo) {
      message = customTemplate.conteudo
        .replace(/{nome}/g, nome)
        .replace(/{endereco}/g, ficha.imovel_endereco)
        .replace(/{tipo_imovel}/g, ficha.imovel_tipo)
        .replace(/{data_visita}/g, dataFormatada)
        .replace(/{protocolo}/g, ficha.protocolo)
        .replace(/{codigo}/g, codigo)
        .replace(/{link}/g, verificationUrl);
    } else {
      const tipoLabel = item.tipo === 'proprietario' ? 'proprietário' : 'visitante';
      const saudacao = nome && nome.trim() ? `Olá ${nome}!` : 'Olá!';
      const instrucaoExtra = autopreenchimento 
        ? '\n\n📝 *Você precisará preencher seus dados (nome e CPF) ao confirmar.*'
        : '';
      
      message = `🏠 *Confirmação de Visita*\n\n${saudacao}\n\nVocê está sendo convidado a confirmar uma visita ao imóvel:\n\n📍 *${ficha.imovel_endereco}*\n🏷️ ${ficha.imovel_tipo}\n📅 ${dataFormatada}\n📋 Protocolo: ${ficha.protocolo}\n\nComo ${tipoLabel}, seu código de confirmação é:\n\n🔐 *${codigo}*\n\nOu clique no link para confirmar:\n${verificationUrl}${instrucaoExtra}\n\n⏰ Este código expira em 1 hora.\n\n_Não compartilhe este código com ninguém._`;
    }

    // Get configured WhatsApp channel
    const channel = await getDefaultChannel(supabase);
    console.log(`[process-otp-queue] Canal WhatsApp selecionado: ${channel}`);

    let sent = false;

    if (channel === 'meta' || channel === 'meta2') {
      // Meta channel: use approved template visita_prova_2
      console.log('[process-otp-queue] Usando template Meta visita_prova_2');
      sent = await sendTemplateViaZionTalk(telefone, {
        nome: nome || (item.tipo === 'proprietario' ? 'Proprietário' : 'Visitante'),
        imovel: ficha.imovel_endereco,
        codigo,
        lembrete: 'Este código expira em 1 hora.',
        token,
      }, channel);
    } else {
      // Default channel: free-text message
      sent = await sendViaZionTalk(telefone, message, channel);
    }
    
    if (!sent) {
      sent = await sendViaEvolutionAPI(telefone, message);
    }
    
    if (!sent) {
      sent = await sendViaZAPI(telefone, message);
    }

    // Send second message with just the code (only for non-meta channels)
    if (sent && channel !== 'meta' && channel !== 'meta2') {
      console.log('[process-otp-queue] Enviando mensagem separada com código para facilitar cópia');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const codigoMessage = codigo;
      const codeSent = await sendViaZionTalk(telefone, codigoMessage, channel);
      if (!codeSent) {
        const codeSentEvo = await sendViaEvolutionAPI(telefone, codigoMessage);
        if (!codeSentEvo) {
          await sendViaZAPI(telefone, codigoMessage);
        }
      }
    }

    // Update ficha status
    const newStatus = item.tipo === 'proprietario' 
      ? 'aguardando_proprietario'
      : 'aguardando_comprador';

    await supabase
      .from('fichas_visita')
      .update({ status: newStatus })
      .eq('id', item.ficha_id);

    if (!sent) {
      console.log(`[process-otp-queue] OTP generated in simulation mode for item ${item.id}`);
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`[process-otp-queue] Error processing item ${item.id}:`, error);
    return { success: false, error: message };
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[process-otp-queue] Starting queue processing...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch pending items (ordered by priority and creation time)
    const { data: queueItems, error: fetchError } = await supabase
      .from('otp_queue')
      .select('*')
      .eq('status', 'pendente')
      .lt('tentativas', MAX_RETRIES)
      .order('prioridade', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      console.error('[process-otp-queue] Error fetching queue:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar fila' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('[process-otp-queue] No pending items in queue');
      return new Response(
        JSON.stringify({ message: 'Fila vazia', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[process-otp-queue] Found ${queueItems.length} items to process`);

    let successCount = 0;
    let failCount = 0;

    for (const item of queueItems) {
      // Mark as processing
      await supabase
        .from('otp_queue')
        .update({ status: 'processando' })
        .eq('id', item.id);

      // Process the item
      const result = await processQueueItem(supabase, item);

      if (result.success) {
        // Mark as sent
        await supabase
          .from('otp_queue')
          .update({ 
            status: 'enviado', 
            processed_at: new Date().toISOString() 
          })
          .eq('id', item.id);
        
        successCount++;
        console.log(`[process-otp-queue] Item ${item.id} processed successfully`);
      } else {
        const newTentativas = (item.tentativas || 0) + 1;
        const newStatus = newTentativas >= MAX_RETRIES ? 'falhou' : 'pendente';
        
        await supabase
          .from('otp_queue')
          .update({ 
            status: newStatus,
            tentativas: newTentativas,
            ultimo_erro: result.error
          })
          .eq('id', item.id);
        
        failCount++;
        console.log(`[process-otp-queue] Item ${item.id} failed: ${result.error}`);
      }

      // Delay between sends to avoid rate limiting
      if (queueItems.indexOf(item) < queueItems.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_SENDS));
      }
    }

    console.log(`[process-otp-queue] Completed. Success: ${successCount}, Failed: ${failCount}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Processamento concluído`,
        processed: queueItems.length,
        success_count: successCount,
        fail_count: failCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[process-otp-queue] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
