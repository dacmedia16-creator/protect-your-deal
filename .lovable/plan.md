

## Plano: Adicionar opções completas no dropdown de Construtoras

Atualmente o dropdown de construtoras só tem "Ver detalhes" e "Suspender/Ativar". O objetivo é equiparar com as opções de imobiliárias.

### Opções a adicionar

1. **Alterar Plano** — Dialog com select de planos, cria ou atualiza assinatura com `construtora_id`
2. **Desativar/Ativar Assinatura** — Toggle do status da assinatura (só aparece se tem assinatura)
3. **Excluir** — Deleta a construtora (com confirmação via toast ou inline)

A opção "Desabilitar Pesquisa" não se aplica a construtoras (feature flag é de imobiliárias).

### Alterações em `src/pages/admin/AdminConstrutoras.tsx`

**Novos estados e dados:**
- `planos` (fetch de planos ativos), `selectedPlanoId`, `isPlanoDialogOpen`, `construtoraToChangePlan`, `isChangingPlano`
- `isTogglingAssinatura` para controle de loading

**Novas funções:**
- `fetchPlanos()` — busca planos ativos
- `openPlanoDialog(c)` — abre dialog de alterar plano
- `handleChangePlano()` — atualiza ou insere assinatura com `construtora_id` (mesmo padrão de AdminImobiliarias mas com `construtora_id` em vez de `imobiliaria_id`)
- `toggleAssinatura(c)` — alterna status da assinatura por `construtora_id`
- `deleteConstrutora(id)` — deleta da tabela `construtoras`

**Enriquecer interface Construtora:** adicionar `assinatura_id`, `assinatura_plano_id`, `assinatura_plano_nome` (já tem `assinatura_status`)

**No fetchConstrutoras:** buscar também `assinatura.id`, `assinatura.plano_id` e plano nome

**Novos imports:** `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`, `Label`, `CreditCard`, `Ban`, `Trash2`

**Dropdown atualizado (desktop e mobile):**
- Ver detalhes
- Suspender/Ativar Construtora
- Alterar Plano
- Desativar/Ativar Assinatura (condicional)
- Excluir (vermelho)

**Dialog de alterar plano** — mesmo layout do AdminImobiliarias

