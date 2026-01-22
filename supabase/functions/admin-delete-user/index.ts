import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  user_id: string;
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
        JSON.stringify({ error: 'Acesso negado: apenas super_admin pode excluir usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User is super_admin, proceeding...');

    // Parse request body
    const body: RequestBody = await req.json();
    const { user_id } = body;

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-deletion
    if (user_id === currentUser.id) {
      return new Response(
        JSON.stringify({ error: 'Você não pode excluir sua própria conta' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if target user is a super_admin
    const { data: targetRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)
      .eq('role', 'super_admin')
      .maybeSingle();

    if (targetRole) {
      return new Response(
        JSON.stringify({ error: 'Não é possível excluir outro super_admin' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting deletion process for user:', user_id);

    // ====== STEP 1: Clear phone number to free it for reuse ======
    console.log('[1/7] Clearing phone number from profile...');
    const { error: clearPhoneError, count: phoneCount } = await supabaseAdmin
      .from('profiles')
      .update({ telefone: null })
      .eq('user_id', user_id);

    if (clearPhoneError) {
      console.warn('Could not clear phone:', clearPhoneError.message);
    } else {
      console.log('[1/7] Phone number cleared successfully');
    }

    // ====== STEP 2: Delete from equipes_membros ======
    console.log('[2/7] Deleting from equipes_membros...');
    const { error: equipesError, count: equipesCount } = await supabaseAdmin
      .from('equipes_membros')
      .delete()
      .eq('user_id', user_id);

    if (equipesError) {
      console.warn('Could not delete from equipes_membros:', equipesError.message);
    } else {
      console.log(`[2/7] Deleted ${equipesCount ?? 0} records from equipes_membros`);
    }

    // ====== STEP 3: Delete from otp_queue ======
    console.log('[3/7] Deleting from otp_queue...');
    const { error: otpError, count: otpCount } = await supabaseAdmin
      .from('otp_queue')
      .delete()
      .eq('user_id', user_id);

    if (otpError) {
      console.warn('Could not delete from otp_queue:', otpError.message);
    } else {
      console.log(`[3/7] Deleted ${otpCount ?? 0} records from otp_queue`);
    }

    // ====== STEP 4: Delete from afiliados ======
    console.log('[4/7] Deleting from afiliados...');
    const { error: afiliadosError, count: afiliadosCount } = await supabaseAdmin
      .from('afiliados')
      .delete()
      .eq('user_id', user_id);

    if (afiliadosError) {
      console.warn('Could not delete from afiliados:', afiliadosError.message);
    } else {
      console.log(`[4/7] Deleted ${afiliadosCount ?? 0} records from afiliados`);
    }

    // ====== STEP 5: Nullify audit_logs (preserve history) ======
    console.log('[5/7] Nullifying user_id in audit_logs...');
    const { error: auditError, count: auditCount } = await supabaseAdmin
      .from('audit_logs')
      .update({ user_id: null })
      .eq('user_id', user_id);

    if (auditError) {
      console.warn('Could not update audit_logs:', auditError.message);
    } else {
      console.log(`[5/7] Updated ${auditCount ?? 0} records in audit_logs`);
    }

    // ====== STEP 6: Delete templates_mensagem ======
    console.log('[6/9] Deleting from templates_mensagem...');
    const { error: templatesError, count: templatesCount } = await supabaseAdmin
      .from('templates_mensagem')
      .delete()
      .eq('user_id', user_id);

    if (templatesError) {
      console.warn('Could not delete from templates_mensagem:', templatesError.message);
    } else {
      console.log(`[6/9] Deleted ${templatesCount ?? 0} records from templates_mensagem`);
    }

    // ====== STEP 7: Reassign fichas_visita to imobiliaria admin ======
    console.log('[7/9] Reassigning fichas_visita...');
    
    // Get user's imobiliaria_id from profile
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('imobiliaria_id')
      .eq('user_id', user_id)
      .single();

    if (userProfile?.imobiliaria_id) {
      // Find imobiliaria admin (different from the user being deleted)
      const { data: adminRole } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('imobiliaria_id', userProfile.imobiliaria_id)
        .eq('role', 'imobiliaria_admin')
        .neq('user_id', user_id)
        .maybeSingle();

      if (adminRole?.user_id) {
        // Transfer fichas to admin
        const { count: transferredCount } = await supabaseAdmin
          .from('fichas_visita')
          .update({ user_id: adminRole.user_id })
          .eq('user_id', user_id);
        
        console.log(`[7/9] Transferred ${transferredCount ?? 0} fichas to admin ${adminRole.user_id}`);
      } else {
        // If deleting admin or no admin found, keep fichas orphaned with null user_id
        const { count: orphanedCount } = await supabaseAdmin
          .from('fichas_visita')
          .update({ user_id: null })
          .eq('user_id', user_id);
        
        console.log(`[7/9] Orphaned ${orphanedCount ?? 0} fichas (no admin available)`);
      }
    } else {
      // Corretor autônomo - keep fichas with null user_id
      const { count: orphanedCount } = await supabaseAdmin
        .from('fichas_visita')
        .update({ user_id: null })
        .eq('user_id', user_id);
      
      console.log(`[7/9] Orphaned ${orphanedCount ?? 0} fichas (autonomous corretor)`);
    }

    // ====== STEP 8: Reassign corretor_parceiro_id in fichas_visita ======
    console.log('[8/9] Clearing corretor_parceiro_id references...');
    const { count: partnerCount } = await supabaseAdmin
      .from('fichas_visita')
      .update({ corretor_parceiro_id: null })
      .eq('corretor_parceiro_id', user_id);
    
    console.log(`[8/9] Cleared ${partnerCount ?? 0} corretor_parceiro_id references`);

    // ====== STEP 9: Delete user from auth.users (cascades to user_roles and profiles) ======
    console.log('[9/9] Deleting user from auth.users...');
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return new Response(
        JSON.stringify({ error: deleteError.message || 'Erro ao excluir usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User deleted successfully:', user_id);

    return new Response(
      JSON.stringify({ success: true, message: 'Usuário excluído com sucesso' }),
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
