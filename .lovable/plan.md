

# Corrigir índice do botão CTA no template `pesquisa_pos_visita`

## Problema

A imagem mostra que o template tem **um único parâmetro dinâmico `{{1}}`** no botão "Responder Pesquisa". No ZionTalk, `{{1}}` corresponde a `buttonUrlDynamicParams[0]`.

Hoje o código envia `buttonUrlDynamicParams: ['', surveyToken]`. A string vazia no índice `[0]` é filtrada pelo `send-whatsapp` (que ignora valores vazios), e o token vai para o índice `[1]`. O template espera no `[0]`, então o botão fica sem o token e a Meta rejeita silenciosamente.

## Correção

### `supabase/functions/verify-otp/index.ts` (linhas 352-353)

**De:**
```typescript
buttonUrlDynamicParams: ['', surveyToken],
```

**Para:**
```typescript
buttonUrlDynamicParams: [surveyToken],
```

## Resultado
- `buttonUrlDynamicParams[0]` = token da pesquisa → preenche `{{1}}` do template
- O botão "Responder Pesquisa" abrirá `https://visitaseguras.com.br/survey/{token}`

## Escopo
- 1 arquivo, 1 linha alterada
- Redeploy automático

