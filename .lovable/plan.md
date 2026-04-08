

# Verificação automática do OTP — Como funcionaria

## Fluxo atual
1. Comprador recebe WhatsApp com **código de 6 dígitos** + **link com token**
2. Clica no link → abre página `ConfirmarVisita`
3. Precisa **digitar manualmente** o código de 6 dígitos
4. Preenche dados legais (nome, CPF, aceite) → confirma

## Problema
O token na URL já identifica unicamente o OTP. Pedir para o usuário digitar o código novamente é redundante — ele já clicou no link correto.

## Proposta: Auto-preenchimento do código via token

Quando o comprador clica no botão do template Meta, o link já contém o token. A página `ConfirmarVisita` pode:

1. **Buscar o OTP pelo token** (já faz isso via `get-otp-info`)
2. **Auto-preencher o campo de código** com o código correto obtido do backend
3. O usuário ainda precisa preencher **nome, CPF e aceite legal** (obrigatório juridicamente)
4. Ao clicar "Confirmar", o código já está preenchido — fluxo mais rápido

### Alternativa mais agressiva: confirmar sem código
- O `verify-otp` aceitaria um parâmetro `auto_verify: true` quando o token é válido
- Eliminaria completamente o campo de código
- **Risco**: qualquer pessoa com o link poderia confirmar (menor segurança)

## Abordagem recomendada
**Auto-preencher o código** mas manter o campo visível (readonly). O usuário ainda precisa:
- Preencher nome e CPF (dados legais obrigatórios)
- Marcar o aceite dos termos
- Clicar "Confirmar"

Isso reduz fricção sem comprometer a segurança jurídica.

## Arquivos a modificar
- `supabase/functions/get-otp-info/index.ts` — retornar o código OTP quando acessado via token válido (não expirado, não confirmado)
- `src/pages/ConfirmarVisita.tsx` — auto-preencher o campo de código com o valor recebido do backend

## Impacto
- Sem mudança de schema
- 1 edge function + 1 página frontend
- Experiência do comprador: abre o link e só precisa preencher nome/CPF e confirmar

