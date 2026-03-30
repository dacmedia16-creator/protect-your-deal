

## Plano: Adicionar campo de número para envio de teste na seção Integrações

### Alteração em `src/pages/admin/AdminConfiguracoes.tsx`

1. **Adicionar estados** para número de teste e loading de envio por canal:
   - `testPhone: Record<string, string>` — número digitado por canal
   - `sendingTest: Record<string, boolean>` — loading do envio

2. **Criar função `sendTestMessage(channel)`** que invoca `send-whatsapp` com:
   - `action: 'send-template'` para canais `meta`/`meta2` (template `visita_prova_2`)
   - `action: 'send-text'` para canal `default` (mensagem de texto livre)

3. **Expandir cada card de canal WhatsApp** para incluir abaixo do botão "Testar":
   - Input com máscara de telefone e placeholder `(00) 00000-0000`
   - Botão "Enviar teste" que chama `sendTestMessage`
   - Feedback via toast de sucesso/erro

### Resultado
Cada canal WhatsApp terá um campo de número + botão para enviar mensagem de teste real, direto da página de configurações.

