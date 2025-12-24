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

    const { 
      token, 
      codigo,
      aceite_legal,
      aceite_nome,
      aceite_cpf,
      aceite_latitude,
      aceite_longitude,
      aceite_user_agent
    } = await req.json();

    // Get client IP from headers
    const clientIP = req.headers.get('x-forwarded-for') 
      || req.headers.get('cf-connecting-ip') 
      || req.headers.get('x-real-ip')
      || 'unknown';

    console.log('Verify OTP request:', { token, codigo, aceite_legal, aceite_nome, aceite_cpf: aceite_cpf ? '***' : null, clientIP });

    if (!token || !codigo) {
      return new Response(
        JSON.stringify({ error: 'Token e código são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate legal acceptance fields
    if (!aceite_legal) {
      return new Response(
        JSON.stringify({ error: 'O aceite da declaração é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!aceite_nome || aceite_nome.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: 'Nome completo é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!aceite_cpf || aceite_cpf.replace(/\D/g, '').length !== 11) {
      return new Response(
        JSON.stringify({ error: 'CPF válido é obrigatório' }),
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
      console.error('OTP not found:', otpError);
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

    // Mark OTP as confirmed with legal acceptance data
    const { error: updateOtpError } = await supabase
      .from('confirmacoes_otp')
      .update({ 
        confirmado: true,
        aceite_legal: true,
        aceite_nome: aceite_nome.trim(),
        aceite_cpf: aceite_cpf.replace(/\D/g, ''),
        aceite_ip: clientIP,
        aceite_latitude: aceite_latitude || null,
        aceite_longitude: aceite_longitude || null,
        aceite_user_agent: aceite_user_agent || null,
        aceite_em: new Date().toISOString()
      })
      .eq('id', otp.id);

    if (updateOtpError) {
      console.error('Error updating OTP:', updateOtpError);
      return new Response(
        JSON.stringify({ error: 'Erro ao registrar confirmação' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('OTP confirmed with legal data:', {
      otpId: otp.id,
      aceite_nome: aceite_nome.trim(),
      aceite_cpf: '***',
      aceite_ip: clientIP,
      aceite_latitude,
      aceite_longitude,
      aceite_em: new Date().toISOString()
    });

    // Check if this is autopreenchimento mode (name is null in ficha)
    const ficha = otp.fichas_visita;
    const isAutopreenchimento = otp.tipo === 'proprietario' 
      ? !ficha.proprietario_nome || ficha.proprietario_autopreenchimento
      : !ficha.comprador_nome || ficha.comprador_autopreenchimento;

    // Update ficha with confirmation timestamp and data if autopreenchimento
    const updateField = otp.tipo === 'proprietario' 
      ? { 
          proprietario_confirmado_em: new Date().toISOString(),
          ...(isAutopreenchimento && {
            proprietario_nome: aceite_nome.trim(),
            proprietario_cpf: aceite_cpf.replace(/\D/g, '')
          })
        }
      : { 
          comprador_confirmado_em: new Date().toISOString(),
          ...(isAutopreenchimento && {
            comprador_nome: aceite_nome.trim(),
            comprador_cpf: aceite_cpf.replace(/\D/g, '')
          })
        };

    console.log('Updating ficha with:', { isAutopreenchimento, updateField: { ...updateField, aceite_cpf: '***' } });

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