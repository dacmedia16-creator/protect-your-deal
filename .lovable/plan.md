

## Plan: Add WhatsApp Channels Management Section to Admin Settings

### What will be built
A new dedicated Card in `AdminConfiguracoes.tsx` that replaces the current simple channel selector dropdown with a full WhatsApp channels management panel showing:
- All 3 channels (Default, Meta, Meta 2) with their status and descriptions
- Visual indicator of which channel is currently active (the default one)
- "Test Connection" button per channel that invokes `send-whatsapp` with `action: 'test-connection'`
- Ability to switch the active channel via a single click (updates `whatsapp_channel_padrao`)

### Implementation steps

1. **Expand the Integrações Card in `AdminConfiguracoes.tsx`**
   - Replace the current simple `Select` dropdown for `whatsapp_channel_padrao` with a detailed list of all 3 WhatsApp channels
   - Each channel shows: name, description, active badge (green if it's the current default), and a "Test Connection" button
   - Add state for `testingChannel` and `channelStatuses` (connected/error/unknown per channel)
   - "Test Connection" calls `supabase.functions.invoke('send-whatsapp', { body: { action: 'test-connection', channel } })` and updates status
   - Clicking "Ativar" on a non-active channel updates `whatsapp_channel_padrao` via the existing `updateConfigMutation`
   - Keep the existing integration items (ImoView) above or below

### Technical details
- No database changes needed -- uses existing `configuracoes_sistema` table and `send-whatsapp` edge function
- No new files -- all changes in `src/pages/admin/AdminConfiguracoes.tsx`
- Reuses existing `updateConfigMutation`, `getConfigStringValue`, and `supabase.functions.invoke`

