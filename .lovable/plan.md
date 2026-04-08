

# Trocar `buttonUrlDynamicParams` de índice `[0]` para `[1]`

## Contexto
O ZionTalk espera o token da pesquisa no `buttonUrlDynamicParams[1]` (segundo botão ou segundo parâmetro), mas atualmente o código envia no `[0]`.

## Mudanças

### 1. `supabase/functions/verify-otp/index.ts` (linha 352)
Adicionar string vazia no índice 0 para que o token fique no índice 1:

```typescript
// De:
buttonUrlDynamicParams: [surveyToken],

// Para:
buttonUrlDynamicParams: ['', surveyToken],
```

### 2. `supabase/functions/send-whatsapp/index.ts` (linhas 300-303)
Sem alteração necessária — o `forEach` com `index` já mapeia corretamente os índices do array para `buttonUrlDynamicParams[0]` e `buttonUrlDynamicParams[1]`.

## Resultado
O `formData` enviado ao ZionTalk terá:
- `buttonUrlDynamicParams[0]` = `''` (vazio)
- `buttonUrlDynamicParams[1]` = token da pesquisa

## Escopo
- 1 arquivo, 1 linha alterada
- Redeploy da edge function `verify-otp`

