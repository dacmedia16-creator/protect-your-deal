
# Corrigir Nomes dos Corretores na Pagina Admin

## Problema

A pagina `AdminFichas.tsx` (super admin) tem o mesmo bug que foi corrigido na pagina da empresa: faz 2 queries separadas para buscar fichas e nomes dos corretores. A segunda query em `profiles` falha silenciosamente por problemas de RLS no lado do cliente, resultando em todos os corretores aparecendo como "Desconhecido".

## Dados Verificados

- A RLS de `profiles` TEM uma policy para super admin: `is_super_admin(auth.uid())`
- No banco de dados, todos os corretores tem nomes preenchidos
- O problema esta no padrao de 2 queries no frontend que nao trata erros da segunda query

## Solucao

Criar uma funcao RPC `get_fichas_admin()` no banco de dados, similar a `get_fichas_empresa`, que retorna TODAS as fichas com nomes dos corretores E das imobiliarias via JOINs no servidor.

### 1. Criar funcao no banco de dados

Funcao `get_fichas_admin()` que:
- Valida que o usuario e super_admin
- Faz LEFT JOIN entre `fichas_visita`, `profiles` e `imobiliarias` no servidor
- Retorna os campos necessarios ja com `corretor_nome` e `imobiliaria_nome`
- Usa `SECURITY DEFINER` para acessar os dados sem problemas de RLS do cliente

```text
Funcao: get_fichas_admin()
Retorna: id, protocolo, imovel_endereco, proprietario_nome, comprador_nome,
         data_visita, status, user_id, imobiliaria_id, backup_gerado_em,
         convertido_venda, corretor_nome, imobiliaria_nome
Seguranca: SECURITY DEFINER com validacao de super_admin
```

### 2. Atualizar o frontend

No arquivo `src/pages/admin/AdminFichas.tsx`:
- Substituir as 3 queries separadas (fichas + profiles + imobiliarias) por uma unica chamada `supabase.rpc('get_fichas_admin')`
- Remover a logica de `corretorMap` e `imobiliariaMap`
- Mapear os dados retornados diretamente, incluindo `is_autonomo` (quando imobiliaria_id e null)

### 3. Beneficios

- Elimina o bug de RLS silencioso nas tabelas `profiles` e `imobiliarias`
- Reduz de 3 queries para 1 (melhor performance)
- Nomes dos corretores e imobiliarias aparecem corretamente
- Corretor removido (user_id = null) continua tratado corretamente

## Arquivos modificados

| Arquivo | Alteracao |
|---------|-----------|
| Migration SQL | Criar funcao `get_fichas_admin` |
| `src/pages/admin/AdminFichas.tsx` | Usar `supabase.rpc()` em vez de 3 queries separadas |

## Impacto

- Corrige os nomes dos corretores na pagina admin
- Corrige os nomes das imobiliarias na mesma pagina
- Sem risco de regressao (alteracao isolada na pagina admin)
- Mesmo padrao ja usado com sucesso na pagina da empresa
