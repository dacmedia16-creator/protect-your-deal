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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check roles: super_admin, imobiliaria_admin, or construtora_admin
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role, imobiliaria_id, construtora_id')
      .eq('user_id', user.id);

    if (rolesError) {
      return new Response(
        JSON.stringify({ error: 'Error fetching user roles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isSuperAdmin = roles?.some(r => r.role === 'super_admin');
    const adminRole = roles?.find(r => r.role === 'imobiliaria_admin');
    const construtoraAdminRole = roles?.find(r => r.role === 'construtora_admin');

    if (!isSuperAdmin && !adminRole && !construtoraAdminRole) {
      return new Response(
        JSON.stringify({ error: 'Only admins can reset corretor passwords' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: ResetPasswordRequest = await req.json();
    const { user_id, new_password } = body;

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!new_password || new_password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'A senha deve ter pelo menos 6 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the corretor belongs to the same org (unless super_admin)
    if (!isSuperAdmin) {
      if (adminRole) {
        const { data: corretorRole } = await supabaseAdmin
          .from('user_roles')
          .select('imobiliaria_id')
          .eq('user_id', user_id)
          .eq('role', 'corretor')
          .single();

        if (!corretorRole || corretorRole.imobiliaria_id !== adminRole.imobiliaria_id) {
          return new Response(
            JSON.stringify({ error: 'Corretor not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else if (construtoraAdminRole) {
        const { data: corretorRole } = await supabaseAdmin
          .from('user_roles')
          .select('construtora_id')
          .eq('user_id', user_id)
          .eq('role', 'corretor')
          .single();

        if (!corretorRole || corretorRole.construtora_id !== construtoraAdminRole.construtora_id) {
          return new Response(
            JSON.stringify({ error: 'Corretor not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Update the password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      { password: new_password }
    );

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to reset password: ' + updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Senha redefinida com sucesso' }),
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
