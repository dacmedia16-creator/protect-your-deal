

# Envio automático da pesquisa pós-visita via WhatsApp

## Resumo
Quando o comprador confirma a visita (OTP verificado), o sistema criará automaticamente uma survey e enviará via WhatsApp usando o template Meta `pesquisa_pos_visita` (conforme imagem de referência).

## Template Meta (a configurar no ZionTalk)

Baseado na imagem enviada:
- **Nome**: `pesquisa_pos_visita`
- **Header**: "Pesquisa Pós-Visita"
- **Body**: `Olá {{1}}!\n\nAgradecemos sua visita ao imóvel:\n{{2}}\n\nGostaríamos de saber sua opinião sobre a experiência. Leva menos de 1 minuto!\n\n{{3}}`
- **Footer**: "Visita Confirmada!"
- **Botão CTA**: "Responder Pesquisa" → URL dinâmica com sufixo `{{1}}`
- **Parâmetros**: `body[1]`=nome, `body[2]`=endereço, `body[3]`=lembrete, `buttonUrlDynamicParams[0]`=token

## Implementação

### Arquivo: `supabase/functions/verify-otp/index.ts`

Adicionar função `sendSurveyWhatsApp(supabase, ficha)` e chamá-la após a linha 565 (após PDF + emails), apenas quando `otp.tipo === 'comprador'` e status final é `completo` ou `finalizado_parcial`.

**Lógica da função:**
1. Verificar feature flag (`post_visit_survey`) na tabela `imobiliaria_feature_flags` ou `user_feature_flags`
2. Verificar se já existe survey para esta ficha (evitar duplicata)
3. Criar survey no banco via INSERT direto (sem depender de auth de usuário) — reutilizar lógica do `create-survey` para determinar `corretor_id` correto
4. Obter canal WhatsApp padrão via `configuracoes_sistema`
5. Chamar `send-whatsapp` internamente (via fetch com SERVICE_ROLE_KEY) com:
   - `action: 'send-template'`
   - `templateName: 'pesquisa_pos_visita'`
   - `phone: ficha.comprador_telefone`
   - `templateParams: { "1": nome, "2": endereço, "3": "Sua opinião nos ajuda a melhorar!" }`
   - `buttonUrlDynamicParams: [surveyToken]`
   - `channel`: canal padrão do sistema (meta ou meta2)
6. Tudo em `try/catch` isolado — falha no envio não bloqueia confirmação

**Chamada no fluxo** (após linha 565):
```typescript
if (otp.tipo === 'comprador' && (newStatus === 'completo' || newStatus === 'finalizado_parcial')) {
  try {
    await sendSurveyWhatsApp(supabase, updatedFicha, otp);
  } catch (err) {
    console.error('[verify-otp] Erro ao enviar pesquisa pós-visita:', err);
  }
}
```

## Escopo
- 1 arquivo modificado: `supabase/functions/verify-otp/index.ts`
- ~80 linhas adicionadas (função + chamada)
- Sem mudança de schema (tabela `surveys` já existe com `token` auto-gerado)
- Template Meta deve ser configurado no ZionTalk separadamente

