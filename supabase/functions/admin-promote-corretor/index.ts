import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PromoteRequest {
  user_id: string;
  new_role: 'corretor' | 'imobiliaria_admin' | 'construtora_admin';
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

    // Verify current user using token directly
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: currentUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !currentUser) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Current user:', currentUser.id);

    // Get current user's role(s)
    const { data: currentUserRoles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role, imobiliaria_id, construtora_id')
      .eq('user_id', currentUser.id);

    if (roleError) {
      console.error('Role error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Error fetching user role' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isSuperAdmin = currentUserRoles?.some(r => r.role === 'super_admin');
    const imobAdminRole = currentUserRoles?.find(r => r.role === 'imobiliaria_admin');
    const constAdminRole = currentUserRoles?.find(r => r.role === 'construtora_admin');

    // Must be super_admin, imobiliaria_admin, or construtora_admin
    if (!isSuperAdmin && !imobAdminRole && !constAdminRole) {
      console.error('User is not admin:', currentUserRoles);
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

    if (!['corretor', 'imobiliaria_admin', 'construtora_admin'].includes(new_role)) {
      return new Response(
        JSON.stringify({ error: 'new_role must be corretor, imobiliaria_admin, or construtora_admin' }),
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
      .select('role, imobiliaria_id, construtora_id')
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
    if (imobAdminRole && !isSuperAdmin) {
      if (!imobAdminRole.imobiliaria_id) {
        return new Response(
          JSON.stringify({ error: 'Você não está vinculado a uma imobiliária.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (targetRole.imobiliaria_id !== imobAdminRole.imobiliaria_id) {
        return new Response(
          JSON.stringify({ error: 'Você só pode alterar usuários da sua imobiliária.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // construtora_admin can only modify users from their own construtora
    if (constAdminRole && !isSuperAdmin && !imobAdminRole) {
      if (!constAdminRole.construtora_id) {
        return new Response(
          JSON.stringify({ error: 'Você não está vinculado a uma construtora.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (targetRole.construtora_id !== constAdminRole.construtora_id) {
        return new Response(
          JSON.stringify({ error: 'Você só pode alterar usuários da sua construtora.' }),
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

    const messageMap: Record<string, string> = {
      'imobiliaria_admin': 'Usuário promovido a administrador com sucesso!',
      'construtora_admin': 'Usuário promovido a administrador com sucesso!',
      'corretor': 'Usuário rebaixado para corretor com sucesso!',
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: messageMap[new_role] || 'Role atualizada com sucesso!'
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
