

## Correção: PDF falha com quebra de linha nas observações

### Causa raiz
A ficha `VS2684E990` tem observações com quebra de linha (`\n`):
```
Nesta Visita visitamos dois Imóveis da Mesma propriearia:
Alphaville Nova Esplanada III ...
```

No `generate-pdf`, linha 621, o texto é dividido apenas por espaços (`split(' ')`). O `\n` fica dentro de uma "palavra" e quando `widthOfTextAtSize` tenta medir esse texto, o encoding WinAnsi do pdf-lib não consegue processar o caractere `\n` (0x000a), causando o crash.

### Correção
No `generate-pdf/index.ts`, antes do word-wrap, dividir o texto das observações por linhas (`\n`) primeiro, e depois processar cada linha com o word-wrap existente. Isso resolve o problema para qualquer campo que contenha quebras de linha.

**Arquivo:** `supabase/functions/generate-pdf/index.ts` (linhas ~619-673)

Mudança:
1. Substituir `const words = ficha.observacoes.split(' ')` por um loop que primeiro separa por `\n`, e para cada parágrafo faz o word-wrap por espaços
2. Sanitizar também os valores passados para `drawField` e `drawText` removendo `\n` com `.replace(/\n/g, ' ')` como proteção extra

### Impacto
- Corrige o erro de geração de PDF para fichas com observações multi-linha
- Corrige também o backup automático que depende do generate-pdf
- Nenhuma mudança no frontend

