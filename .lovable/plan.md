

## Diagnóstico

O botão "Ver Detalhes da Ficha" no email gera a URL `visitaprova.com.br/ficha/{id}`, mas a rota no app é `/fichas/:id` (com **s**). Por isso dá 404.

O bug existe em **dois** Edge Functions:

1. **`regenerate-backup/index.ts`** (linha 193): `link: \`https://visitaprova.com.br/ficha/${ficha_id}\``
2. **`verify-otp/index.ts`**: mesmo padrão com `/ficha/` sem o **s**

## Correção

Alterar o link em ambas as funções de `/ficha/` para `/fichas/` (com s):

```typescript
// De:
link: `https://visitaprova.com.br/ficha/${ficha_id}`

// Para:
link: `https://visitaprova.com.br/fichas/${ficha_id}`
```

Isso alinha o link do email com a rota real do app (`/fichas/:id`).

