import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AceitarConviteRequest {
  token: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jwtToken = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwtToken);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { token }: AceitarConviteRequest = await req.json();
    console.log(`[aceitar-convite] Iniciando: token=${token}, user=${user.id}`);

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the invite
    const { data: convite, error: conviteError } = await supabase
      .from('convites_parceiro')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (conviteError || !convite) {
      console.error('[aceitar-convite] Convite não encontrado:', conviteError);
      return new Response(
        JSON.stringify({ error: 'Convite não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[aceitar-convite] Convite encontrado: id=${convite.id}, status=${convite.status}, ficha_id=${convite.ficha_id}`);

    // Check if expired
    if (new Date(convite.expira_em) < new Date()) {
      await supabase
        .from('convites_parceiro')
        .update({ status: 'expirado' })
        .eq('id', convite.id);

      return new Response(
        JSON.stringify({ error: 'Este convite expirou' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already accepted
    if (convite.status === 'aceito') {
      // If already accepted by this user, just return success
      if (convite.corretor_parceiro_id === user.id) {
        console.log(`[aceitar-convite] Convite já aceito por este usuário, retornando sucesso`);
        const { data: ficha } = await supabase
          .from('fichas_visita')
          .select('*')
          .eq('id', convite.ficha_id)
          .single();

        return new Response(
          JSON.stringify({
            success: true,
            already_accepted: true,
            ficha,
            parte_faltante: convite.parte_faltante,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Este convite já foi aceito por outro corretor' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's profile to check phone match (optional - just for logging)
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('telefone, nome')
      .eq('user_id', user.id)
      .maybeSingle();

    const userPhone = userProfile?.telefone?.replace(/\D/g, '');
    const invitePhone = convite.corretor_parceiro_telefone?.replace(/\D/g, '');
    
    if (invitePhone && userPhone && userPhone !== invitePhone) {
      console.log(`[aceitar-convite] Aviso: telefone do usuário (${userPhone}) diferente do convite (${invitePhone})`);
    }

    // Update invite status
    console.log(`[aceitar-convite] Atualizando convite para aceito...`);
    const { error: updateConviteError } = await supabase
      .from('convites_parceiro')
      .update({
        status: 'aceito',
        corretor_parceiro_id: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', convite.id);

    if (updateConviteError) {
      console.error('[aceitar-convite] Erro ao atualizar convite:', updateConviteError);
      return new Response(
        JSON.stringify({ error: 'Erro ao aceitar convite' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log(`[aceitar-convite] Convite atualizado com sucesso`);

    // Update ficha with partner broker - CRITICAL STEP
    console.log(`[aceitar-convite] Atualizando ficha ${convite.ficha_id} com corretor_parceiro_id=${user.id}...`);
    const { data: fichaUpdateResult, error: updateFichaError } = await supabase
      .from('fichas_visita')
      .update({
        corretor_parceiro_id: user.id,
        parte_preenchida_parceiro: convite.parte_faltante,
      })
      .eq('id', convite.ficha_id)
      .select()
      .single();

    if (updateFichaError) {
      console.error('[aceitar-convite] ERRO CRÍTICO ao atualizar ficha:', updateFichaError);
      // Revert convite status
      await supabase
        .from('convites_parceiro')
        .update({ status: 'pendente', corretor_parceiro_id: null })
        .eq('id', convite.id);
      
      return new Response(
        JSON.stringify({ error: 'Erro ao vincular à ficha. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[aceitar-convite] Ficha atualizada com sucesso:`, {
      id: fichaUpdateResult.id,
      corretor_parceiro_id: fichaUpdateResult.corretor_parceiro_id,
      parte_preenchida_parceiro: fichaUpdateResult.parte_preenchida_parceiro,
    });

    console.log(`[aceitar-convite] SUCESSO: user=${user.id}, ficha=${convite.ficha_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        ficha: fichaUpdateResult,
        parte_faltante: convite.parte_faltante,
        message: 'Convite aceito com sucesso!',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[aceitar-convite] Error:', errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});