import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface ResetPasswordRequest {
  user_id: string;
  new_password: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('admin-reset-corretor-password: Starting request');

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('admin-reset-corretor-password: No authorization header');
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Client for user authentication
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    // Admin client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.log('admin-reset-corretor-password: Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('admin-reset-corretor-password: Authenticated user:', user.id);

    // Check if user is imobiliaria_admin or super_admin
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role, imobiliaria_id')
      .eq('user_id', user.id);

    if (rolesError) {
      console.log('admin-reset-corretor-password: Roles error:', rolesError);
      return new Response(
        JSON.stringify({ error: 'Error fetching user roles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isSuperAdmin = roles?.some(r => r.role === 'super_admin');
    const adminRole = roles?.find(r => r.role === 'imobiliaria_admin');

    if (!isSuperAdmin && !adminRole) {
      console.log('admin-reset-corretor-password: User is not admin');
      return new Response(
        JSON.stringify({ error: 'Only admins can reset corretor passwords' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imobiliariaId = adminRole?.imobiliaria_id;
    console.log('admin-reset-corretor-password: Imobiliaria ID:', imobiliariaId);

    // Parse request body
    const body: ResetPasswordRequest = await req.json();
    const { user_id, new_password } = body;

    console.log('admin-reset-corretor-password: Request for user_id:', user_id);

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!new_password) {
      return new Response(
        JSON.stringify({ error: 'new_password is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (new_password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'A senha deve ter pelo menos 6 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the corretor belongs to the same imobiliaria (unless super_admin)
    if (!isSuperAdmin) {
      const { data: corretorRole, error: corretorRoleError } = await supabaseAdmin
        .from('user_roles')
        .select('imobiliaria_id')
        .eq('user_id', user_id)
        .eq('role', 'corretor')
        .single();

      if (corretorRoleError || !corretorRole) {
        console.log('admin-reset-corretor-password: Corretor not found');
        return new Response(
          JSON.stringify({ error: 'Corretor not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (corretorRole.imobiliaria_id !== imobiliariaId) {
        console.log('admin-reset-corretor-password: Corretor belongs to different imobiliaria');
        return new Response(
          JSON.stringify({ error: 'Corretor not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Update the password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      { password: new_password }
    );

    if (updateError) {
      console.log('admin-reset-corretor-password: Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to reset password: ' + updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('admin-reset-corretor-password: Successfully reset password for:', user_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Senha redefinida com sucesso'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('admin-reset-corretor-password: Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
