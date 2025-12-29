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
    console.log(`Aceitar convite parceiro: token=${token}, user=${user.id}`);

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
      console.error('Convite não encontrado:', conviteError);
      return new Response(
        JSON.stringify({ error: 'Convite não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
      console.log(`Aviso: telefone do usuário (${userPhone}) diferente do convite (${invitePhone})`);
      // Still allow - user might have changed phone or logged in with different number
    }

    // Update invite status
    const { error: updateConviteError } = await supabase
      .from('convites_parceiro')
      .update({
        status: 'aceito',
        corretor_parceiro_id: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', convite.id);

    if (updateConviteError) {
      console.error('Erro ao atualizar convite:', updateConviteError);
      return new Response(
        JSON.stringify({ error: 'Erro ao aceitar convite' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update ficha with partner broker
    const { error: updateFichaError } = await supabase
      .from('fichas_visita')
      .update({
        corretor_parceiro_id: user.id,
        parte_preenchida_parceiro: convite.parte_faltante,
      })
      .eq('id', convite.ficha_id);

    if (updateFichaError) {
      console.error('Erro ao atualizar ficha:', updateFichaError);
      return new Response(
        JSON.stringify({ error: 'Erro ao vincular à ficha' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the ficha data
    const { data: ficha } = await supabase
      .from('fichas_visita')
      .select('*')
      .eq('id', convite.ficha_id)
      .single();

    console.log(`Convite aceito: user=${user.id}, ficha=${convite.ficha_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        ficha,
        parte_faltante: convite.parte_faltante,
        message: 'Convite aceito com sucesso!',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Error in aceitar-convite-parceiro:', errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
