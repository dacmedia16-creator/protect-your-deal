

# Fix: Pesquisa não aparece para corretor da construtora (frontend)

## Problema

O corretor Apolo pertence a uma construtora. Quando o comprador confirmou a visita, o backend enviou a pesquisa automaticamente (já corrigido anteriormente). Porém, no `DetalhesFicha.tsx`, a verificação da feature flag só consulta `imobiliaria_feature_flags`. Como a ficha não tem `imobiliaria_id`, retorna `enabled: false` e a seção de pesquisa fica oculta.

## Solução

Arquivo: `src/pages/DetalhesFicha.tsx` (linhas 214-237)

Alterar a query `ficha-survey-feature` para verificar em cascata:

1. Se `ficha.imobiliaria_id` existe → consultar `imobiliaria_feature_flags`
2. Se não habilitado e `ficha.construtora_id` existe → consultar `construtora_feature_flags`
3. Se nenhum dos dois → consultar `user_feature_flags` (corretor autônomo)

A query fica habilitada quando existir qualquer um dos IDs, e faz as consultas em sequência até encontrar a flag habilitada.

## Resultado

O corretor Apolo (e qualquer corretor de construtora com a flag ativa) verá a seção de Pesquisa Pós-Visita normalmente.

