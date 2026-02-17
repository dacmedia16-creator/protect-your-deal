import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface RequestBody {
  email: string;
  password: string;
  nome: string;
  telefone?: string;
  creci?: string;
  role: 'corretor' | 'imobiliaria_admin';
  imobiliaria_id: string;
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
        JSON.stringify({ error: 'Token de autorização não fornecido' }),
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

    // Verify user is authenticated
    const { data: { user: currentUser }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !currentUser) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Current user ID:', currentUser.id);

    // Verify user is super_admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id)
      .eq('role', 'super_admin')
      .maybeSingle();

    if (roleError || !roleData) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Acesso negado: apenas super_admin pode criar usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User is super_admin, proceeding...');

    // Parse request body
    const body: RequestBody = await req.json();
    const { email, password, nome, telefone, creci, role, imobiliaria_id } = body;

    // Validate required fields
    if (!email || !password || !nome || !role || !imobiliaria_id) {
      return new Response(
        JSON.stringify({ error: 'email, password, nome, role e imobiliaria_id são obrigatórios' }),
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
    if (!['corretor', 'imobiliaria_admin'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Role inválido. Use corretor ou imobiliaria_admin' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify imobiliaria exists
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
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        nome,
        telefone: telefone || null,
        creci: creci || null,
        imobiliaria_id,
      })
      .eq('user_id', newUser.user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Profile is created by trigger, so we try to update. If it fails, log but continue
    }

    // Create user_role
    const { error: roleCreateError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role,
        imobiliaria_id,
      });

    if (roleCreateError) {
      console.error('Role creation error:', roleCreateError);
      // User was created, so we return success but with warning
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
