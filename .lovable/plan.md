
Objetivo

Corrigir o envio automático da `pesquisa_pos_visita`, porque o backend marcou o disparo como sucesso, mas a mensagem não chegou no WhatsApp.

O que encontrei

- O fluxo automático da pesquisa sai de `supabase/functions/verify-otp/index.ts`.
- Hoje ele envia `buttonUrlDynamicParams: [surveyToken]`, ou seja, no índice `0`.
- A função `supabase/functions/send-whatsapp/index.ts` já foi preparada para ignorar valores vazios sem perder o índice original. Isso permite enviar corretamente no índice `1` usando um placeholder vazio na posição `0`.
- O problema começou logo após a troca de `[1]` para `[0]`, então a causa mais provável é regressão na posição do botão CTA desse template.
- Os logs atuais mostram aceitação do request (`201`), mas isso não garante entrega real no WhatsApp.

Plano

1. Reverter o payload da pesquisa em `supabase/functions/verify-otp/index.ts` para voltar o token ao índice correto do botão CTA (`buttonUrlDynamicParams[1]`), mantendo um comentário claro para evitar nova regressão.
2. Melhorar a rastreabilidade em `supabase/functions/send-whatsapp/index.ts`, salvando em `whatsapp_logs.metadata`:
   - `templateName`
   - canal usado
   - índices efetivamente enviados em `buttonUrlDynamicParams`
   - referência da survey/ficha quando o envio vier desse fluxo
3. Manter o escopo enxuto nesta correção: não criar tela nova de teste agora, porque o ajuste principal está no payload automático e já existe fallback manual em `src/components/SurveySection.tsx`.
4. Validar ponta a ponta o fluxo: confirmar comprador, disparar a pesquisa, conferir nos logs que o índice enviado voltou a ser `1` e verificar no aparelho se a mensagem chegou com o botão CTA funcionando.

Detalhes técnicos

- Arquivos principais: `supabase/functions/verify-otp/index.ts` e `supabase/functions/send-whatsapp/index.ts`.
- Sem migração de banco.
- Sem mudança de autenticação.
- Hipótese principal: o template `pesquisa_pos_visita` está configurado para usar `buttonUrlDynamicParams[1]`, e a mudança recente para `[0]` quebrou a entrega.
- Se, mesmo com o índice `1` restaurado, o canal `meta2` continuar retornando `201` sem entrega, o próximo passo será fixar esse template no canal em que ele realmente está aprovado, em vez de depender do canal padrão global.
