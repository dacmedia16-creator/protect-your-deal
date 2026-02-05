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

    // Verify user is imobiliaria_admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role, imobiliaria_id')
      .eq('user_id', currentUser.id)
      .eq('role', 'imobiliaria_admin')
      .maybeSingle();

    if (roleError || !roleData) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Acesso negado: apenas admin da imobiliária pode excluir corretores' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminImobiliariaId = roleData.imobiliaria_id;
    console.log('Admin imobiliaria_id:', adminImobiliariaId);

    // Parse request body
    const body: RequestBody = await req.json();
    const { user_id: targetUserId } = body;

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: 'user_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-deletion
    if (targetUserId === currentUser.id) {
      return new Response(
        JSON.stringify({ error: 'Você não pode excluir sua própria conta' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify target user belongs to the same imobiliaria
    const { data: targetProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('imobiliaria_id, nome')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (profileError || !targetProfile) {
      console.error('Target profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Corretor não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (targetProfile.imobiliaria_id !== adminImobiliariaId) {
      return new Response(
        JSON.stringify({ error: 'Este corretor não pertence à sua imobiliária' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if target user is also an admin (prevent deleting other admins)
    const { data: targetRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', targetUserId)
      .eq('role', 'imobiliaria_admin')
      .maybeSingle();

    if (targetRole) {
      return new Response(
        JSON.stringify({ error: 'Não é possível excluir outro administrador' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting deletion process for corretor:', targetUserId, targetProfile.nome);

    // ====== STEP 1: Clear phone number to free it for reuse ======
    console.log('[1/9] Clearing phone number from profile...');
    const { error: clearPhoneError } = await supabaseAdmin
      .from('profiles')
      .update({ telefone: null })
      .eq('user_id', targetUserId);

    if (clearPhoneError) {
      console.warn('Could not clear phone:', clearPhoneError.message);
    } else {
      console.log('[1/9] Phone number cleared successfully');
    }

    // ====== STEP 2: Delete from equipes_membros ======
    console.log('[2/9] Deleting from equipes_membros...');
    const { error: equipesError, count: equipesCount } = await supabaseAdmin
      .from('equipes_membros')
      .delete()
      .eq('user_id', targetUserId);

    if (equipesError) {
      console.warn('Could not delete from equipes_membros:', equipesError.message);
    } else {
      console.log(`[2/9] Deleted ${equipesCount ?? 0} records from equipes_membros`);
    }

    // ====== STEP 3: Delete from otp_queue ======
    console.log('[3/9] Deleting from otp_queue...');
    const { error: otpError, count: otpCount } = await supabaseAdmin
      .from('otp_queue')
      .delete()
      .eq('user_id', targetUserId);

    if (otpError) {
      console.warn('Could not delete from otp_queue:', otpError.message);
    } else {
      console.log(`[3/9] Deleted ${otpCount ?? 0} records from otp_queue`);
    }

    // ====== STEP 4: Delete from afiliados ======
    console.log('[4/9] Deleting from afiliados...');
    const { error: afiliadosError, count: afiliadosCount } = await supabaseAdmin
      .from('afiliados')
      .delete()
      .eq('user_id', targetUserId);

    if (afiliadosError) {
      console.warn('Could not delete from afiliados:', afiliadosError.message);
    } else {
      console.log(`[4/9] Deleted ${afiliadosCount ?? 0} records from afiliados`);
    }

    // ====== STEP 5: Delete templates_mensagem ======
    console.log('[5/9] Deleting from templates_mensagem...');
    const { error: templatesError, count: templatesCount } = await supabaseAdmin
      .from('templates_mensagem')
      .delete()
      .eq('user_id', targetUserId);

    if (templatesError) {
      console.warn('Could not delete from templates_mensagem:', templatesError.message);
    } else {
      console.log(`[5/9] Deleted ${templatesCount ?? 0} records from templates_mensagem`);
    }

    // ====== STEP 6: Nullify audit_logs (preserve history) ======
    console.log('[6/9] Nullifying user_id in audit_logs...');
    const { error: auditError, count: auditCount } = await supabaseAdmin
      .from('audit_logs')
      .update({ user_id: null })
      .eq('user_id', targetUserId);

    if (auditError) {
      console.warn('Could not update audit_logs:', auditError.message);
    } else {
      console.log(`[6/9] Updated ${auditCount ?? 0} records in audit_logs`);
    }

    // ====== STEP 7: Transfer fichas_visita to admin ======
    console.log('[7/9] Transferring fichas_visita to admin...');
    const { count: transferredCount } = await supabaseAdmin
      .from('fichas_visita')
      .update({ user_id: currentUser.id })
      .eq('user_id', targetUserId);
    
    console.log(`[7/9] Transferred ${transferredCount ?? 0} fichas to admin ${currentUser.id}`);

    // ====== STEP 8: Clear corretor_parceiro_id references ======
    console.log('[8/12] Clearing corretor_parceiro_id references...');
    const { count: partnerCount } = await supabaseAdmin
      .from('fichas_visita')
      .update({ corretor_parceiro_id: null })
      .eq('corretor_parceiro_id', targetUserId);
    
    console.log(`[8/12] Cleared ${partnerCount ?? 0} corretor_parceiro_id references`);

    // ====== STEP 9: Clear app_versions published_by ======
    console.log('[9/12] Clearing app_versions published_by...');
    const { count: appVersionsCount } = await supabaseAdmin
      .from('app_versions')
      .update({ published_by: null })
      .eq('published_by', targetUserId);

    console.log(`[9/12] Cleared ${appVersionsCount ?? 0} app_versions references`);

    // ====== STEP 10: Delete user_sessions ======
    console.log('[10/12] Deleting user_sessions...');
    const { count: sessionsCount } = await supabaseAdmin
      .from('user_sessions')
      .delete()
      .eq('user_id', targetUserId);

    console.log(`[10/12] Deleted ${sessionsCount ?? 0} user_sessions`);

    // ====== STEP 11: Clear convites.convidado_por ======
    console.log('[11/12] Clearing convites.convidado_por...');
    const { count: convitesCount } = await supabaseAdmin
      .from('convites')
      .update({ convidado_por: null })
      .eq('convidado_por', targetUserId);

    console.log(`[11/12] Cleared ${convitesCount ?? 0} convites references`);

    // ====== STEP 12: Delete user from auth.users (cascades to user_roles and profiles) ======
    console.log('[12/12] Deleting user from auth.users...');
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return new Response(
        JSON.stringify({ error: deleteError.message || 'Erro ao excluir corretor' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Corretor deleted successfully:', targetUserId);

    return new Response(
      JSON.stringify({ success: true, message: 'Corretor excluído com sucesso' }),
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
