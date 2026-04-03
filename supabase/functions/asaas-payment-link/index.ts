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

    const { planoId, imobiliariaId, construtoraId, ciclo = 'mensal', billingType = 'UNDEFINED' } = await req.json();

    if (!planoId) {
      throw new Error('planoId é obrigatório');
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

    // Criar ou atualizar registro de assinatura pendente
    const assinaturaQuery = imobiliariaId 
      ? { imobiliaria_id: imobiliariaId }
      : construtoraId
        ? { construtora_id: construtoraId }
        : { user_id: user.id };

    let assinaturaId: string;

    // Verificar se já existe assinatura
    const { data: existingAssinatura } = await supabase
      .from('assinaturas')
      .select('id')
      .match(assinaturaQuery)
      .maybeSingle();

    if (existingAssinatura) {
      // Apenas registrar qual plano o usuário deseja - NÃO muda o plano atual
      // O plano só será alterado quando o pagamento for confirmado via webhook
      const { error: updateError } = await supabase
        .from('assinaturas')
        .update({
          plano_pendente_id: planoId, // Armazena o plano desejado
          ciclo: ciclo, // Armazena o ciclo desejado
          updated_at: new Date().toISOString(),
          // NÃO ATUALIZAR: plano_id (mantém plano atual)
          // NÃO ATUALIZAR: status (mantém status atual)
        })
        .eq('id', existingAssinatura.id);

      if (updateError) {
        console.error('Error updating pending plan:', updateError);
        throw new Error('Erro ao registrar plano pendente');
      }

      assinaturaId = existingAssinatura.id;
      console.log('Pending plan registered:', planoId, 'ciclo:', ciclo, 'for subscription:', assinaturaId);
    } else {
      // Criar nova assinatura
      const { data: newAssinatura, error: insertError } = await supabase
        .from('assinaturas')
        .insert({
          plano_id: planoId,
          user_id: imobiliariaId || construtoraId ? null : user.id,
          imobiliaria_id: imobiliariaId || null,
          construtora_id: construtoraId || null,
          status: 'pendente',
          ciclo: ciclo,
          data_inicio: new Date().toISOString().split('T')[0],
        })
        .select('id')
        .single();

      if (insertError || !newAssinatura) {
        console.error('Error creating subscription:', insertError);
        throw new Error('Erro ao criar registro de assinatura');
      }

      assinaturaId = newAssinatura.id;
      console.log('Created new subscription:', assinaturaId, 'ciclo:', ciclo);
    }


    // Calcular data de expiração (7 dias)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    // Determinar valor e ciclo
    const isAnual = ciclo === 'anual';
    const valor = isAnual && plano.valor_anual ? plano.valor_anual : plano.valor_mensal;
    const subscriptionCycle = isAnual ? 'YEARLY' : 'MONTHLY';
    const cicloLabel = isAnual ? 'anual' : 'mensal';

    // Criar link de pagamento no Asaas usando apenas o ID da assinatura (36 chars)
    const paymentLinkResponse = await fetch(`${ASAAS_API_URL}/paymentLinks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      },
      body: JSON.stringify({
        name: `Assinatura ${plano.nome} (${cicloLabel})`,
        description: `Plano ${plano.nome} - VisitaProva. Assinatura ${cicloLabel} com renovação automática.`,
        endDate: expirationDate.toISOString().split('T')[0],
        value: valor,
        billingType: ['PIX', 'BOLETO', 'CREDIT_CARD'].includes(billingType) ? billingType : 'UNDEFINED',
        chargeType: 'RECURRENT',
        subscriptionCycle,
        dueDateLimitDays: 3,
        notificationEnabled: true,
        externalReference: assinaturaId,
      }),
    });

    const paymentLinkData = await paymentLinkResponse.json();

    if (!paymentLinkResponse.ok) {
      console.error('Asaas payment link error:', paymentLinkData);
      throw new Error(paymentLinkData.errors?.[0]?.description || 'Erro ao criar link de pagamento');
    }

    console.log('Payment link created:', paymentLinkData.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        paymentLinkId: paymentLinkData.id,
        paymentLinkUrl: paymentLinkData.url,
        assinaturaId: assinaturaId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in asaas-payment-link:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
