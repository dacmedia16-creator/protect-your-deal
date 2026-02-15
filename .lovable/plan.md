

# Adaptar envio OTP para usar template Meta aprovado `visita_prova`

## Problema

Quando o canal Meta esta selecionado, as edge functions tentam enviar mensagem de texto livre via `send_message/`, mas a API Oficial do Meta so aceita templates pre-aprovados via `send_template_message/`. Por isso as mensagens falham com erro 500.

## Solucao

Quando o canal for `meta`, usar o endpoint `send_template_message/` da ZionTalk com o template `visita_prova` e seus parametros. Quando for `default`, manter o envio de texto livre como esta hoje.

## Template Meta aprovado

Nome: `visita_prova`

Variaveis do corpo (body):
- `{{nome}}` - nome do proprietario/comprador
- `{{imovel}}` - endereco do imovel
- `{{codigo}}` - codigo OTP de 6 digitos
- `{{lembrete}}` - texto de lembrete (ex: "Este codigo expira em 1 hora.")

Botao CTA "Confirmar Visita":
- URL dinamica com `{{1}}` = token de confirmacao (path da URL)

## Alteracoes tecnicas

### 1. `supabase/functions/send-otp/index.ts`

- Criar funcao `sendTemplateViaZionTalk(phone, params, channel)` que:
  - Usa o endpoint `send_template_message/`
  - Envia `template_identifier = visita_prova`
  - Envia `language = pt_BR`
  - Mapeia os bodyParams: `bodyParams[nome]`, `bodyParams[imovel]`, `bodyParams[codigo]`, `bodyParams[lembrete]`
  - Envia `buttonUrlDynamicParams[0]` com o token de confirmacao
- No fluxo principal, quando `channel === 'meta'`:
  - Chamar `sendTemplateViaZionTalk` em vez de `sendViaZionTalk`
  - Nao enviar a segunda mensagem separada com o codigo (o template ja inclui o codigo)
- Quando `channel === 'default'`, manter o comportamento atual (texto livre + segunda mensagem com codigo)

### 2. `supabase/functions/process-otp-queue/index.ts`

- Mesma alteracao: adicionar `sendTemplateViaZionTalk` e usar quando canal for `meta`
- Nao enviar segunda mensagem quando for `meta`

### 3. `supabase/functions/otp-reminder/index.ts`

- Para lembretes, como o template `visita_prova` e generico o suficiente, usar o mesmo template com `lembrete` contendo o texto de urgencia (ex: "Expira em X minutos!")
- Quando canal for `default`, manter texto livre como hoje

## Formato do envio via template

```text
FormData:
  mobile_phone: +5511999999999
  template_identifier: visita_prova
  language: pt_BR
  bodyParams[nome]: Joao
  bodyParams[imovel]: Rua ABC 123
  bodyParams[codigo]: 123456
  bodyParams[lembrete]: Este codigo expira em 1 hora.
  buttonUrlDynamicParams[0]: <token-uuid>
```

## Arquivos modificados

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/send-otp/index.ts` | Adicionar envio via template Meta quando canal = meta |
| `supabase/functions/process-otp-queue/index.ts` | Mesma alteracao |
| `supabase/functions/otp-reminder/index.ts` | Mesma alteracao para lembretes |

