import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { protocolo, pdf_base64 } = await req.json();

    console.log('Verificando integridade para protocolo:', protocolo);

    if (!protocolo) {
      return new Response(
        JSON.stringify({ integro: false, error: 'Protocolo não informado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pdf_base64) {
      return new Response(
        JSON.stringify({ integro: false, error: 'PDF não enviado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch ficha by protocolo
    const { data: ficha, error: fichaError } = await supabase
      .from('fichas_visita')
      .select('protocolo, documento_hash, documento_gerado_em')
      .eq('protocolo', protocolo)
      .maybeSingle();

    if (fichaError) {
      console.error('Erro ao buscar ficha:', fichaError);
      return new Response(
        JSON.stringify({ integro: false, error: 'Erro ao buscar dados' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ficha) {
      console.log('Ficha não encontrada para protocolo:', protocolo);
      return new Response(
        JSON.stringify({ integro: false, error: 'Protocolo não encontrado' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ficha.documento_hash) {
      console.log('Hash não disponível para protocolo:', protocolo);
      return new Response(
        JSON.stringify({ 
          integro: false, 
          error: 'Hash de integridade não disponível para este documento. O documento pode ter sido gerado antes da implementação desta funcionalidade.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decode base64 PDF
    let pdfBytes: Uint8Array;
    try {
      // Remove data URL prefix if present
      const base64Data = pdf_base64.replace(/^data:application\/pdf;base64,/, '');
      const binaryString = atob(base64Data);
      pdfBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        pdfBytes[i] = binaryString.charCodeAt(i);
      }
    } catch (e) {
      console.error('Erro ao decodificar PDF:', e);
      return new Response(
        JSON.stringify({ integro: false, error: 'Erro ao processar o arquivo PDF' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate SHA-256 hash of uploaded PDF
    const hashBuffer = await crypto.subtle.digest('SHA-256', pdfBytes.buffer as ArrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const uploadedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('Hash original:', ficha.documento_hash.substring(0, 16) + '...');
    console.log('Hash enviado:', uploadedHash.substring(0, 16) + '...');

    const integro = uploadedHash === ficha.documento_hash;

    console.log('Resultado da verificação:', integro ? 'ÍNTEGRO' : 'INCONCLUSIVO');

    return new Response(
      JSON.stringify({
        integro,
        protocolo: ficha.protocolo,
        hash_original: ficha.documento_hash,
        hash_enviado: uploadedHash,
        documento_gerado_em: ficha.documento_gerado_em,
        mensagem: integro 
          ? 'Documento íntegro - não foi alterado desde a geração original.' 
          : 'Não foi possível confirmar a integridade por upload. Use a verificação por protocolo/QR para validação.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Erro na verificação de integridade:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ integro: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
