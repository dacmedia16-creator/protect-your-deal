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

    const { token } = await req.json();

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
        JSON.stringify({ error: 'Link inválido', valid: false }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get ficha data
    const { data: ficha } = await supabase
      .from('fichas_visita')
      .select('*')
      .eq('id', otp.ficha_id)
      .single();

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
          } : null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    const expired = new Date(otp.expira_em) < new Date();

    return new Response(
      JSON.stringify({ 
        valid: !expired,
        expired,
        otp: {
          tipo: otp.tipo,
          confirmado: false,
          expira_em: otp.expira_em,
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
