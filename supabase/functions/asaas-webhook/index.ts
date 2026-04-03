import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
    const asaasWebhookToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN');

    // ========================================
    // VALIDAÇÃO DE SEGURANÇA DO WEBHOOK (OBRIGATÓRIA)
    // ========================================
    // A Asaas envia o token de autenticação no header 'asaas-access-token'
    // Este token deve ser configurado no painel da Asaas em Integrações > Webhooks

    if (!asaasWebhookToken) {
      // Token não configurado no servidor - bloquear por segurança
      console.error('CRITICAL: ASAAS_WEBHOOK_TOKEN not configured. Rejecting all webhook requests.');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const receivedToken = req.headers.get('asaas-access-token');

    if (!receivedToken) {
      console.error('Webhook rejected: Missing asaas-access-token header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Comparação segura usando timing-safe comparison para prevenir timing attacks
    const encoder = new TextEncoder();
    const expectedBuffer = encoder.encode(asaasWebhookToken);
    const receivedBuffer = encoder.encode(receivedToken);

    // Verificar tamanho primeiro (se diferentes, já rejeitar)
    if (expectedBuffer.length !== receivedBuffer.length) {
      console.error('Webhook rejected: Invalid asaas-access-token (length mismatch)');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Comparação timing-safe
    let isValid = true;
    for (let i = 0; i < expectedBuffer.length; i++) {
      if (expectedBuffer[i] !== receivedBuffer[i]) {
        isValid = false;
      }
    }

    if (!isValid) {
      console.error('Webhook rejected: Invalid asaas-access-token');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Webhook authentication successful');

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

      // Buscar assinatura pelo asaas_subscription_id - incluindo campos de afiliado e plano pendente
      let assinatura: any = null;
      let assinaturaError: any = null;

      if (subscriptionId) {
        const result = await supabase
          .from('assinaturas')
          .select('*, plano:planos!assinaturas_plano_id_fkey(nome), afiliado_id, cupom_id, comissao_percentual, plano_pendente_id, ciclo')
          .eq('asaas_subscription_id', subscriptionId)
          .maybeSingle();
        assinatura = result.data;
        assinaturaError = result.error;
      }

      // Fallback: buscar pelo externalReference como UUID direto (Payment Link flow)
      if (!assinatura && externalReference) {
        console.log('Subscription not found by asaas_subscription_id, trying externalReference as UUID:', externalReference);
        const { data: fallbackAssinatura, error: fallbackError } = await supabase
          .from('assinaturas')
          .select('*, plano:planos!assinaturas_plano_id_fkey(nome), afiliado_id, cupom_id, comissao_percentual, plano_pendente_id, ciclo')
          .eq('id', externalReference)
          .maybeSingle();

        if (fallbackError) {
          console.error('Error in fallback lookup by externalReference:', fallbackError);
        } else if (fallbackAssinatura) {
          assinatura = fallbackAssinatura;
          console.log('Found subscription via externalReference fallback:', assinatura.id);

          // Salvar o asaas_subscription_id para futuras cobranças recorrentes
          if (subscriptionId) {
            const { error: linkError } = await supabase
              .from('assinaturas')
              .update({ asaas_subscription_id: subscriptionId, updated_at: new Date().toISOString() })
              .eq('id', assinatura.id);

            if (linkError) {
              console.error('Error linking asaas_subscription_id:', linkError);
            } else {
              console.log(`Linked asaas_subscription_id ${subscriptionId} to subscription ${assinatura.id}`);
            }
          }
        }
      }

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
            
            // Se há um plano pendente (upgrade/downgrade), aplicar agora
            if ((assinatura as any).plano_pendente_id) {
              updateData.plano_id = (assinatura as any).plano_pendente_id;
              updateData.plano_pendente_id = null; // Limpar plano pendente
              console.log(`Applying pending plan ${(assinatura as any).plano_pendente_id} for subscription ${subscriptionId}`);
            }
            
            // Atualizar próxima cobrança baseada no ciclo
            const nextPayment = new Date();
            const isAnualCiclo = (assinatura as any).ciclo === 'anual';
            nextPayment.setDate(nextPayment.getDate() + (isAnualCiclo ? 365 : 30));
            updateData.proxima_cobranca = nextPayment.toISOString().split('T')[0];
            console.log(`Payment confirmed for subscription ${subscriptionId}, activating...`);
            shouldNotify = true;
            notificationType = 'confirmed';
            // Gerar comissão recorrente para o afiliado
            shouldGenerateCommission = true;

            // === REFERRAL COMMISSION (one-time) ===
            // Check if this subscription has a referral (indicação) pending commission
            try {
              // Find referral by indicado_user_id or indicado_imobiliaria_id
              const indicadoUserId = assinatura.user_id;
              const indicadoImobId = assinatura.imobiliaria_id;
              
              let indicacaoQuery = supabase
                .from('indicacoes_corretor')
                .select('*')
                .eq('status', 'cadastrado');

              // Try user_id first, then imobiliaria_id
              if (indicadoUserId) {
                const { data: indByUser } = await supabase
                  .from('indicacoes_corretor')
                  .select('*')
                  .eq('indicado_user_id', indicadoUserId)
                  .eq('status', 'cadastrado')
                  .maybeSingle();

                if (indByUser) {
                  let valorComissao: number;
                  if (indByUser.tipo_comissao_indicacao === 'primeira_mensalidade') {
                    // Use valor_mensal from the plan, not the payment value (could be annual)
                    const { data: plano } = await supabase
                      .from('planos')
                      .select('valor_mensal')
                      .eq('id', assinatura.plano_id)
                      .maybeSingle();
                    valorComissao = plano?.valor_mensal ?? value;
                  } else {
                    valorComissao = value * (Number(indByUser.comissao_percentual) / 100);
                  }
                  console.log(`Generating referral commission (${indByUser.tipo_comissao_indicacao}): ${valorComissao} for user ${indByUser.indicador_user_id}`);
                  
                  await supabase
                    .from('indicacoes_corretor')
                    .update({
                      status: 'comissao_gerada',
                      valor_comissao: valorComissao,
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', indByUser.id);
                  
                  console.log('Referral commission generated successfully');
                }
              }

              if (indicadoImobId) {
                const { data: indByImob } = await supabase
                  .from('indicacoes_corretor')
                  .select('*')
                  .eq('indicado_imobiliaria_id', indicadoImobId)
                  .eq('status', 'cadastrado')
                  .maybeSingle();

                if (indByImob) {
                  let valorComissao: number;
                  if (indByImob.tipo_comissao_indicacao === 'primeira_mensalidade') {
                    const { data: plano } = await supabase
                      .from('planos')
                      .select('valor_mensal')
                      .eq('id', assinatura.plano_id)
                      .maybeSingle();
                    valorComissao = plano?.valor_mensal ?? value;
                  } else {
                    valorComissao = value * (Number(indByImob.comissao_percentual) / 100);
                  }
                  console.log(`Generating referral commission for imobiliaria (${indByImob.tipo_comissao_indicacao}): ${valorComissao}`);
                  
                  await supabase
                    .from('indicacoes_corretor')
                    .update({
                      status: 'comissao_gerada',
                      valor_comissao: valorComissao,
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', indByImob.id);
                  
                  console.log('Referral commission for imobiliaria generated successfully');
                }
              }
            } catch (refErr) {
              console.error('Error processing referral commission:', refErr);
            }
            // === END REFERRAL COMMISSION ===
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
            // Buscar configurações de comissão multinível
            let comissaoDiretaPerc = Number(assinatura.comissao_percentual);
            let comissaoIndiretaPerc = 0;

            try {
              const { data: comissaoConfigs } = await supabase
                .from('configuracoes_sistema')
                .select('chave, valor')
                .in('chave', ['comissao_direta_percentual', 'comissao_indireta_percentual']);

              if (comissaoConfigs) {
                const diretaConfig = comissaoConfigs.find(c => c.chave === 'comissao_direta_percentual');
                const indiretaConfig = comissaoConfigs.find(c => c.chave === 'comissao_indireta_percentual');
                if (diretaConfig) comissaoDiretaPerc = Number(diretaConfig.valor) || comissaoDiretaPerc;
                if (indiretaConfig) comissaoIndiretaPerc = Number(indiretaConfig.valor) || 0;
              }
            } catch (configErr) {
              console.error('Error fetching commission config:', configErr);
            }

            const valorComissaoDireta = value * (comissaoDiretaPerc / 100);
            console.log(`Generating direct commission: ${valorComissaoDireta} for affiliate ${assinatura.afiliado_id}`);

            // Buscar dados do afiliado (para verificar indicado_por)
            const { data: afiliadoInfo } = await supabase
              .from('afiliados')
              .select('id, indicado_por')
              .eq('id', assinatura.afiliado_id)
              .single();

            // Inserir comissão direta
            const { error: comissaoError } = await supabase.from('cupons_usos').insert({
              cupom_id: assinatura.cupom_id,
              assinatura_id: assinatura.id,
              imobiliaria_id: assinatura.imobiliaria_id,
              user_id: assinatura.user_id,
              valor_original: value,
              valor_desconto: 0,
              valor_comissao: valorComissaoDireta,
              comissao_paga: false,
              tipo_comissao: 'direta',
              afiliado_id: assinatura.afiliado_id,
            });

            if (comissaoError) {
              console.error('Error creating direct commission:', comissaoError);
            } else {
              console.log('Direct commission created successfully');
            }

            // Gerar comissão indireta se o afiliado foi indicado por outro
            if (afiliadoInfo?.indicado_por && comissaoIndiretaPerc > 0) {
              // Verificar se o afiliado pai tem comissão ativa
              const { data: afiliadoPai } = await supabase
                .from('afiliados')
                .select('id, comissao_ativa')
                .eq('id', afiliadoInfo.indicado_por)
                .single();

              if (afiliadoPai?.comissao_ativa !== false) {
                const valorComissaoIndireta = value * (comissaoIndiretaPerc / 100);
                console.log(`Generating indirect commission: ${valorComissaoIndireta} for parent affiliate ${afiliadoInfo.indicado_por}`);

                const { error: indirectError } = await supabase.from('cupons_usos').insert({
                  cupom_id: assinatura.cupom_id,
                  assinatura_id: assinatura.id,
                  imobiliaria_id: assinatura.imobiliaria_id,
                  user_id: assinatura.user_id,
                  valor_original: value,
                  valor_desconto: 0,
                  valor_comissao: valorComissaoIndireta,
                  comissao_paga: false,
                  tipo_comissao: 'indireta',
                  afiliado_id: afiliadoInfo.indicado_por,
                });

                if (indirectError) {
                  console.error('Error creating indirect commission:', indirectError);
                } else {
                  console.log('Indirect commission created successfully');
                }
              }
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
            const planoNome = (assinatura as any).plano?.nome || 'Plano';
            const valorFormatado = formatCurrency(value || 0);
            let message = '';

            switch (notificationType) {
              case 'confirmed':
                message = `✅ *Pagamento Confirmado!*\n\n` +
                  `Olá${userName ? `, ${userName.split(' ')[0]}` : ''}!\n\n` +
                  `Recebemos seu pagamento de ${valorFormatado} referente ao plano *${planoNome}*.\n\n` +
                  `Sua assinatura está ativa e você pode continuar usando todos os recursos do sistema.\n\n` +
                  `Obrigado por usar o VisitaProva! 🏠`;
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
                .select('*, plano:planos!assinaturas_plano_id_fkey(nome)')
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
                    const planoNome = (newAssinatura as any).plano?.nome || 'Plano';
                    const valorFormatado = formatCurrency(value || 0);

                    const message = `🎉 *Bem-vindo ao VisitaProva!*\n\n` +
                      `Olá${userName ? `, ${userName.split(' ')[0]}` : ''}!\n\n` +
                      `Sua assinatura do plano *${planoNome}* foi ativada com sucesso!\n\n` +
                      `Valor: ${valorFormatado}\n\n` +
                      `Você já pode acessar todas as funcionalidades do sistema.\n\n` +
                      `Obrigado por escolher o VisitaProva! 🏠✨`;

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
              `Obrigado por usar o VisitaProva!`;
            break;

          case 'SUBSCRIPTION_RENEWED':
            updateData.status = 'ativa';
            const nextRenewal = new Date();
            const isAnualRenewal = (assinatura as any).ciclo === 'anual';
            nextRenewal.setDate(nextRenewal.getDate() + (isAnualRenewal ? 365 : 30));
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
