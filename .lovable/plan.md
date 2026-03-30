

## Plano: Botões de teste de conexão na seção Integrações do AdminConfiguracoes

### Contexto
A seção "Integrações" em `/admin/configuracoes` mostra status estático ("Conectado") para WhatsApp e ImoView. O plano adiciona botões de teste real que invocam a edge function `send-whatsapp` com `action: 'test-connection'` para cada canal.

### Alterações em `src/pages/admin/AdminConfiguracoes.tsx`

1. **Adicionar estados** para loading e resultado do teste por canal:
   - `testingChannel: Record<string, boolean>` — controla spinner por canal
   - `channelStatus: Record<string, 'unknown' | 'connected' | 'error'>` — status real após teste

2. **Substituir array estático `integracoes`** por 3 canais WhatsApp individuais + ImoView:
   - `WhatsApp Padrão` → testa canal