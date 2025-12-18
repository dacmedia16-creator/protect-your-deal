import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token, codigo } = await req.json();

    if (!token || !codigo) {
      return new Response(
        JSON.stringify({ error: 'Token e código são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find OTP by token
    const { data: otp, error: otpError } = await supabase
      .from('confirmacoes_otp')
      .select('*, fichas_visita(*)')
      .eq('token', token)
      .maybeSingle();

    if (otpError || !otp) {
      return new Response(
        JSON.stringify({ error: 'Código inválido ou expirado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already confirmed
    if (otp.confirmado) {
      return new Response(
        JSON.stringify({ error: 'Este código já foi utilizado', already_confirmed: true }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    if (new Date(otp.expira_em) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Código expirado. Solicite um novo código.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check attempts
    if (otp.tentativas >= 5) {
      return new Response(
        JSON.stringify({ error: 'Número máximo de tentativas excedido. Solicite um novo código.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify code
    if (otp.codigo !== codigo) {
      // Increment attempts
      await supabase
        .from('confirmacoes_otp')
        .update({ tentativas: otp.tentativas + 1 })
        .eq('id', otp.id);

      const remainingAttempts = 4 - otp.tentativas;
      return new Response(
        JSON.stringify({ 
          error: `Código incorreto. ${remainingAttempts > 0 ? `Você tem mais ${remainingAttempts} tentativa(s).` : 'Última tentativa!'}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark OTP as confirmed
    await supabase
      .from('confirmacoes_otp')
      .update({ confirmado: true })
      .eq('id', otp.id);

    // Update ficha with confirmation timestamp
    const updateField = otp.tipo === 'proprietario' 
      ? { proprietario_confirmado_em: new Date().toISOString() }
      : { comprador_confirmado_em: new Date().toISOString() };

    await supabase
      .from('fichas_visita')
      .update(updateField)
      .eq('id', otp.ficha_id);

    // Check if both parties confirmed
    const { data: updatedFicha } = await supabase
      .from('fichas_visita')
      .select('*')
      .eq('id', otp.ficha_id)
      .single();

    let newStatus = 'pendente';
    if (updatedFicha?.proprietario_confirmado_em && updatedFicha?.comprador_confirmado_em) {
      newStatus = 'completo';
    } else if (updatedFicha?.proprietario_confirmado_em) {
      newStatus = 'aguardando_comprador';
    } else if (updatedFicha?.comprador_confirmado_em) {
      newStatus = 'aguardando_proprietario';
    }

    await supabase
      .from('fichas_visita')
      .update({ status: newStatus })
      .eq('id', otp.ficha_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Visita confirmada com sucesso!',
        ficha: {
          protocolo: updatedFicha?.protocolo,
          imovel_endereco: updatedFicha?.imovel_endereco,
          data_visita: updatedFicha?.data_visita,
          status: newStatus,
          confirmado_por: otp.tipo,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in verify-otp function:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
