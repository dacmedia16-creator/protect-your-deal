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

    const { moduloId, imobiliariaId, userId } = await req.json();

    if (!moduloId) {
      throw new Error('moduloId é obrigatório');
    }

    // Buscar dados do módulo
    const { data: modulo, error: moduloError } = await supabase
      .from('modulos')
      .select('*')
      .eq('id', moduloId)
      .eq('ativo', true)
      .single();

    if (moduloError || !modulo) {
      console.error('Erro ao buscar módulo:', moduloError);
      throw new Error('Módulo não encontrado ou inativo');
    }

    console.log('Módulo encontrado:', modulo.nome, 'Valor:', modulo.valor_mensal);

    // Verificar se já existe contratação ativa
    const existingQuery = supabase
      .from('modulos_contratados')
      .select('id, status')
      .eq('modulo_id', moduloId);

    if (imobiliariaId) {
      existingQuery.eq('imobiliaria_id', imobiliariaId);
    } else if (userId) {
      existingQuery.eq('user_id', userId);
    } else {
      existingQuery.eq('user_id', user.id);
    }

    const { data: existingContratacao } = await existingQuery.maybeSingle();

    if (existingContratacao && existingContratacao.status === 'ativo') {
      throw new Error('Módulo já está contratado e ativo');
    }

    // Criar ou atualizar registro de contratação
    let contratacaoId: string;

    if (existingContratacao) {
      // Atualizar contratação existente para pendente
      const { error: updateError } = await supabase
        .from('modulos_contratados')
        .update({
          status: 'pendente',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingContratacao.id);

      if (updateError) {
        console.error('Erro ao atualizar contratação:', updateError);
        throw new Error('Erro ao atualizar contratação');
      }

      contratacaoId = existingContratacao.id;
      console.log('Contratação existente atualizada:', contratacaoId);
    } else {
      // Criar nova contratação
      const { data: newContratacao, error: insertError } = await supabase
        .from('modulos_contratados')
        .insert({
          modulo_id: moduloId,
          imobiliaria_id: imobiliariaId || null,
          user_id: imobiliariaId ? null : (userId || user.id),
          status: 'pendente',
          data_inicio: new Date().toISOString().split('T')[0],
        })
        .select('id')
        .single();

      if (insertError || !newContratacao) {
        console.error('Erro ao criar contratação:', insertError);
        throw new Error('Erro ao criar registro de contratação');
      }

      contratacaoId = newContratacao.id;
      console.log('Nova contratação criada:', contratacaoId);
    }

    // Calcular data de expiração do link (7 dias)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    // Criar link de pagamento no Asaas
    const paymentLinkResponse = await fetch(`${ASAAS_API_URL}/paymentLinks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      },
      body: JSON.stringify({
        name: `Módulo ${modulo.nome}`,
        description: `Módulo ${modulo.nome} - Visita Segura. Adiciona funcionalidades premium ao seu plano.`,
        endDate: expirationDate.toISOString().split('T')[0],
        value: Number(modulo.valor_mensal),
        billingType: 'UNDEFINED',
        chargeType: 'RECURRENT',
        subscriptionCycle: 'MONTHLY',
        dueDateLimitDays: 3,
        notificationEnabled: true,
        externalReference: `modulo_${contratacaoId}`,
      }),
    });

    const paymentLinkData = await paymentLinkResponse.json();

    if (!paymentLinkResponse.ok) {
      console.error('Erro Asaas ao criar link:', paymentLinkData);
      throw new Error(paymentLinkData.errors?.[0]?.description || 'Erro ao criar link de pagamento');
    }

    console.log('Link de pagamento criado:', paymentLinkData.id);

    // Atualizar contratação com ID do Asaas
    await supabase
      .from('modulos_contratados')
      .update({
        asaas_subscription_id: paymentLinkData.id,
      })
      .eq('id', contratacaoId);

    return new Response(
      JSON.stringify({
        success: true,
        paymentLinkId: paymentLinkData.id,
        paymentLinkUrl: paymentLinkData.url,
        contratacaoId: contratacaoId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Erro em asaas-modulo-subscription:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
