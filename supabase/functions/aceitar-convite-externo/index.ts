import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AceitarExternoRequest {
  token: string;
  dados: {
    nome: string | null;
    cpf: string | null;
    telefone: string;
    autopreenchimento: boolean;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token, dados }: AceitarExternoRequest = await req.json();
    console.log(`[aceitar-convite-externo] Token: ${token?.substring(0, 10)}...`);

    if (!token || !dados?.telefone) {
      return new Response(
        JSON.stringify({ error: 'Dados incompletos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch convite
    const { data: convite, error: conviteError } = await supabase
      .from('convites_parceiro')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (conviteError || !convite) {
      console.error('[aceitar-convite-externo] Convite não encontrado:', conviteError);
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

    // Update convite status to 'aceito' if not already
    if (convite.status !== 'aceito') {
      const { error: updateConviteError } = await supabase
        .from('convites_parceiro')
        .update({ 
          status: 'aceito',
          updated_at: new Date().toISOString()
        })
        .eq('id', convite.id);

      if (updateConviteError) {
        console.error('[aceitar-convite-externo] Erro ao atualizar convite:', updateConviteError);
        return new Response(
          JSON.stringify({ error: 'Erro ao aceitar convite' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Prepare update data based on parte_faltante
    const updateData = convite.parte_faltante === 'proprietario'
      ? {
          proprietario_telefone: dados.telefone,
          proprietario_nome: dados.nome,
          proprietario_cpf: dados.cpf,
          proprietario_autopreenchimento: dados.autopreenchimento,
        }
      : {
          comprador_telefone: dados.telefone,
          comprador_nome: dados.nome,
          comprador_cpf: dados.cpf,
          comprador_autopreenchimento: dados.autopreenchimento,
        };

    console.log(`[aceitar-convite-externo] Atualizando ficha ${convite.ficha_id} com:`, updateData);

    // Update ficha with service role (bypasses RLS)
    const { data: updatedFicha, error: updateFichaError } = await supabase
      .from('fichas_visita')
      .update(updateData)
      .eq('id', convite.ficha_id)
      .select()
      .single();

    if (updateFichaError) {
      console.error('[aceitar-convite-externo] Erro ao atualizar ficha:', updateFichaError);
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar dados no registro' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[aceitar-convite-externo] Ficha atualizada com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        ficha: updatedFicha,
        message: 'Dados salvos com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[aceitar-convite-externo] Error:', errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
