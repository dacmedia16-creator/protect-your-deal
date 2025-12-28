import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { 
      planoId, 
      customerId, 
      billingType = 'UNDEFINED', // BOLETO, CREDIT_CARD, PIX, UNDEFINED (cliente escolhe)
      imobiliariaId 
    } = await req.json();

    if (!planoId || !customerId) {
      throw new Error('planoId e customerId são obrigatórios');
    }

    // Buscar dados do plano
    const { data: plano, error: planoError } = await supabase
      .from('planos')
      .select('*')
      .eq('id', planoId)
      .single();

    if (planoError || !plano) {
      throw new Error('Plano não encontrado');
    }

    // Calcular próxima data de vencimento
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 1); // Vence amanhã

    // Criar assinatura no Asaas
    const subscriptionResponse = await fetch(`${ASAAS_API_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      },
      body: JSON.stringify({
        customer: customerId,
        billingType,
        value: plano.valor_mensal,
        nextDueDate: nextDueDate.toISOString().split('T')[0],
        cycle: 'MONTHLY',
        description: `Assinatura ${plano.nome} - Visita Segura`,
        externalReference: imobiliariaId || user.id,
      }),
    });

    const subscriptionData = await subscriptionResponse.json();

    if (!subscriptionResponse.ok) {
      console.error('Asaas subscription error:', subscriptionData);
      throw new Error(subscriptionData.errors?.[0]?.description || 'Erro ao criar assinatura no Asaas');
    }

    console.log('Subscription created:', subscriptionData.id);

    // Verificar se já existe assinatura no banco
    const assinaturaQuery = imobiliariaId 
      ? { imobiliaria_id: imobiliariaId }
      : { user_id: user.id };

    const { data: existingAssinatura } = await supabase
      .from('assinaturas')
      .select('id')
      .match(assinaturaQuery)
      .maybeSingle();

    if (existingAssinatura) {
      // Atualizar assinatura existente
      await supabase
        .from('assinaturas')
        .update({
          plano_id: planoId,
          asaas_customer_id: customerId,
          asaas_subscription_id: subscriptionData.id,
          status: 'pendente',
          data_inicio: new Date().toISOString().split('T')[0],
          proxima_cobranca: nextDueDate.toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAssinatura.id);
    } else {
      // Criar nova assinatura
      await supabase
        .from('assinaturas')
        .insert({
          plano_id: planoId,
          user_id: imobiliariaId ? null : user.id,
          imobiliaria_id: imobiliariaId || null,
          asaas_customer_id: customerId,
          asaas_subscription_id: subscriptionData.id,
          status: 'pendente',
          data_inicio: new Date().toISOString().split('T')[0],
          proxima_cobranca: nextDueDate.toISOString().split('T')[0],
        });
    }

    // Buscar link de pagamento da primeira cobrança
    const paymentsResponse = await fetch(
      `${ASAAS_API_URL}/payments?subscription=${subscriptionData.id}`,
      {
        headers: { 'access_token': asaasApiKey },
      }
    );

    const paymentsData = await paymentsResponse.json();
    const firstPayment = paymentsData.data?.[0];

    return new Response(
      JSON.stringify({ 
        success: true,
        subscriptionId: subscriptionData.id,
        paymentId: firstPayment?.id,
        paymentUrl: firstPayment?.invoiceUrl,
        bankSlipUrl: firstPayment?.bankSlipUrl,
        pixQrCode: firstPayment?.pixQrCode,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in asaas-create-subscription:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
