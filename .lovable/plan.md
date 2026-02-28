

# Disparar testes WhatsApp nos 3 canais

## Passos

1. **Desabilitar JWT** na função `send-whatsapp` (alterar `verify_jwt = false` no `config.toml`)
2. **Disparar 3 testes** via `curl` na edge function:
   - Canal `default`: mensagem de texto livre
   - Canal `meta`: template `visita_prova_2`
   - Canal `meta2`: template `visita_prova_2`
   - Destino: `15981788214`
3. **Reabilitar JWT** (voltar `verify_jwt = true` no `config.toml`)

Nota: O `config.toml` é gerenciado automaticamente pelo sistema, mas a alteração temporária + deploy + curl + restauração será feita em sequência. Os resultados de cada disparo serão reportados para você ver qual canal respondeu.

