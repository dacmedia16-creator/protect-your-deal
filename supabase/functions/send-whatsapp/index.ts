import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Correct ZionTalk API URL from documentation
const ZIONTALK_API_URL = 'https://app.ziontalk.com/api';

interface SendMessageRequest {
  action: 'send-text' | 'send-template' | 'test-connection';
  phone?: string;
  message?: string;
  templateName?: string;
  templateParams?: Record<string, string>;
  headerParams?: Record<string, string>;
  language?: string;
}

function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Add Brazil country code if not present
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  
  // Return in E.164 format with +
  return '+' + cleaned;
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

    const { action, phone, message, templateName, templateParams, headerParams, language }: SendMessageRequest = await req.json();
    console.log(`Action: ${action}, Phone: ${phone}`);

    // ZionTalk uses Basic Auth with API key as username, empty password
    const authHeader = btoa(`${apiKey}:`);

    switch (action) {
      case 'test-connection': {
        // Test by sending a minimal request to check auth
        // We'll use the send_message endpoint with invalid data just to test auth
        const testUrl = `${ZIONTALK_API_URL}/send_message/`;
        console.log(`Testing connection: ${testUrl}`);
        
        const formData = new FormData();
        formData.append('msg', 'test');
        formData.append('mobile_phone', '+5500000000000');

        const response = await fetch(testUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authHeader}`,
          },
          body: formData,
        });

        console.log(`Test response status: ${response.status}`);
        const responseText = await response.text();
        console.log(`Test response: ${responseText.substring(0, 500)}`);

        // 400/422 means auth worked but data is invalid (which is expected for test)
        // 401/403 means auth failed
        // 201 would mean it actually sent (unlikely with fake number)
        const authWorked = response.status !== 401 && response.status !== 403;
        
        return new Response(
          JSON.stringify({
            success: true,
            connected: authWorked,
            message: authWorked ? 'Conexão estabelecida com ZionTalk' : 'Falha na autenticação - verifique a API Key',
            statusCode: response.status
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
        const url = `${ZIONTALK_API_URL}/send_message/`;
        console.log(`Sending text message to ${formattedPhone}`);

        const formData = new FormData();
        formData.append('msg', message);
        formData.append('mobile_phone', formattedPhone);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authHeader}`,
          },
          body: formData,
        });

        console.log(`Send message response status: ${response.status}`);
        const responseText = await response.text();
        console.log(`Send message response: ${responseText.substring(0, 500)}`);

        // ZionTalk returns 201 on success with no body
        const success = response.status === 201;
        
        return new Response(
          JSON.stringify({
            success,
            phone: formattedPhone,
            error: success ? null : responseText || 'Erro ao enviar mensagem'
          }),
          { 
            status: success ? 200 : response.status,
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
        const url = `${ZIONTALK_API_URL}/send_template_message/`;
        console.log(`Sending template ${templateName} to ${formattedPhone}`);

        const formData = new FormData();
        formData.append('mobile_phone', formattedPhone);
        formData.append('template_identifier', templateName);
        
        if (language) {
          formData.append('language', language);
        } else {
          formData.append('language', 'pt_BR');
        }

        // Add header params if provided
        if (headerParams) {
          for (const [key, value] of Object.entries(headerParams)) {
            formData.append(`headerParams[${key}]`, value);
          }
        }

        // Add body params if provided
        if (templateParams) {
          for (const [key, value] of Object.entries(templateParams)) {
            formData.append(`bodyParams[${key}]`, value);
          }
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authHeader}`,
          },
          body: formData,
        });

        console.log(`Send template response status: ${response.status}`);
        const responseText = await response.text();
        console.log(`Send template response: ${responseText.substring(0, 500)}`);

        // ZionTalk returns 201 on success with no body
        const success = response.status === 201;
        
        return new Response(
          JSON.stringify({
            success,
            phone: formattedPhone,
            template: templateName,
            error: success ? null : responseText || 'Erro ao enviar template'
          }),
          { 
            status: success ? 200 : response.status,
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
