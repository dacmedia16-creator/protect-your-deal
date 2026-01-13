import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to send WhatsApp notification
async function sendWhatsAppNotification(
  supabaseUrl: string,
  supabaseServiceKey: string,
  phone: string,
  message: string
): Promise<boolean> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        action: 'send-text',
        phone,
        message,
      }),
    });

    const result = await response.json();
    console.log('WhatsApp notification result:', result);
    return result.success === true;
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
    return false;
  }
}

// Helper function to format currency
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

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
      const { subscription: subscriptionId, status, externalReference, value } = payment;

      // Buscar assinatura pelo asaas_subscription_id - incluindo campos de afiliado
      const { data: assinatura, error: assinaturaError } = await supabase
        .from('assinaturas')
        .select('*, planos(nome), afiliado_id, cupom_id, comissao_percentual')
        .eq('asaas_subscription_id', subscriptionId)
        .maybeSingle();

      if (assinaturaError) {
        console.error('Error fetching assinatura:', assinaturaError);
      }

      if (assinatura) {
        let newStatus = assinatura.status;
        let updateData: Record<string, any> = { updated_at: new Date().toISOString() };
        let shouldNotify = false;
        let notificationType: 'confirmed' | 'overdue' | 'cancelled' | null = null;
        let shouldGenerateCommission = false;

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
            shouldNotify = true;
            notificationType = 'confirmed';
            // Gerar comissão recorrente para o afiliado
            shouldGenerateCommission = true;
            break;

          case 'PAYMENT_OVERDUE':
            // Pagamento vencido - assinatura pendente
            newStatus = 'pendente';
            updateData.status = newStatus;
            console.log(`Payment overdue for subscription ${subscriptionId}`);
            shouldNotify = true;
            notificationType = 'overdue';
            break;

          case 'PAYMENT_DELETED':
          case 'PAYMENT_REFUNDED':
          case 'PAYMENT_CHARGEBACK_REQUESTED':
            // Pagamento estornado/cancelado - suspender
            newStatus = 'suspensa';
            updateData.status = newStatus;
            console.log(`Payment cancelled/refunded for subscription ${subscriptionId}, suspending...`);
            shouldNotify = true;
            notificationType = 'cancelled';
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

        // Gerar comissão recorrente para o afiliado
        if (shouldGenerateCommission && assinatura.afiliado_id && assinatura.comissao_percentual > 0) {
          // Verificar configuração de limite de meses para comissão
          let shouldGenerateCommissionForAffiliate = true;

          try {
            // Verificar se o afiliado tem comissão ativa
            const { data: afiliadoData, error: afiliadoError } = await supabase
              .from('afiliados')
              .select('comissao_ativa')
              .eq('id', assinatura.afiliado_id)
              .single();

            if (afiliadoError) {
              console.error('Error fetching affiliate data:', afiliadoError);
            } else if (afiliadoData?.comissao_ativa === false) {
              console.log(`Commission disabled for affiliate ${assinatura.afiliado_id}, skipping commission`);
              shouldGenerateCommissionForAffiliate = false;
            }

            // Se comissão do afiliado está ativa, verificar limite de meses
            if (shouldGenerateCommissionForAffiliate) {
              const { data: limiteConfig } = await supabase
                .from('configuracoes_sistema')
                .select('chave, valor')
                .in('chave', ['limite_meses_comissao_ativo', 'limite_meses_comissao_valor']);
              
              const limiteAtivo = limiteConfig?.find(c => c.chave === 'limite_meses_comissao_ativo')?.valor === true || 
                                 limiteConfig?.find(c => c.chave === 'limite_meses_comissao_ativo')?.valor === 'true';
              const limiteMeses = Number(limiteConfig?.find(c => c.chave === 'limite_meses_comissao_valor')?.valor || 12);
              
              console.log(`Commission limit config - active: ${limiteAtivo}, months: ${limiteMeses}`);

              if (limiteAtivo) {
                // Contar quantas comissões já foram geradas para esta assinatura
                const { count, error: countError } = await supabase
                  .from('cupons_usos')
                  .select('id', { count: 'exact', head: true })
                  .eq('assinatura_id', assinatura.id);
                
                if (countError) {
                  console.error('Error counting commissions:', countError);
                } else {
                  console.log(`Commission count for subscription ${assinatura.id}: ${count}/${limiteMeses}`);
                  
                  if ((count || 0) >= limiteMeses) {
                    console.log(`Commission limit reached (${count}/${limiteMeses}) for subscription ${assinatura.id}, skipping commission`);
                    shouldGenerateCommissionForAffiliate = false;
                  }
                }
              }
            }
          } catch (configError) {
            console.error('Error checking commission config:', configError);
          }

          if (shouldGenerateCommissionForAffiliate) {
            const valorComissao = value * (Number(assinatura.comissao_percentual) / 100);
            console.log(`Generating recurring commission: ${valorComissao} for affiliate ${assinatura.afiliado_id}`);

            const { error: comissaoError } = await supabase.from('cupons_usos').insert({
              cupom_id: assinatura.cupom_id,
              assinatura_id: assinatura.id,
              imobiliaria_id: assinatura.imobiliaria_id,
              user_id: assinatura.user_id,
              valor_original: value,
              valor_desconto: 0, // Desconto só no primeiro pagamento
              valor_comissao: valorComissao,
              comissao_paga: false,
            });

            if (comissaoError) {
              console.error('Error creating recurring commission:', comissaoError);
            } else {
              console.log('Recurring commission created successfully');
            }
          }
        }

        // Send WhatsApp notification if needed
        if (shouldNotify && notificationType) {
          // Get user phone from profile
          let userPhone: string | null = null;
          let userName: string | null = null;

          if (assinatura.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('telefone, nome')
              .eq('user_id', assinatura.user_id)
              .single();

            userPhone = profile?.telefone;
            userName = profile?.nome;
          }

          // If no user phone, try imobiliaria
          if (!userPhone && assinatura.imobiliaria_id) {
            const { data: imobiliaria } = await supabase
              .from('imobiliarias')
              .select('telefone, nome')
              .eq('id', assinatura.imobiliaria_id)
              .single();

            userPhone = imobiliaria?.telefone;
            userName = imobiliaria?.nome;
          }

          if (userPhone) {
            const planoNome = (assinatura as any).planos?.nome || 'Plano';
            const valorFormatado = formatCurrency(value || 0);
            let message = '';

            switch (notificationType) {
              case 'confirmed':
                message = `✅ *Pagamento Confirmado!*\n\n` +
                  `Olá${userName ? `, ${userName.split(' ')[0]}` : ''}!\n\n` +
                  `Recebemos seu pagamento de ${valorFormatado} referente ao plano *${planoNome}*.\n\n` +
                  `Sua assinatura está ativa e você pode continuar usando todos os recursos do sistema.\n\n` +
                  `Obrigado por usar o Visita Segura! 🏠`;
                break;

              case 'overdue':
                message = `⚠️ *Pagamento Pendente*\n\n` +
                  `Olá${userName ? `, ${userName.split(' ')[0]}` : ''}!\n\n` +
                  `Identificamos que o pagamento de ${valorFormatado} do plano *${planoNome}* está vencido.\n\n` +
                  `Para evitar a suspensão dos serviços, regularize sua situação o mais breve possível.\n\n` +
                  `Se já efetuou o pagamento, por favor desconsidere esta mensagem.`;
                break;

              case 'cancelled':
                message = `❌ *Pagamento Cancelado*\n\n` +
                  `Olá${userName ? `, ${userName.split(' ')[0]}` : ''}!\n\n` +
                  `O pagamento de ${valorFormatado} do plano *${planoNome}* foi cancelado/estornado.\n\n` +
                  `Sua assinatura foi suspensa. Entre em contato conosco para mais informações.`;
                break;
            }

            if (message) {
              console.log(`Sending WhatsApp notification to ${userPhone} for event ${notificationType}`);
              const notificationSent = await sendWhatsAppNotification(
                supabaseUrl,
                supabaseServiceKey,
                userPhone,
                message
              );
              console.log(`WhatsApp notification sent: ${notificationSent}`);
            }
          } else {
            console.log('No phone found for notification, skipping WhatsApp');
          }
        }
      } else {
        // Tentar criar assinatura a partir do externalReference
        if (externalReference) {
          try {
            const ref = JSON.parse(externalReference);
            if (ref.planoId && (ref.userId || ref.imobiliariaId)) {
              console.log('Creating assinatura from webhook externalReference:', ref);
              
              const { data: newAssinatura, error: insertError } = await supabase
                .from('assinaturas')
                .insert({
                  plano_id: ref.planoId,
                  user_id: ref.userId || null,
                  imobiliaria_id: ref.imobiliariaId || null,
                  asaas_customer_id: payment.customer,
                  asaas_subscription_id: subscriptionId,
                  status: event === 'PAYMENT_RECEIVED' ? 'ativa' : 'pendente',
                  data_inicio: new Date().toISOString().split('T')[0],
                })
                .select('*, planos(nome)')
                .single();

              if (insertError) {
                console.error('Error creating assinatura from webhook:', insertError);
              } else {
                console.log('Assinatura created from webhook');

                // Send welcome notification for new subscription
                if (event === 'PAYMENT_RECEIVED' && newAssinatura) {
                  let userPhone: string | null = null;
                  let userName: string | null = null;

                  if (ref.userId) {
                    const { data: profile } = await supabase
                      .from('profiles')
                      .select('telefone, nome')
                      .eq('user_id', ref.userId)
                      .single();

                    userPhone = profile?.telefone;
                    userName = profile?.nome;
                  }

                  if (!userPhone && ref.imobiliariaId) {
                    const { data: imobiliaria } = await supabase
                      .from('imobiliarias')
                      .select('telefone, nome')
                      .eq('id', ref.imobiliariaId)
                      .single();

                    userPhone = imobiliaria?.telefone;
                    userName = imobiliaria?.nome;
                  }

                  if (userPhone) {
                    const planoNome = (newAssinatura as any).planos?.nome || 'Plano';
                    const valorFormatado = formatCurrency(value || 0);

                    const message = `🎉 *Bem-vindo ao Visita Segura!*\n\n` +
                      `Olá${userName ? `, ${userName.split(' ')[0]}` : ''}!\n\n` +
                      `Sua assinatura do plano *${planoNome}* foi ativada com sucesso!\n\n` +
                      `Valor: ${valorFormatado}\n\n` +
                      `Você já pode acessar todas as funcionalidades do sistema.\n\n` +
                      `Obrigado por escolher o Visita Segura! 🏠✨`;

                    console.log(`Sending welcome WhatsApp to ${userPhone}`);
                    await sendWhatsAppNotification(supabaseUrl, supabaseServiceKey, userPhone, message);
                  }
                }
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
        .select('*, planos(nome)')
        .eq('asaas_subscription_id', subscriptionId)
        .maybeSingle();

      if (assinatura) {
        let updateData: Record<string, any> = { updated_at: new Date().toISOString() };
        let shouldNotify = false;
        let notificationMessage = '';

        switch (event) {
          case 'SUBSCRIPTION_DELETED':
          case 'SUBSCRIPTION_EXPIRED':
            updateData.status = 'cancelada';
            updateData.data_fim = new Date().toISOString().split('T')[0];
            console.log(`Subscription ${subscriptionId} cancelled/expired`);
            shouldNotify = true;

            // Get user info for notification
            let userName = '';
            if (assinatura.user_id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('nome')
                .eq('user_id', assinatura.user_id)
                .single();
              userName = profile?.nome?.split(' ')[0] || '';
            }

            const planoNome = (assinatura as any).planos?.nome || 'Plano';
            notificationMessage = `📋 *Assinatura Encerrada*\n\n` +
              `Olá${userName ? `, ${userName}` : ''}!\n\n` +
              `Sua assinatura do plano *${planoNome}* foi encerrada.\n\n` +
              `Você pode reativar sua assinatura a qualquer momento pelo app.\n\n` +
              `Obrigado por usar o Visita Segura!`;
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

        // Send notification if needed
        if (shouldNotify && notificationMessage) {
          let userPhone: string | null = null;

          if (assinatura.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('telefone')
              .eq('user_id', assinatura.user_id)
              .single();
            userPhone = profile?.telefone;
          }

          if (!userPhone && assinatura.imobiliaria_id) {
            const { data: imobiliaria } = await supabase
              .from('imobiliarias')
              .select('telefone')
              .eq('id', assinatura.imobiliaria_id)
              .single();
            userPhone = imobiliaria?.telefone;
          }

          if (userPhone) {
            console.log(`Sending subscription event WhatsApp to ${userPhone}`);
            await sendWhatsAppNotification(supabaseUrl, supabaseServiceKey, userPhone, notificationMessage);
          }
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
