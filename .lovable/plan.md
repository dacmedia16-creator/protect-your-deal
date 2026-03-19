

## Sistema de Afiliados Multinível (2 níveis)

### Conceito
Hoje cada afiliado é independente. A proposta é adicionar um **nível de referência**: um afiliado pode ter sido indicado por outro afiliado (seu "pai"). Quando um pagamento confirma:

- **Comissão direta** (nível 1): o afiliado cujo cupom foi usado recebe X%
- **Comissão indireta** (nível 2): se esse afiliado foi indicado por outro, o "pai" recebe Y%

Exemplo: Alexandre indica Maria. Maria fecha um cliente com seu cupom.
→ Maria ganha X% (direto), Alexandre ganha Y% (indireto).

### Mudanças necessárias

#### 1. Banco de dados

**Tabela `afiliados`** — adicionar coluna:
```sql
ALTER TABLE afiliados ADD COLUMN indicado_por uuid REFERENCES afiliados(id);
```

**Tabela `configuracoes_sistema`** — inserir configurações globais:
- `comissao_direta_percentual` (ex: 10)
- `comissao_indireta_percentual` (ex: 5)

**Tabela `cupons_usos`** — adicionar coluna para distinguir tipo:
```sql
ALTER TABLE cupons_usos ADD COLUMN tipo_comissao text DEFAULT 'direta';
ALTER TABLE cupons_usos ADD COLUMN afiliado_id uuid REFERENCES afiliados(id);
```

Isso permite registrar 2 linhas por pagamento: uma "direta" para Maria, uma "indireta" para Alexandre.

#### 2. Webhook de pagamento (asaas-webhook)

Ao gerar comissão recorrente, além da comissão direta já existente:
- Verificar se o afiliado tem `indicado_por`
- Se sim, criar uma segunda `cupons_usos` com `tipo_comissao = 'indireta'` e o percentual configurado

#### 3. Admin — Gestão de afiliados

Na página `AdminAfiliados`:
- Adicionar campo "Indicado por" (select de afiliados existentes) no form de criar/editar
- Mostrar coluna "Indicado por" na tabela

Na página `AdminComissoes`:
- Filtro por tipo (direta/indireta)
- Badge visual distinguindo tipo

#### 4. Painel do Afiliado

No `AfiliadoDashboard` e `AfiliadoComissoes`:
- Mostrar comissões diretas e indiretas separadamente
- Card "Rede" mostrando quantos afiliados o usuário indicou
- Listagem dos afiliados indicados e seus resultados

#### 5. Admin Configurações

Em `AdminConfiguracoes`:
- Inputs para definir % comissão direta e % comissão indireta globalmente

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | `afiliados.indicado_por`, `cupons_usos.tipo_comissao`, `cupons_usos.afiliado_id`, configs |
| `asaas-webhook/index.ts` | Gerar comissão indireta |
| `registro-imobiliaria/index.ts` | Passar afiliado na comissão inicial |
| `registro-corretor-autonomo/index.ts` | Idem |
| `AdminAfiliados.tsx` | Campo "Indicado por" |
| `AdminComissoes.tsx` | Filtro/badge tipo comissão |
| `AfiliadoDashboard.tsx` | Cards rede + comissões indiretas |
| `AfiliadoComissoes.tsx` | Separar diretas/indiretas |
| `AdminConfiguracoes.tsx` | Inputs % direta/indireta |

