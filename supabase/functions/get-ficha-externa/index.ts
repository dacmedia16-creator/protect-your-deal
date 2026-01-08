import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token } = await req.json();
    console.log(`[get-ficha-externa] Token: ${token?.substring(0, 10)}...`);

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch convite to get ficha_id and validate
    const { data: convite, error: conviteError } = await supabase
      .from('convites_parceiro')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (conviteError || !convite) {
      console.error('[get-ficha-externa] Convite não encontrado:', conviteError);
      return new Response(
        JSON.stringify({ error: 'Convite não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if allows external access
    if (!convite.permite_externo) {
      return new Response(
        JSON.stringify({ error: 'Este convite requer login no sistema' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiration
    if (new Date(convite.expira_em) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Este convite expirou' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch ficha with service role
    const { data: ficha, error: fichaError } = await supabase
      .from('fichas_visita')
      .select('*')
      .eq('id', convite.ficha_id)
      .single();

    if (fichaError || !ficha) {
      console.error('[get-ficha-externa] Registro não encontrado:', fichaError);
      return new Response(
        JSON.stringify({ error: 'Registro não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[get-ficha-externa] Ficha encontrada: ${ficha.protocolo}`);

    return new Response(
      JSON.stringify({
        success: true,
        ficha: ficha,
        convite: {
          id: convite.id,
          ficha_id: convite.ficha_id,
          token: convite.token,
          status: convite.status,
          parte_faltante: convite.parte_faltante,
          expira_em: convite.expira_em,
          permite_externo: convite.permite_externo,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[get-ficha-externa] Error:', errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
