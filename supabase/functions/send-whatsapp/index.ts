import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ZIONTALK_API_URL = 'https://app.ziontalk.com/api';

interface SendMessageRequest {
  action: 'send-text' | 'send-template' | 'test-connection';
  phone?: string;
  message?: string;
  templateName?: string;
  templateParams?: Record<string, string>;
  headerParams?: Record<string, string>;
  language?: string;
  channel?: 'default' | 'meta' | 'meta2';
  buttonUrlDynamicParams?: string[];
}

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  return '+' + cleaned;
}

function getApiKey(channel?: 'default' | 'meta' | 'meta2'): string | undefined {
  if (channel === 'meta2') return Deno.env.get('ZIONTALK_META2_API_KEY');
  if (channel === 'meta') return Deno.env.get('ZIONTALK_META_API_KEY');
  return Deno.env.get('ZIONTALK_API_KEY');
}

function getChannelLabel(channel?: 'default' | 'meta' | 'meta2'): string {
  if (channel === 'meta2') return 'ZionTalk Meta 2 (API Oficial)';
  return channel === 'meta' ? 'ZionTalk Meta (API Oficial)' : 'ZionTalk';
}

function createServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

async function logWhatsApp(params: {
  telefone: string;
  canal: string;
  tipo: string;
  status: 'success' | 'failed';
  error_message?: string;
  ficha_id?: string;
  user_id?: string;
  imobiliaria_id?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const client = createServiceClient();
    await client.from('whatsapp_logs').insert({
      telefone: params.telefone,
      canal: params.canal,
      tipo: params.tipo,
      status: params.status,
      error_message: params.error_message || null,
      ficha_id: params.ficha_id || null,
      user_id: params.user_id || null,
      imobiliaria_id: params.imobiliaria_id || null,
      metadata: params.metadata || null,
    });
  } catch (e) {
    console.warn('[whatsapp_logs] Failed to log:', e);
  }
}

async function getDefaultChannel(): Promise<'default' | 'meta' | 'meta2'> {
  try {
    const supabaseClient = createServiceClient();
    const { data } = await supabaseClient
      .from('configuracoes_sistema')
      .select('valor')
      .eq('chave', 'whatsapp_channel_padrao')
      .single();
    const val = data?.valor;
    if (val === 'meta2' || val === '"meta2"') return 'meta2';
    if (val === 'meta' || val === '"meta"') return 'meta';
    return 'default';
  } catch {
    return 'default';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === Auth gate: validate JWT and check role ===
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token de autenticação ausente' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if this is a service_role call (internal edge functions)
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const isServiceRole = token === serviceRoleKey;

    if (!isServiceRole) {
      // Validate user JWT
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
      if (userError || !userData?.user) {
        console.error('Auth error:', userError?.message);
        return new Response(
          JSON.stringify({ success: false, error: 'Token inválido ou expirado' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check role: only super_admin or imobiliaria_admin allowed
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', userData.user.id)
        .in('role', ['super_admin', 'imobiliaria_admin'])
        .maybeSingle();

      if (!roleData) {
        console.warn(`Unauthorized send-whatsapp attempt by user ${userData.user.id}`);
        return new Response(
          JSON.stringify({ success: false, error: 'Sem permissão para enviar mensagens WhatsApp' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Authorized: user ${userData.user.id} role ${roleData.role}`);
    } else {
      console.log('Authorized: service_role (internal call)');
    }
    // === End auth gate ===

    const { action, phone, message, templateName, templateParams, headerParams, language, channel: requestedChannel, buttonUrlDynamicParams }: SendMessageRequest = await req.json();
    
    // Use requested channel, or fall back to DB config
    const channel = requestedChannel ?? await getDefaultChannel();
    
    const apiKey = getApiKey(channel);
    const channelLabel = getChannelLabel(channel);
    
    if (!apiKey) {
      console.error(`API Key not configured for channel: ${channel || 'default'}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `API Key do ${channelLabel} não configurada` 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Action: ${action}, Phone: ${phone}, Channel: ${channel || 'default'}`);

    const ziontalkAuthHeader = btoa(`${apiKey}:`);

    switch (action) {
      case 'test-connection': {
        const testUrl = `${ZIONTALK_API_URL}/send_message/`;
        console.log(`Testing connection (${channelLabel}): ${testUrl}`);
        
        const formData = new FormData();
        formData.append('msg', 'test');
        formData.append('mobile_phone', '+5500000000000');

        const response = await fetch(testUrl, {
          method: 'POST',
          headers: { 'Authorization': `Basic ${ziontalkAuthHeader}` },
          body: formData,
        });

        console.log(`Test response status: ${response.status}`);
        const responseText = await response.text();
        console.log(`Test response: ${responseText.substring(0, 500)}`);

        const authWorked = response.status !== 401 && response.status !== 403;
        
        return new Response(
          JSON.stringify({
            success: true,
            connected: authWorked,
            message: authWorked ? `Conexão estabelecida com ${channelLabel}` : `Falha na autenticação do ${channelLabel} - verifique a API Key`,
            statusCode: response.status
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'send-text': {
        if (!phone || !message) {
          return new Response(
            JSON.stringify({ success: false, error: 'Telefone e mensagem são obrigatórios' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Meta channels only support templates, force default for text messages
        const textChannel = (channel === 'meta' || channel === 'meta2') ? 'default' : channel;
        const textApiKey = getApiKey(textChannel);
        const textChannelLabel = getChannelLabel(textChannel);
        const textAuthHeader = btoa(`${textApiKey}:`);

        if (!textApiKey) {
          return new Response(
            JSON.stringify({ success: false, error: `API Key do ${textChannelLabel} não configurada` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const formattedPhone = formatPhoneNumber(phone);
        const url = `${ZIONTALK_API_URL}/send_message/`;
        console.log(`Sending text message to ${formattedPhone} via ${textChannelLabel}`);

        const formData = new FormData();
        formData.append('msg', message);
        formData.append('mobile_phone', formattedPhone);

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Authorization': `Basic ${textAuthHeader}` },
          body: formData,
        });

        console.log(`Send message response status: ${response.status}`);
        const responseText = await response.text();
        console.log(`Send message response: ${responseText.substring(0, 500)}`);

        const success = response.status === 201;
        
        return new Response(
          JSON.stringify({
            success,
            phone: formattedPhone,
            error: success ? null : responseText || 'Erro ao enviar mensagem'
          }),
          { status: success ? 200 : response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'send-template': {
        if (!phone || !templateName) {
          return new Response(
            JSON.stringify({ success: false, error: 'Telefone e nome do template são obrigatórios' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const formattedPhone = formatPhoneNumber(phone);
        const url = `${ZIONTALK_API_URL}/send_template_message/`;
        console.log(`Sending template ${templateName} to ${formattedPhone} via ${channelLabel}`);

        const formData = new FormData();
        formData.append('mobile_phone', formattedPhone);
        formData.append('template_identifier', templateName);
        formData.append('language', language || 'pt_BR');

        // Header params
        if (headerParams) {
          for (const [key, value] of Object.entries(headerParams)) {
            formData.append(`headerParams[${key}]`, value);
          }
        }

        // Body params
        if (templateParams) {
          for (const [key, value] of Object.entries(templateParams)) {
            formData.append(`bodyParams[${key}]`, value);
          }
        }

        // Button URL dynamic params (for Meta CTA buttons)
        if (buttonUrlDynamicParams && buttonUrlDynamicParams.length > 0) {
          buttonUrlDynamicParams.forEach((param, index) => {
            formData.append(`buttonUrlDynamicParams[${index}]`, param);
          });
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Authorization': `Basic ${ziontalkAuthHeader}` },
          body: formData,
        });

        console.log(`Send template response status: ${response.status}`);
        const responseText = await response.text();
        console.log(`Send template response COMPLETO: ${responseText}`);

        // Logging detalhado para diagnóstico meta2
        const respHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          respHeaders[key] = value;
        });
        console.log(`[send-whatsapp] Canal: ${channel} | Status: ${response.status} | Content-Type: ${response.headers.get('content-type')}`);
        console.log(`[send-whatsapp] Response Headers:`, JSON.stringify(respHeaders));
        console.log(`[send-whatsapp] Response Body COMPLETO:`, responseText);

        const success = response.status === 201;
        
        return new Response(
          JSON.stringify({
            success,
            phone: formattedPhone,
            template: templateName,
            error: success ? null : responseText || 'Erro ao enviar template'
          }),
          { status: success ? 200 : response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Ação desconhecida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Error in send-whatsapp function:', errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
