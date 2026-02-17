import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { protocolo } = await req.json();

    console.log('Verificando comprovante para protocolo:', protocolo);

    if (!protocolo) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Protocolo não informado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch ficha by protocolo
    const { data: ficha, error: fichaError } = await supabase
      .from('fichas_visita')
      .select('*')
      .eq('protocolo', protocolo)
      .maybeSingle();

    if (fichaError) {
      console.error('Erro ao buscar ficha:', fichaError);
      return new Response(
        JSON.stringify({ valid: false, error: 'Erro ao buscar dados' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ficha) {
      console.log('Ficha não encontrada para protocolo:', protocolo);
      return new Response(
        JSON.stringify({ valid: false, error: 'Protocolo não encontrado' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine confirmation status
    const proprietarioConfirmado = !!ficha.proprietario_confirmado_em;
    const compradorConfirmado = !!ficha.comprador_confirmado_em;
    const confirmacaoCompleta = proprietarioConfirmado && compradorConfirmado;
    const confirmacaoParcial = proprietarioConfirmado || compradorConfirmado;

    // If no one confirmed, return invalid
    if (!confirmacaoParcial) {
      console.log('Ficha sem nenhuma confirmação');
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Visita ainda não possui nenhuma confirmação' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get broker profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('nome, creci')
      .eq('user_id', ficha.user_id)
      .maybeSingle();

    console.log('Comprovante válido para protocolo:', protocolo, '- Completo:', confirmacaoCompleta);

    // Return sanitized data (no CPF, no phone numbers) with integrity info
    // Now supports partial confirmations with clear indication
    return new Response(
      JSON.stringify({
        valid: true,
        confirmacao_completa: confirmacaoCompleta,
        confirmacao_parcial: confirmacaoParcial && !confirmacaoCompleta,
        protocolo: ficha.protocolo,
        data_visita: ficha.data_visita,
        imovel_tipo: ficha.imovel_tipo,
        imovel_endereco: ficha.imovel_endereco,
        proprietario_nome: ficha.proprietario_nome,
        comprador_nome: ficha.comprador_nome,
        proprietario_confirmado_em: ficha.proprietario_confirmado_em,
        comprador_confirmado_em: ficha.comprador_confirmado_em,
        corretor_nome: profile?.nome || null,
        corretor_creci: profile?.creci || null,
        // Integrity verification data (hash completa para verificação)
        integridade_verificavel: !!ficha.documento_hash,
        documento_hash: ficha.documento_hash || null,
        documento_gerado_em: ficha.documento_gerado_em || null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Erro na verificação:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ valid: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
