import { requireRole, corsHeaders } from "../_shared/auth.ts";

interface RequestBody {
  email: string;
  password: string;
  nome: string;
  telefone?: string;
  creci?: string;
  role: 'corretor' | 'imobiliaria_admin' | 'construtora_admin';
  imobiliaria_id?: string;
  construtora_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await requireRole(req, "super_admin");
    if (authResult instanceof Response) return authResult;

    const { supabaseAdmin } = authResult;

    // Parse request body
    const body: RequestBody = await req.json();
    const { email, password, nome, telefone, creci, role, imobiliaria_id, construtora_id } = body;

    // Validate required fields
    if (!email || !password || !nome || !role) {
      return new Response(
        JSON.stringify({ error: 'email, password, nome e role são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'A senha deve ter pelo menos 6 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate role
    if (!['corretor', 'imobiliaria_admin', 'construtora_admin'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Role inválido. Use corretor, imobiliaria_admin ou construtora_admin' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate org_id is present for each role
    if (role === 'construtora_admin' && !construtora_id) {
      return new Response(
        JSON.stringify({ error: 'construtora_id é obrigatório para role construtora_admin' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if ((role === 'corretor' || role === 'imobiliaria_admin') && !imobiliaria_id && !construtora_id) {
      return new Response(
        JSON.stringify({ error: 'imobiliaria_id ou construtora_id é obrigatório para role corretor/imobiliaria_admin' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify entity exists based on role
    if (role === 'construtora_admin' && construtora_id) {
      const { data: construtora, error: constError } = await supabaseAdmin
        .from('construtoras')
        .select('id, nome')
        .eq('id', construtora_id)
        .maybeSingle();

      if (constError || !construtora) {
        return new Response(
          JSON.stringify({ error: 'Construtora não encontrada' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('Creating user for construtora:', construtora.nome);
    } else if (imobiliaria_id) {
      const { data: imobiliaria, error: imobError } = await supabaseAdmin
        .from('imobiliarias')
        .select('id, nome')
        .eq('id', imobiliaria_id)
        .maybeSingle();

      if (imobError || !imobiliaria) {
        return new Response(
          JSON.stringify({ error: 'Imobiliária não encontrada' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('Creating user for imobiliaria:', imobiliaria.nome);
    }

    // Create user in auth.users
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome }
    });

    if (createError) {
      console.error('Create user error:', createError);
      return new Response(
        JSON.stringify({ error: createError.message || 'Erro ao criar usuário' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: 'Erro ao criar usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User created:', newUser.user.id);

    // Update profile with additional info
    const profileUpdate: Record<string, unknown> = {
      nome,
      email,
      telefone: telefone || null,
      creci: creci || null,
    };
    if (imobiliaria_id) profileUpdate.imobiliaria_id = imobiliaria_id;
    if (construtora_id) profileUpdate.construtora_id = construtora_id;

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdate)
      .eq('user_id', newUser.user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
    }

    // Create user_role
    const roleInsert: Record<string, unknown> = {
      user_id: newUser.user.id,
      role,
    };
    if (imobiliaria_id) roleInsert.imobiliaria_id = imobiliaria_id;
    if (construtora_id) roleInsert.construtora_id = construtora_id;

    const { error: roleCreateError } = await supabaseAdmin
      .from('user_roles')
      .insert(roleInsert);

    if (roleCreateError) {
      console.error('Role creation error:', roleCreateError);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Usuário criado, mas houve erro ao atribuir role. Verifique manualmente.',
          user_id: newUser.user.id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User created successfully with role:', role);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuário criado com sucesso',
        user_id: newUser.user.id
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
