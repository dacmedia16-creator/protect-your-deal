import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Format phone number for WhatsApp (E.164 format without +)
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  return cleaned;
}

// Send WhatsApp message via ZionTalk
async function sendViaZionTalk(phone: string, message: string): Promise<boolean> {
  const apiKey = Deno.env.get('ZIONTALK_API_KEY');

  if (!apiKey) {
    console.log('ZionTalk API not configured');
    return false;
  }

  try {
    const formattedPhone = `+${formatPhoneNumber(phone)}`;
    const authHeader = btoa(`${apiKey}:`);
    
    console.log(`Sending reminder to ${formattedPhone} via ZionTalk`);

    const formData = new FormData();
    formData.append('mobile_phone', formattedPhone);
    formData.append('msg', message);

    const response = await fetch('https://app.ziontalk.com/api/send_message/', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
      },
      body: formData,
    });

    const responseText = await response.text();
    console.log(`ZionTalk response status: ${response.status}`);

    if (!response.ok) {
      console.error('ZionTalk error:', responseText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('ZionTalk error:', error);
    return false;
  }
}

// Send WhatsApp message via Evolution API (fallback)
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
      console.error('Evolution API error:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Evolution API error:', error);
    return false;
  }
}

// Send WhatsApp message via Z-API (fallback)
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
      console.error('Z-API error:', await response.text());
      return false;
    }

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

    console.log('Starting OTP reminder check...');

    // Check if reminders are enabled in system configuration
    const { data: config, error: configError } = await supabase
      .from('configuracoes_sistema')
      .select('valor')
      .eq('chave', 'lembretes_otp_ativo')
      .single();

    if (configError && configError.code !== 'PGRST116') {
      console.error('Error fetching configuration:', configError);
    }

    const lembretesAtivos = config?.valor === true || config?.valor === 'true';

    if (!lembretesAtivos) {
      console.log('OTP reminders are disabled by system configuration');
      return new Response(
        JSON.stringify({ success: true, message: 'Reminders disabled by admin', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find OTPs that:
    // - Are not confirmed
    // - Will expire in the next 15 minutes
    // - Haven't had a reminder sent yet
    // - Are not already expired
    const now = new Date();
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);

    const { data: pendingOtps, error: fetchError } = await supabase
      .from('confirmacoes_otp')
      .select(`
        id,
        ficha_id,
        tipo,
        codigo,
        telefone,
        token,
        expira_em,
        lembrete_enviado_em
      `)
      .eq('confirmado', false)
      .is('lembrete_enviado_em', null)
      .gt('expira_em', now.toISOString())
      .lte('expira_em', fifteenMinutesFromNow.toISOString());

    if (fetchError) {
      console.error('Error fetching pending OTPs:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Error fetching pending OTPs' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pendingOtps || pendingOtps.length === 0) {
      console.log('No OTPs need reminders at this time');
      return new Response(
        JSON.stringify({ success: true, message: 'No reminders needed', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${pendingOtps.length} OTPs needing reminders`);

    let sentCount = 0;
    let failedCount = 0;

    for (const otp of pendingOtps) {
      // Get ficha data for context
      const { data: ficha } = await supabase
        .from('fichas_visita')
        .select('imovel_endereco, protocolo')
        .eq('id', otp.ficha_id)
        .single();

      if (!ficha) {
        console.log(`Ficha not found for OTP ${otp.id}`);
        continue;
      }

      // Calculate minutes until expiration
      const expiraEm = new Date(otp.expira_em);
      const minutosRestantes = Math.ceil((expiraEm.getTime() - now.getTime()) / 60000);

      // Build the app URL for verification link
      const baseUrl = Deno.env.get('APP_URL') || 'https://protect-your-deal.lovable.app';
      const verificationUrl = `${baseUrl}/confirmar/${otp.token}`;

      // Build reminder message
      const tipoLabel = otp.tipo === 'proprietario' ? 'proprietário' : 'visitante';
      const message = `⏰ *Lembrete - VisitaProva*\n\nSeu código de confirmação como ${tipoLabel} expira em *${minutosRestantes} minutos*!\n\n📍 Imóvel: ${ficha.imovel_endereco}\n📋 Protocolo: ${ficha.protocolo}\n\n🔐 Código: *${otp.codigo}*\n\n👉 Confirme agora: ${verificationUrl}\n\n_Após expirar, será necessário solicitar um novo código._`;

      // Try to send via available providers
      let sent = await sendViaZionTalk(otp.telefone, message);
      if (!sent) sent = await sendViaEvolutionAPI(otp.telefone, message);
      if (!sent) sent = await sendViaZAPI(otp.telefone, message);

      if (sent) {
        // Mark reminder as sent
        await supabase
          .from('confirmacoes_otp')
          .update({ lembrete_enviado_em: now.toISOString() })
          .eq('id', otp.id);

        sentCount++;
        console.log(`Reminder sent for OTP ${otp.id} to ${otp.telefone}`);
      } else {
        failedCount++;
        console.log(`Failed to send reminder for OTP ${otp.id}`);
      }

      // Small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Reminder job complete. Sent: ${sentCount}, Failed: ${failedCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${pendingOtps.length} OTPs`,
        sent: sentCount,
        failed: failedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in otp-reminder function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
