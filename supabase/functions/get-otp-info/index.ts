import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  console.log('[get-otp-info] Requisição recebida:', req.method);

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token } = await req.json();
    console.log('[get-otp-info] Token recebido:', token ? `${token.substring(0, 8)}...` : 'VAZIO');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find OTP by token
    const { data: otp, error: otpError } = await supabase
      .from('confirmacoes_otp')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (otpError || !otp) {
      return new Response(
        JSON.stringify({ error: 'Link inválido ou expirado', valid: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get ficha data
    const { data: ficha } = await supabase
      .from('fichas_visita')
      .select('*')
      .eq('id', otp.ficha_id)
      .single();

    // Get corretor (broker) data
    let corretor_nome: string | null = null;
    let corretor_creci: string | null = null;
    if (ficha?.user_id) {
      const { data: corretor } = await supabase
        .from('profiles')
        .select('nome, creci')
        .eq('user_id', ficha.user_id)
        .maybeSingle();
      
      if (corretor) {
        corretor_nome = corretor.nome;
        corretor_creci = corretor.creci;
      }
    }

    // Check if already confirmed
    if (otp.confirmado) {
      return new Response(
        JSON.stringify({ 
          valid: true,
          already_confirmed: true,
          otp: {
            tipo: otp.tipo,
            confirmado: true,
            ficha_id: otp.ficha_id,
          },
        ficha: ficha ? {
          protocolo: ficha.protocolo,
          imovel_endereco: ficha.imovel_endereco,
          imovel_tipo: ficha.imovel_tipo,
          data_visita: ficha.data_visita,
          proprietario_nome: ficha.proprietario_nome,
          comprador_nome: ficha.comprador_nome,
          proprietario_autopreenchimento: ficha.proprietario_autopreenchimento,
          comprador_autopreenchimento: ficha.comprador_autopreenchimento,
          status: ficha.status,
          corretor_nome,
          corretor_creci,
        } : null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    const expired = new Date(otp.expira_em) < new Date();
    
    // Check if max attempts exceeded
    const maxAttemptsExceeded = (otp.tentativas || 0) >= 5;

    // Return the OTP code when token is valid (not expired, not max attempts)
    const isValid = !expired && !maxAttemptsExceeded;

    return new Response(
      JSON.stringify({ 
        valid: isValid,
        expired,
        max_attempts_exceeded: maxAttemptsExceeded,
        otp: {
          tipo: otp.tipo,
          confirmado: false,
          expira_em: otp.expira_em,
          ficha_id: otp.ficha_id,
          tentativas: otp.tentativas || 0,
          max_tentativas: 5,
          ...(isValid ? { codigo: otp.codigo } : {}),
        },
      ficha: ficha ? {
        protocolo: ficha.protocolo,
        imovel_endereco: ficha.imovel_endereco,
        imovel_tipo: ficha.imovel_tipo,
        data_visita: ficha.data_visita,
        proprietario_nome: ficha.proprietario_nome,
        comprador_nome: ficha.comprador_nome,
        proprietario_autopreenchimento: ficha.proprietario_autopreenchimento,
        comprador_autopreenchimento: ficha.comprador_autopreenchimento,
        status: ficha.status,
        corretor_nome,
        corretor_creci,
      } : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in get-otp-info function:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
