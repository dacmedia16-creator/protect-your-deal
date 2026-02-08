
# Corrigir Nomes dos Corretores nos Registros da Empresa

## Problema

Na pagina de registros da empresa (`/empresa/fichas`), todos os corretores aparecem como "Desconhecido". O codigo faz duas queries separadas:

1. Busca as fichas (funciona - os registros aparecem)
2. Busca os nomes na tabela `profiles` usando `.in('user_id', userIds)` (retorna vazio silenciosamente)

A segunda query nao trata erros. Se a consulta falha por qualquer motivo relacionado as politicas de seguranca (RLS), o `corretorMap` fica vazio e todos os nomes aparecem como "Desconhecido".

## Dados Verificados

- No banco de dados, os 28 registros da Vip7 tem `user_id` preenchido
- Todos os 4 corretores tem perfis com `imobiliaria_id` correto
- As politicas de seguranca da tabela `profiles` DEVERIAM permitir que o admin veja os perfis, mas algo esta falhando silenciosamente

## Solucao

Criar uma funcao de banco de dados que retorna os registros ja com o nome do corretor, eliminando a necessidade da segunda query e o problema de RLS.

### 1. Criar funcao no banco de dados

Criar a funcao `get_fichas_empresa(p_imobiliaria_id uuid)` que:
- Valida que o usuario logado e admin da imobiliaria ou super_admin
- Faz um LEFT JOIN entre `fichas_visita` e `profiles` no servidor
- Retorna os registros ja com o campo `corretor_nome` preenchido
- Usa `SECURITY DEFINER` para acessar profiles sem depender de RLS do lado do cliente

```text
Funcao: get_fichas_empresa(p_imobiliaria_id uuid)
Retorna: id, protocolo, imovel_endereco, proprietario_nome, comprador_nome, 
         data_visita, status, user_id, convertido_venda, corretor_nome, created_at
Seguranca: SECURITY DEFINER com validacao de permissao interna
```

### 2. Atualizar o frontend

No arquivo `src/pages/empresa/EmpresaFichas.tsx`:
- Substituir as 2 queries separadas por uma unica chamada `supabase.rpc('get_fichas_empresa', { p_imobiliaria_id: imobiliariaId })`
- Remover a logica de `corretorMap` (os nomes ja vem do banco)
- Adicionar tratamento de erro adequado

### 3. Beneficios

- Elimina a dependencia de RLS na tabela `profiles` para esta consulta
- Reduz de 2 queries para 1 (melhor performance)
- Tratamento de erros adequado (a funcao retorna erro se o usuario nao tem permissao)
- Corretor removido (user_id = null) continua mostrando "(Corretor removido)"
- Corretor com perfil nao encontrado mostra "Desconhecido" em vez de falhar silenciosamente

## Arquivos modificados

| Arquivo | Alteracao |
|---------|-----------|
| Migration SQL | Criar funcao `get_fichas_empresa` |
| `src/pages/empresa/EmpresaFichas.tsx` | Usar `supabase.rpc()` em vez de 2 queries |

## Impacto

- Todos os registros passarao a mostrar o nome correto do corretor
- A pagina carregara mais rapido (1 query em vez de 2)
- Sem risco de regressao em outras paginas (a alteracao e isolada)
