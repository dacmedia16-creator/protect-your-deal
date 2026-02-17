import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PromoteRequest {
  user_id: string;
  new_role: 'corretor' | 'imobiliaria_admin';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase clients
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    // Verify current user
    const { data: { user: currentUser }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !currentUser) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Current user:', currentUser.id);

    // Get current user's role and imobiliaria
    const { data: currentUserRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role, imobiliaria_id')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (roleError) {
      console.error('Role error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Error fetching user role' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Must be super_admin or imobiliaria_admin
    if (!currentUserRole || !['super_admin', 'imobiliaria_admin'].includes(currentUserRole.role)) {
      console.error('User is not admin:', currentUserRole);
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem promover/rebaixar usuários.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { user_id, new_role }: PromoteRequest = await req.json();

    if (!user_id || !new_role) {
      return new Response(
        JSON.stringify({ error: 'user_id and new_role are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['corretor', 'imobiliaria_admin'].includes(new_role)) {
      return new Response(
        JSON.stringify({ error: 'new_role must be corretor or imobiliaria_admin' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Promote request:', { user_id, new_role });

    // Prevent admin from demoting themselves
    if (user_id === currentUser.id) {
      return new Response(
        JSON.stringify({ error: 'Você não pode alterar sua própria role.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get target user's role
    const { data: targetRole, error: targetRoleError } = await supabaseAdmin
      .from('user_roles')
      .select('role, imobiliaria_id')
      .eq('user_id', user_id)
      .maybeSingle();

    if (targetRoleError) {
      console.error('Target role error:', targetRoleError);
      return new Response(
        JSON.stringify({ error: 'Error fetching target user role' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!targetRole) {
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cannot modify super_admins
    if (targetRole.role === 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Não é possível alterar a role de super admins.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // imobiliaria_admin can only modify users from their own imobiliaria
    if (currentUserRole.role === 'imobiliaria_admin') {
      if (!currentUserRole.imobiliaria_id) {
        return new Response(
          JSON.stringify({ error: 'Você não está vinculado a uma imobiliária.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (targetRole.imobiliaria_id !== currentUserRole.imobiliaria_id) {
        return new Response(
          JSON.stringify({ error: 'Você só pode alterar usuários da sua imobiliária.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Update the role
    const { error: updateError } = await supabaseAdmin
      .from('user_roles')
      .update({ role: new_role })
      .eq('user_id', user_id);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar role do usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully updated role for user', user_id, 'to', new_role);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: new_role === 'imobiliaria_admin' 
          ? 'Usuário promovido a administrador com sucesso!' 
          : 'Usuário rebaixado para corretor com sucesso!'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
