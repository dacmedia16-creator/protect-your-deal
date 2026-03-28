

## Plano: Empreendimento genérico auto-criado + campo de endereço manual

### Objetivo
Toda construtora criada já vem com um empreendimento genérico chamado "Outro (Endereço Manual)". Quando o corretor seleciona esse empreendimento ao criar uma ficha, em vez de auto-preencher o endereço, aparece um campo de texto para digitar o endereço manualmente.

### Alterações

#### 1. Edge Functions — Criar empreendimento genérico automaticamente

Nos dois pontos de criação de construtoras:

**`supabase/functions/registro-construtora/index.ts`** — Após criar a construtora (step 2), inserir:
```sql
INSERT INTO empreendimentos (construtora_id, nome, tipo, status, descricao)
VALUES (constData.id, 'Outro (Endereço Manual)', 'misto', 'ativo', 'Empreendimento genérico para endereços manuais')
```

**`src/pages/admin/AdminNovaConstrutora.tsx`** — Após o insert da construtora no `onSubmit`, fazer o mesmo insert.

#### 2. Frontend — Campo de endereço manual no NovaFicha

**`src/pages/NovaFicha.tsx`** — Nos dois blocos de seleção de empreendimento (construtora nativa e parceira):

- Detectar se o empreendimento selecionado é o genérico (pelo nome `"Outro (Endereço Manual)"` ou por não ter endereço e ter nome começando com "Outro")
- Quando selecionado, em vez de mostrar o endereço fixo, exibir campos editáveis de endereço e tipo de imóvel (igual ao modo normal de imobiliária)
- O `imovel_tipo` também fica editável (Select com as opções padrão: Apartamento, Casa, etc.)

#### 3. Proteção contra exclusão

**`src/pages/construtora/ConstutoraEmpreendimentos.tsx`** — Ocultar botão de excluir para o empreendimento genérico (verificar pelo nome ou adicionar um campo `is_default`).

### Detalhes técnicos
- Sem migração de schema necessária — usa as colunas existentes da tabela `empreendimentos`
- Para construtoras já existentes, pode-se rodar um INSERT via ferramenta de dados para criar o empreendimento genérico retroativamente
- O empreendimento genérico é identificado pelo nome `"Outro (Endereço Manual)"` — abordagem simples sem necessidade de coluna extra

