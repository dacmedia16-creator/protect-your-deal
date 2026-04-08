

# Corrigir envio de pesquisa pós-visita — mensagem não chega no WhatsApp

## Causa raiz
A mudança para `buttonUrlDynamicParams: ['', surveyToken]` envia um parâmetro vazio no índice `[0]`. O ZionTalk aceita (201), mas o Meta rejeita silenciosamente a mensagem porque botões CTA não aceitam parâmetros dinâmicos vazios.

## Correção

### Abordagem: enviar apenas o índice `[1]` diretamente, sem incluir `[0]`

### 1. `supabase/functions/send-whatsapp/index.ts` (linhas 299-304)
Modificar o loop para **pular parâmetros vazios**:

```typescript
// De:
if (buttonUrlDynamicParams && buttonUrlDynamicParams.length > 0) {
  buttonUrlDynamicParams.forEach((param, index) => {
    formData.append(`buttonUrlDynamicParams[${index}]`, param);
  });
}

// Para:
if (buttonUrlDynamicParams && buttonUrlDynamicParams.length > 0) {
  buttonUrlDynamicParams.forEach((param, index) => {
    if (param !== '' && param != null) {
      formData.append(`buttonUrlDynamicParams[${index}]`, param);
    }
  });
}
```

Isso garante que apenas `buttonUrlDynamicParams[1]=<token>` seja enviado ao ZionTalk, sem o `[0]=''` que causa a rejeição silenciosa do Meta.

### Sem alteração em `verify-otp/index.ts`
O payload `['', surveyToken]` continua correto — o array posiciona o token no índice 1, e o `send-whatsapp` agora pula o índice vazio.

## Escopo
- 1 arquivo alterado (`send-whatsapp/index.ts`)
- 1 redeploy automático
- Afeta todos os templates que usam `buttonUrlDynamicParams` (melhoria global)

