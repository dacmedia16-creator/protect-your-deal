import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface UpdateCorretorRequest {
  user_id: string;
  nome?: string;
  telefone?: string | null;
  creci?: string | null;
  cpf?: string | null;
  email?: string | null;
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

    // Admin client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Get the authenticated user via token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      console.log('admin-update-corretor: Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('admin-update-corretor: Authenticated user:', user.id);

    // Check if user is imobiliaria_admin, construtora_admin, or super_admin
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role, imobiliaria_id, construtora_id')
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
    const imobiliariaId = adminRole?.imobiliaria_id;
    const construtoraAdminRole = roles?.find(r => r.role === 'construtora_admin');
    const construtoraId = construtoraAdminRole?.construtora_id;

    // Parse request body
    const body: UpdateCorretorRequest = await req.json();
    const { user_id, nome, telefone, creci, cpf, email, ativo } = body;

    console.log('admin-update-corretor: Request body:', { user_id, nome, telefone, creci, cpf, email, ativo });

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is a team leader for this corretor
    const { data: isLiderData } = await supabaseAdmin.rpc('is_membro_da_minha_equipe', {
      _lider_id: user.id,
      _membro_user_id: user_id
    });
    const isLiderOfMembro = isLiderData === true;

    console.log('admin-update-corretor: isLiderOfMembro:', isLiderOfMembro);

    // Authorization check: must be super_admin, imobiliaria_admin, or team leader
    if (!isSuperAdmin && !adminRole && !isLiderOfMembro) {
      console.log('admin-update-corretor: User has no permission');
      return new Response(
        JSON.stringify({ error: 'Sem permissão para alterar este corretor' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Team leaders can ONLY toggle ativo status - not edit other fields
    if (isLiderOfMembro && !isSuperAdmin && !adminRole) {
      if (nome !== undefined || telefone !== undefined || creci !== undefined || cpf !== undefined || email !== undefined) {
        console.log('admin-update-corretor: Leader tried to edit fields other than ativo');
        return new Response(
          JSON.stringify({ error: 'Líder de equipe só pode ativar/desativar corretores' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Verify the corretor belongs to the same imobiliaria (unless super_admin or leader)
    if (!isSuperAdmin && !isLiderOfMembro) {
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
    if (cpf !== undefined) updateData.cpf = cpf;
    if (email !== undefined) updateData.email = email;
    if (ativo !== undefined) {
      updateData.ativo = ativo;
      // If deactivating, also clear phone and transfer fichas
      if (ativo === false) {
        updateData.telefone = null;
        console.log('admin-update-corretor: Clearing phone due to deactivation');
        
        // Transfer fichas to imobiliaria admin (only if admin is doing this, not leader)
        if (imobiliariaId && !isLiderOfMembro) {
          // Find imobiliaria admin (different from the user being deactivated)
          const { data: adminRoleData } = await supabaseAdmin
            .from('user_roles')
            .select('user_id')
            .eq('imobiliaria_id', imobiliariaId)
            .eq('role', 'imobiliaria_admin')
            .neq('user_id', user_id)
            .maybeSingle();

          if (adminRoleData?.user_id) {
            // Transfer fichas to admin
            const { count: transferredCount } = await supabaseAdmin
              .from('fichas_visita')
              .update({ user_id: adminRoleData.user_id })
              .eq('user_id', user_id);
            
            console.log(`admin-update-corretor: Transferred ${transferredCount ?? 0} fichas to admin ${adminRoleData.user_id}`);
          } else {
            console.log('admin-update-corretor: No admin found, fichas will remain with deactivated user');
          }
        }
        
        // Clear corretor_parceiro_id references
        const { count: partnerCount } = await supabaseAdmin
          .from('fichas_visita')
          .update({ corretor_parceiro_id: null })
          .eq('corretor_parceiro_id', user_id);
        
        console.log(`admin-update-corretor: Cleared ${partnerCount ?? 0} corretor_parceiro_id references`);
      }
    }

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
