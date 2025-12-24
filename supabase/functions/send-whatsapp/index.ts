import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ZIONTALK_API_URL = 'https://api.ziontalk.com.br/v1';

interface SendMessageRequest {
  action: 'send-text' | 'send-template' | 'test-connection';
  phone?: string;
  message?: string;
  templateName?: string;
  templateParams?: Record<string, string>;
}

async function makeZionTalkRequest(
  apiKey: string,
  endpoint: string,
  method: string = 'POST',
  body?: Record<string, unknown>
) {
  const url = `${ZIONTALK_API_URL}${endpoint}`;
  console.log(`ZionTalk request: ${method} ${url}`);

  // ZionTalk uses Basic Auth with API key as username, empty password
  const authHeader = btoa(`${apiKey}:`);

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${authHeader}`,
    },
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
    console.log('Request body:', JSON.stringify(body));
  }

  const response = await fetch(url, options);
  const text = await response.text();
  
  console.log(`ZionTalk response status: ${response.status}`);
  console.log(`ZionTalk response:`, text.substring(0, 500));

  try {
    return { data: JSON.parse(text), status: response.status };
  } catch {
    return { data: { raw: text }, status: response.status };
  }
}

function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Add Brazil country code if not present
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  
  return cleaned;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('ZIONTALK_API_KEY');
    
    if (!apiKey) {
      console.error('ZIONTALK_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'ZionTalk API key não configurada' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { action, phone, message, templateName, templateParams }: SendMessageRequest = await req.json();
    console.log(`Action: ${action}, Phone: ${phone}`);

    let result;

    switch (action) {
      case 'test-connection': {
        // Test connection by checking account info or sending a test request
        result = await makeZionTalkRequest(apiKey, '/channels');
        
        const connected = result.status === 200;
        return new Response(
          JSON.stringify({
            success: true,
            connected,
            message: connected ? 'Conexão estabelecida com ZionTalk' : 'Falha na conexão',
            details: result.data
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'send-text': {
        if (!phone || !message) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Telefone e mensagem são obrigatórios' 
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        const formattedPhone = formatPhoneNumber(phone);
        
        result = await makeZionTalkRequest(apiKey, '/messages', 'POST', {
          to: formattedPhone,
          type: 'text',
          text: {
            body: message
          }
        });

        const success = result.status >= 200 && result.status < 300;
        
        return new Response(
          JSON.stringify({
            success,
            messageId: result.data?.messages?.[0]?.id,
            phone: formattedPhone,
            error: success ? null : result.data?.error || 'Erro ao enviar mensagem'
          }),
          { 
            status: success ? 200 : result.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      case 'send-template': {
        if (!phone || !templateName) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Telefone e nome do template são obrigatórios' 
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        const formattedPhone = formatPhoneNumber(phone);
        
        const templateBody: Record<string, unknown> = {
          to: formattedPhone,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: 'pt_BR'
            }
          }
        };

        // Add parameters if provided
        if (templateParams && Object.keys(templateParams).length > 0) {
          const components = [{
            type: 'body',
            parameters: Object.values(templateParams).map(value => ({
              type: 'text',
              text: value
            }))
          }];
          (templateBody.template as Record<string, unknown>).components = components;
        }

        result = await makeZionTalkRequest(apiKey, '/messages', 'POST', templateBody);

        const success = result.status >= 200 && result.status < 300;
        
        return new Response(
          JSON.stringify({
            success,
            messageId: result.data?.messages?.[0]?.id,
            phone: formattedPhone,
            error: success ? null : result.data?.error || 'Erro ao enviar template'
          }),
          { 
            status: success ? 200 : result.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Ação desconhecida: ${action}` 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Error in send-whatsapp function:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
