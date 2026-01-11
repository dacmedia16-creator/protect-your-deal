import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const webhookData = await req.json();
    console.log('Asaas webhook received:', JSON.stringify(webhookData));

    // Log webhook event to database for traceability
    let logId: string | null = null;
    try {
      const { data: logData, error: logError } = await supabase
        .from('webhook_logs')
        .insert({
          source: 'asaas',
          event_type: webhookData.event || 'unknown',
          payload: webhookData,
          processed: false
        })
        .select('id')
        .single();

      if (logError) {
        console.error('Error logging webhook:', logError);
      } else {
        logId = logData?.id;
        console.log('Webhook logged with id:', logId);
      }
    } catch (logErr) {
      console.error('Failed to log webhook:', logErr);
    }

    const { event, payment, subscription } = webhookData;

    // Processar eventos de pagamento
    if (payment) {
      const { subscription: subscriptionId, status, externalReference } = payment;

      // Buscar assinatura pelo asaas_subscription_id
      const { data: assinatura, error: assinaturaError } = await supabase
        .from('assinaturas')
        .select('*')
        .eq('asaas_subscription_id', subscriptionId)
        .maybeSingle();

      if (assinaturaError) {
        console.error('Error fetching assinatura:', assinaturaError);
      }

      if (assinatura) {
        let newStatus = assinatura.status;
        let updateData: Record<string, any> = { updated_at: new Date().toISOString() };

        switch (event) {
          case 'PAYMENT_RECEIVED':
          case 'PAYMENT_CONFIRMED':
            // Pagamento confirmado - ativar assinatura
            newStatus = 'ativa';
            updateData.status = newStatus;
            // Atualizar próxima cobrança (30 dias)
            const nextPayment = new Date();
            nextPayment.setDate(nextPayment.getDate() + 30);
            updateData.proxima_cobranca = nextPayment.toISOString().split('T')[0];
            console.log(`Payment confirmed for subscription ${subscriptionId}, activating...`);
            break;

          case 'PAYMENT_OVERDUE':
            // Pagamento vencido - assinatura pendente
            newStatus = 'pendente';
            updateData.status = newStatus;
            console.log(`Payment overdue for subscription ${subscriptionId}`);
            break;

          case 'PAYMENT_DELETED':
          case 'PAYMENT_REFUNDED':
          case 'PAYMENT_CHARGEBACK_REQUESTED':
            // Pagamento estornado/cancelado - suspender
            newStatus = 'suspensa';
            updateData.status = newStatus;
            console.log(`Payment cancelled/refunded for subscription ${subscriptionId}, suspending...`);
            break;

          default:
            console.log(`Unhandled payment event: ${event}`);
        }

        if (updateData.status) {
          const { error: updateError } = await supabase
            .from('assinaturas')
            .update(updateData)
            .eq('id', assinatura.id);

          if (updateError) {
            console.error('Error updating assinatura:', updateError);
          } else {
            console.log(`Assinatura ${assinatura.id} updated to status: ${newStatus}`);
          }
        }
      } else {
        // Tentar criar assinatura a partir do externalReference
        if (externalReference) {
          try {
            const ref = JSON.parse(externalReference);
            if (ref.planoId && (ref.userId || ref.imobiliariaId)) {
              console.log('Creating assinatura from webhook externalReference:', ref);
              
              const { error: insertError } = await supabase
                .from('assinaturas')
                .insert({
                  plano_id: ref.planoId,
                  user_id: ref.userId || null,
                  imobiliaria_id: ref.imobiliariaId || null,
                  asaas_customer_id: payment.customer,
                  asaas_subscription_id: subscriptionId,
                  status: event === 'PAYMENT_RECEIVED' ? 'ativa' : 'pendente',
                  data_inicio: new Date().toISOString().split('T')[0],
                });

              if (insertError) {
                console.error('Error creating assinatura from webhook:', insertError);
              } else {
                console.log('Assinatura created from webhook');
              }
            }
          } catch (parseError) {
            console.log('Could not parse externalReference:', externalReference);
          }
        }
      }
    }

    // Processar eventos de assinatura
    if (subscription && event) {
      const { id: subscriptionId, status: subscriptionStatus } = subscription;

      const { data: assinatura } = await supabase
        .from('assinaturas')
        .select('*')
        .eq('asaas_subscription_id', subscriptionId)
        .maybeSingle();

      if (assinatura) {
        let updateData: Record<string, any> = { updated_at: new Date().toISOString() };

        switch (event) {
          case 'SUBSCRIPTION_DELETED':
          case 'SUBSCRIPTION_EXPIRED':
            updateData.status = 'cancelada';
            updateData.data_fim = new Date().toISOString().split('T')[0];
            console.log(`Subscription ${subscriptionId} cancelled/expired`);
            break;

          case 'SUBSCRIPTION_RENEWED':
            updateData.status = 'ativa';
            const nextRenewal = new Date();
            nextRenewal.setDate(nextRenewal.getDate() + 30);
            updateData.proxima_cobranca = nextRenewal.toISOString().split('T')[0];
            console.log(`Subscription ${subscriptionId} renewed`);
            break;

          default:
            console.log(`Unhandled subscription event: ${event}`);
        }

        if (Object.keys(updateData).length > 1) {
          await supabase
            .from('assinaturas')
            .update(updateData)
            .eq('id', assinatura.id);
        }
      }
    }

    // Mark webhook as processed
    if (logId) {
      await supabase
        .from('webhook_logs')
        .update({ processed: true })
        .eq('id', logId);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in asaas-webhook:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
