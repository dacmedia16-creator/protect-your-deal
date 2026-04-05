import { requireAnyRole, corsHeaders } from "../_shared/auth.ts";

interface PromoteRequest {
  user_id: string;
  new_role: 'corretor' | 'imobiliaria_admin' | 'construtora_admin';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await requireAnyRole(req, ["super_admin", "imobiliaria_admin", "construtora_admin"]);
    if (authResult instanceof Response) return authResult;

    const { user: currentUser, supabaseAdmin, role: callerRole, roleData } = authResult;

    const isSuperAdmin = callerRole === "super_admin";

    console.log('Current user:', currentUser.id, 'role:', callerRole);

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
    if (callerRole === 'imobiliaria_admin' && !isSuperAdmin) {
      if (!roleData.imobiliaria_id) {
        return new Response(
          JSON.stringify({ error: 'Você não está vinculado a uma imobiliária.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (targetRole.imobiliaria_id !== roleData.imobiliaria_id) {
        return new Response(
          JSON.stringify({ error: 'Você só pode alterar usuários da sua imobiliária.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // construtora_admin can only modify users from their own construtora
    if (callerRole === 'construtora_admin' && !isSuperAdmin) {
      if (!roleData.construtora_id) {
        return new Response(
          JSON.stringify({ error: 'Você não está vinculado a uma construtora.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (targetRole.construtora_id !== roleData.construtora_id) {
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
