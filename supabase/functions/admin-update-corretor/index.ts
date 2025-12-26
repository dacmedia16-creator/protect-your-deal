import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UpdateCorretorRequest {
  user_id: string;
  nome?: string;
  telefone?: string | null;
  creci?: string | null;
  ativo?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('admin-update-corretor: Starting request');

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('admin-update-corretor: No authorization header');
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
      console.log('admin-update-corretor: Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('admin-update-corretor: Authenticated user:', user.id);

    // Check if user is imobiliaria_admin or super_admin
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role, imobiliaria_id')
      .eq('user_id', user.id);

    if (rolesError) {
      console.log('admin-update-corretor: Roles error:', rolesError);
      return new Response(
        JSON.stringify({ error: 'Error fetching user roles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isSuperAdmin = roles?.some(r => r.role === 'super_admin');
    const adminRole = roles?.find(r => r.role === 'imobiliaria_admin');

    if (!isSuperAdmin && !adminRole) {
      console.log('admin-update-corretor: User is not admin');
      return new Response(
        JSON.stringify({ error: 'Only admins can update corretores' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imobiliariaId = adminRole?.imobiliaria_id;
    console.log('admin-update-corretor: Imobiliaria ID:', imobiliariaId);

    // Parse request body
    const body: UpdateCorretorRequest = await req.json();
    const { user_id, nome, telefone, creci, ativo } = body;

    console.log('admin-update-corretor: Request body:', { user_id, nome, telefone, creci, ativo });

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
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
        console.log('admin-update-corretor: Corretor not found');
        return new Response(
          JSON.stringify({ error: 'Corretor not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (corretorRole.imobiliaria_id !== imobiliariaId) {
        console.log('admin-update-corretor: Corretor belongs to different imobiliaria');
        return new Response(
          JSON.stringify({ error: 'Corretor not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Build update object
    const updateData: Record<string, any> = {};
    if (nome !== undefined) updateData.nome = nome;
    if (telefone !== undefined) updateData.telefone = telefone;
    if (creci !== undefined) updateData.creci = creci;
    if (ativo !== undefined) updateData.ativo = ativo;

    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({ error: 'No fields to update' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('admin-update-corretor: Updating profile with:', updateData);

    // Update the profile
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('user_id', user_id)
      .select()
      .single();

    if (updateError) {
      console.log('admin-update-corretor: Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update corretor' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('admin-update-corretor: Successfully updated corretor:', user_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Corretor atualizado com sucesso',
        profile: updatedProfile
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('admin-update-corretor: Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
