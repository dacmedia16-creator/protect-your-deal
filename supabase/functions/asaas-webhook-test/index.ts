import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is authenticated and is super_admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is super_admin
    const { data: isSuperAdmin } = await supabase.rpc('is_super_admin', { _user_id: user.id });
    if (!isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: 'Access denied. Super admin required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action } = await req.json();

    // Ação 1: Verificar configuração
    if (action === 'check-config') {
      const hasApiKey = !!Deno.env.get('ASAAS_API_KEY');
      const isSandbox = Deno.env.get('ASAAS_SANDBOX') === 'true';
      const apiKeyPrefix = hasApiKey ? Deno.env.get('ASAAS_API_KEY')?.substring(0, 10) + '...' : null;
      
      return new Response(JSON.stringify({
        success: true,
        config: {
          asaas_api_key_configured: hasApiKey,
          asaas_api_key_prefix: apiKeyPrefix,
          sandbox_mode: isSandbox,
          webhook_url: `${supabaseUrl}/functions/v1/asaas-webhook`
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Ação 2: Listar últimos logs do webhook
    if (action === 'list-logs') {
      const { data: logs, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('source', 'asaas')
        .order('created_at', { ascending: false })
        .limit(20);

      return new Response(JSON.stringify({
        success: true,
        logs: logs || [],
        count: logs?.length || 0,
        error: error?.message
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Ação 3: Simular evento de pagamento (registra apenas no log)
    if (action === 'simulate-payment') {
      const testPayload = {
        event: 'PAYMENT_RECEIVED',
        payment: {
          id: 'test_payment_' + Date.now(),
          customer: 'cus_test_' + Math.random().toString(36).substring(7),
          subscription: 'sub_test_' + Math.random().toString(36).substring(7),
          status: 'RECEIVED',
          value: 49.90,
          externalReference: JSON.stringify({
            planoId: 'test-plan-id',
            userId: user.id,
            source: 'webhook-test-simulation'
          })
        }
      };

      // Registrar o teste no banco
      const { error: insertError } = await supabase
        .from('webhook_logs')
        .insert({
          source: 'asaas-test',
          event_type: 'PAYMENT_RECEIVED_SIMULATED',
          payload: testPayload,
          processed: true
        });

      if (insertError) {
        return new Response(JSON.stringify({
          success: false,
          error: insertError.message
        }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Evento de teste registrado com sucesso',
        payload: testPayload
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Ação 4: Verificar status das assinaturas com Asaas
    if (action === 'check-subscriptions') {
      const { data: assinaturas, error } = await supabase
        .from('assinaturas')
        .select(`
          id, 
          status, 
          asaas_customer_id, 
          asaas_subscription_id, 
          created_at,
          plano_id,
          imobiliaria_id,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      const comAsaas = assinaturas?.filter(a => a.asaas_subscription_id) || [];
      const semAsaas = assinaturas?.filter(a => !a.asaas_subscription_id) || [];

      return new Response(JSON.stringify({
        success: true,
        total: assinaturas?.length || 0,
        com_asaas: comAsaas.length,
        sem_asaas: semAsaas.length,
        assinaturas: assinaturas || [],
        error: error?.message
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Ação 5: Limpar logs antigos (mais de 30 dias)
    if (action === 'clear-old-logs') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: deleted, error } = await supabase
        .from('webhook_logs')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString())
        .select('id');

      return new Response(JSON.stringify({
        success: !error,
        deleted_count: deleted?.length || 0,
        error: error?.message
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Ação 6: Estatísticas dos logs
    if (action === 'stats') {
      const { data: logs } = await supabase
        .from('webhook_logs')
        .select('event_type, processed, source, created_at')
        .eq('source', 'asaas')
        .order('created_at', { ascending: false })
        .limit(100);

      const stats = {
        total: logs?.length || 0,
        processed: logs?.filter(l => l.processed).length || 0,
        failed: logs?.filter(l => !l.processed).length || 0,
        by_event_type: {} as Record<string, number>,
        last_event_at: logs?.[0]?.created_at || null
      };

      logs?.forEach(log => {
        const eventType = log.event_type || 'unknown';
        stats.by_event_type[eventType] = (stats.by_event_type[eventType] || 0) + 1;
      });

      return new Response(JSON.stringify({
        success: true,
        stats
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      error: 'Ação não reconhecida',
      actions_disponiveis: [
        'check-config',
        'list-logs', 
        'simulate-payment', 
        'check-subscriptions',
        'clear-old-logs',
        'stats'
      ]
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error in asaas-webhook-test:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
