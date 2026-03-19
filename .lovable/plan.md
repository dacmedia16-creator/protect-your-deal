

## Plano: Sistema de Indicação de Corretores (Referral)

### Contexto
Criar um sistema separado do de afiliados onde qualquer corretor pode gerar um link único para indicar novos corretores e imobiliárias. Ao primeiro pagamento do indicado, o corretor indicador recebe uma comissão única (%).

### Arquitetura

```text
corretor → gera link → indicado se cadastra → faz 1º pagamento → comissão registrada
```

### Mudanças no banco de dados

**Nova tabela `indicacoes_corretor`:**
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| indicador_user_id | uuid NOT NULL | Corretor que indicou |
| indicado_user_id | uuid | Usuário que se cadastrou |
| indicado_imobiliaria_id | uuid | Imobiliária que se cadastrou |
| tipo_indicado | text | 'corretor' ou 'imobiliaria' |
| codigo | text UNIQUE | Código único do link (ex: IND-ABC123) |
| comissao_percentual | numeric | % sobre o primeiro pagamento |
| valor_comissao | numeric | Valor calculado da comissão |
| comissao_paga | boolean | Se já foi paga |
| comissao_paga_em | timestamptz | Data do pagamento |
| status | text | 'pendente', 'cadastrado', 'pago', 'comissao_gerada' |
| created_at | timestamptz | |

**Nova tabela `indicacoes_config`** (ou usar `configuracoes_sistema`):
- Percentual padrão de comissão para indicações de corretores
- Percentual padrão para indicações de imobiliárias

**RLS:**
- Corretor vê apenas suas próprias indicações
- Super admin vê todas

### Mudanças no backend (Edge Functions)

1. **`gerar-codigo-indicacao`** — Gera/retorna o código único do corretor (cria na primeira chamada, retorna existente nas próximas)
2. **Alterar `registro-corretor-autonomo`** — Aceitar param `codigo_indicacao`, vincular na tabela `indicacoes_corretor`
3. **Alterar `registro-imobiliaria`** — Aceitar param `codigo_indicacao`, vincular na tabela
4. **Alterar `asaas-webhook`** — No primeiro pagamento confirmado, calcular e registrar comissão na `indicacoes_corretor`

### Mudanças no frontend

1. **Nova seção no Dashboard do Corretor** — Card "Minhas Indicações" com:
   - Link copiável para indicar corretores (`/registro-corretor?ind=CODIGO`)
   - Link copiável para indicar imobiliárias (`/registro-imobiliaria?ind=CODIGO`)
   - Lista de indicados com status (pendente/cadastrado/comissão paga)
   - Total de comissões pendentes e recebidas

2. **Nova página `/minhas-indicacoes`** — Tabela completa de indicações com filtros

3. **Alterar páginas de registro** — Capturar param `?ind=` e enviar para as edge functions

4. **Admin: Nova seção em Configurações** — Definir % de comissão padrão para indicações

5. **Admin: Nova página ou aba em Comissões** — Ver todas as indicações e gerenciar pagamentos

### Fluxo resumido

1. Corretor acessa Dashboard → clica "Copiar link de indicação"
2. Compartilha link com colega/imobiliária
3. Indicado se cadastra (link carrega o código automaticamente)
4. Indicado faz primeiro pagamento via Asaas
5. Webhook calcula comissão e registra em `indicacoes_corretor`
6. Admin vê comissão pendente e marca como paga

### Arquivos principais afetados

| Arquivo | Mudança |
|---------|---------|
| **Migration** | Criar tabela `indicacoes_corretor` + RLS |
| `supabase/functions/registro-corretor-autonomo/index.ts` | Aceitar `codigo_indicacao` |
| `supabase/functions/registro-imobiliaria/index.ts` | Aceitar `codigo_indicacao` |
| `supabase/functions/asaas-webhook/index.ts` | Gerar comissão no 1º pagamento |
| `src/pages/Dashboard.tsx` | Card "Minhas Indicações" |
| Nova: `src/pages/MinhasIndicacoes.tsx` | Página completa de indicações |
| `src/pages/auth/RegistroCorretorAutonomo.tsx` | Capturar `?ind=` |
| `src/pages/auth/RegistroImobiliaria.tsx` | Capturar `?ind=` |
| `src/pages/admin/AdminConfiguracoes.tsx` | Config de % comissão |
| `src/pages/admin/AdminComissoes.tsx` | Aba/seção para indicações |

