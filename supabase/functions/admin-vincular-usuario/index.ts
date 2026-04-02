import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify super_admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Only super admins can perform this action' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user_id, imobiliaria_id, construtora_id, backfill_fichas } = await req.json();
    const backfillFichas = Boolean(backfill_fichas);

    if (!user_id || (!imobiliaria_id && !construtora_id)) {
      return new Response(
        JSON.stringify({ error: 'user_id and either imobiliaria_id or construtora_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isConstrutora = !!construtora_id;
    const orgId = isConstrutora ? construtora_id : imobiliaria_id;
    const orgType = isConstrutora ? 'construtora' : 'imobiliária';

    console.log(`Vinculando usuário ${user_id} à ${orgType} ${orgId} | backfill_fichas=${backfillFichas}`);

    // Update user_roles
    const roleUpdate: Record<string, unknown> = isConstrutora
      ? { construtora_id, role: 'construtora_admin' }
      : { imobiliaria_id };

    const { error: updateRoleError } = await supabaseAdmin
      .from('user_roles')
      .update(roleUpdate)
      .eq('user_id', user_id);

    if (updateRoleError) {
      console.error('Error updating user_roles:', updateRoleError);
      return new Response(
        JSON.stringify({ error: 'Failed to update user role' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update profiles
    const profileUpdate: Record<string, unknown> = isConstrutora
      ? { construtora_id }
      : { imobiliaria_id };

    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdate)
      .eq('user_id', user_id);

    if (updateProfileError) {
      console.error('Error updating profile:', updateProfileError);
      return new Response(
        JSON.stringify({ error: 'Failed to update profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete orphan individual subscriptions
    let deletedSubscriptions = 0;
    const { data: individualSubs, error: findSubError } = await supabaseAdmin
      .from('assinaturas')
      .select('id')
      .eq('user_id', user_id)
      .is('imobiliaria_id', null)
      .is('construtora_id', null);

    if (!findSubError && individualSubs && individualSubs.length > 0) {
      console.log(`Found ${individualSubs.length} individual subscription(s) to delete`);
      const { error: deleteSubError } = await supabaseAdmin
        .from('assinaturas')
        .delete()
        .eq('user_id', user_id)
        .is('imobiliaria_id', null)
        .is('construtora_id', null);

      if (!deleteSubError) {
        deletedSubscriptions = individualSubs.length;
      }
    }

    // Backfill fichas (only for imobiliarias)
    let fichasBackfilled = 0;
    if (backfillFichas && !isConstrutora) {
      const { data: updatedFichas, error: backfillError } = await supabaseAdmin
        .from('fichas_visita')
        .update({ imobiliaria_id })
        .eq('user_id', user_id)
        .is('imobiliaria_id', null)
        .select('id');

      if (backfillError) {
        console.error('Error backfilling fichas_visita:', backfillError);
        return new Response(
          JSON.stringify({ error: 'Failed to backfill fichas_visita' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      fichasBackfilled = updatedFichas?.length ?? 0;
    }

    console.log(`Usuário ${user_id} vinculado com sucesso à ${orgType} ${orgId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `User linked to ${orgType} successfully`,
        backfill: { enabled: backfillFichas && !isConstrutora, updated: fichasBackfilled },
        subscriptions_deleted: deletedSubscriptions,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
