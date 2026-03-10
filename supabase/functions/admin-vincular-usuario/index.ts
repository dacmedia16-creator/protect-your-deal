import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create client for user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current user using token directly
    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      console.error('User auth error:', userError);
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
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Only super admins can perform this action' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { user_id, imobiliaria_id, backfill_fichas } = await req.json();
    const backfillFichas = Boolean(backfill_fichas);

    if (!user_id || !imobiliaria_id) {
      return new Response(
        JSON.stringify({ error: 'user_id and imobiliaria_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(
      `Vinculando usuário ${user_id} à imobiliária ${imobiliaria_id} | backfill_fichas=${backfillFichas}`
    );

    // supabaseAdmin already created above

    // Update user_roles table
    const { error: updateRoleError } = await supabaseAdmin
      .from('user_roles')
      .update({ imobiliaria_id })
      .eq('user_id', user_id);

    if (updateRoleError) {
      console.error('Error updating user_roles:', updateRoleError);
      return new Response(
        JSON.stringify({ error: 'Failed to update user role' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update profiles table
    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({ imobiliaria_id })
      .eq('user_id', user_id);

    if (updateProfileError) {
      console.error('Error updating profile:', updateProfileError);
      return new Response(
        JSON.stringify({ error: 'Failed to update profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete any individual subscription the user may have (orphan subscriptions)
    // When a broker is linked to an imobiliaria, they should use the imobiliaria's subscription
    let deletedSubscriptions = 0;
    const { data: individualSubs, error: findSubError } = await supabaseAdmin
      .from('assinaturas')
      .select('id')
      .eq('user_id', user_id)
      .is('imobiliaria_id', null);

    if (!findSubError && individualSubs && individualSubs.length > 0) {
      console.log(`Found ${individualSubs.length} individual subscription(s) to delete for user ${user_id}`);
      
      const { error: deleteSubError } = await supabaseAdmin
        .from('assinaturas')
        .delete()
        .eq('user_id', user_id)
        .is('imobiliaria_id', null);

      if (deleteSubError) {
        console.error('Error deleting individual subscriptions:', deleteSubError);
        // Non-critical, continue with the process
      } else {
        deletedSubscriptions = individualSubs.length;
        console.log(`Deleted ${deletedSubscriptions} individual subscription(s)`);
      }
    }

    let fichasBackfilled = 0;
    if (backfillFichas) {
      console.log(`Backfill: atualizando fichas_visita sem imobiliaria_id para o usuário ${user_id}`);

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
      console.log(`Backfill concluído: ${fichasBackfilled} ficha(s) atualizada(s).`);
    }

    console.log(`Usuário ${user_id} vinculado com sucesso à imobiliária ${imobiliaria_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User linked to imobiliaria successfully',
        backfill: { enabled: backfillFichas, updated: fichasBackfilled },
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
