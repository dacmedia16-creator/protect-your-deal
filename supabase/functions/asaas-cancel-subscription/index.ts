import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ASAAS_API_URL = Deno.env.get('ASAAS_SANDBOX') === 'true' 
  ? 'https://sandbox.asaas.com/api/v3'
  : 'https://api.asaas.com/v3';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    if (!asaasApiKey) {
      throw new Error('ASAAS_API_KEY não configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { assinaturaId } = await req.json();

    if (!assinaturaId) {
      throw new Error('assinaturaId é obrigatório');
    }

    // Buscar assinatura
    const { data: assinatura, error: assinaturaError } = await supabase
      .from('assinaturas')
      .select('*')
      .eq('id', assinaturaId)
      .single();

    if (assinaturaError || !assinatura) {
      throw new Error('Assinatura não encontrada');
    }

    // Verificar se usuário tem permissão (dono ou admin da imobiliária)
    const isOwner = assinatura.user_id === user.id;
    let isAdmin = false;

    if (assinatura.imobiliaria_id) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('imobiliaria_id', assinatura.imobiliaria_id)
        .eq('role', 'imobiliaria_admin')
        .maybeSingle();
      
      isAdmin = !!roleData;
    }

    if (assinatura.construtora_id) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('construtora_id', assinatura.construtora_id)
        .eq('role', 'construtora_admin')
        .maybeSingle();
      
      if (roleData) isAdmin = true;
    }

    if (!isOwner && !isAdmin) {
      throw new Error('Sem permissão para cancelar esta assinatura');
    }

    if (!assinatura.asaas_subscription_id) {
      throw new Error('Assinatura não possui ID do Asaas');
    }

    // Cancelar assinatura no Asaas
    const cancelResponse = await fetch(
      `${ASAAS_API_URL}/subscriptions/${assinatura.asaas_subscription_id}`,
      {
        method: 'DELETE',
        headers: { 'access_token': asaasApiKey },
      }
    );

    if (!cancelResponse.ok) {
      const errorData = await cancelResponse.json();
      console.error('Asaas cancel error:', errorData);
      throw new Error(errorData.errors?.[0]?.description || 'Erro ao cancelar no Asaas');
    }

    // Atualizar status no banco
    await supabase
      .from('assinaturas')
      .update({
        status: 'cancelada',
        data_fim: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', assinaturaId);

    console.log(`Subscription ${assinatura.asaas_subscription_id} cancelled`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in asaas-cancel-subscription:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
