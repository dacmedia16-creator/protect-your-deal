
## Diagnóstico confirmado
O pagamento chegou ao backend e o webhook foi recebido, mas a ativação falha dentro de `supabase/functions/asaas-webhook/index.ts`.

Causa raiz:
- O webhook consulta `assinaturas` com `planos(nome)`
- A tabela `assinaturas` agora tem 2 relações com `planos`: `plano_id` e `plano_pendente_id`
- Isso gera o erro `PGRST201` visto nos logs
- Com esse erro, o webhook não consegue carregar a assinatura, não muda o status para `ativa` e ainda segue o fluxo sem liberar a conta

Ou seja: o problema não é o pagamento em si. O pagamento foi confirmado, mas a rotina de ativação quebrou no backend.

## Plano de correção
1. Corrigir os joins ambíguos no webhook
- Em `supabase/functions/asaas-webhook/index.ts`, trocar todos os `planos(nome)` por joins explícitos:
  - `plano:planos!assinaturas_plano_id_fkey(...)`
  - e, quando necessário, `plano_pendente:planos!assinaturas_plano_pendente_id_fkey(...)`
- Aplicar isso nos pontos de:
  - busca por `asaas_subscription_id`
  - fallback por `externalReference`
  - criação via webhook
  - eventos de assinatura

2. Fazer o webhook falhar de forma segura
- Se não conseguir localizar ou atualizar a assinatura, registrar `error_message` em `webhook_logs`
- Não marcar `processed = true` quando houver falha real
- Assim o erro fica rastreável e não parece “resolvido” quando não foi

3. Recuperar a cobrança que já foi paga
- Reaproveitar a lógica correta de ativação para reprocessar o payload já salvo
- Atualizar a assinatura pelo `externalReference`/`asaas_subscription_id`
- Aplicar `status = ativa`, `proxima_cobranca` e `plano_pendente_id` se existir
- Isso destrava a conta que já pagou e ficou pendente

4. Ajustar consistências do fluxo
- Em `supabase/functions/asaas-payment-link/index.ts`, corrigir o suporte a `construtoraId` no lookup/insert de `assinaturas`
- Em `src/hooks/useAssinaturaNotification.ts`, adicionar suporte a atualização em tempo real por `construtora_id`

## Arquivos envolvidos
- `supabase/functions/asaas-webhook/index.ts`
- `supabase/functions/asaas-payment-link/index.ts`
- `src/hooks/useAssinaturaNotification.ts`

## Detalhes técnicos
- Não precisa alterar schema para corrigir a causa principal
- A causa está no backend de cobrança, não na tela
- O bug apareceu porque o sistema passou a ter `plano_pendente_id`, criando uma segunda relação com `planos`

## Validação
- Fazer um novo pagamento de teste
- Confirmar que o erro `PGRST201` desapareceu dos logs
- Confirmar que `assinaturas.status` vira `ativa`
- Confirmar que a conta é liberada automaticamente
- Reprocessar o pagamento já confirmado para liberar a conta afetada
