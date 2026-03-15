

## Plano: Pause/Play e auto-pause ao sair da página

### Problema
Atualmente o loop de envio é um `for` síncrono — não tem como pausar. Ao sair da página, o componente desmonta e o envio para sem possibilidade de retomar.

### Solução

Refatorar o loop de envio para usar um **ref de controle (`isPausedRef`)** que o loop consulta a cada iteração, e armazenar a **fila de pendentes** em um ref para retomar de onde parou.

**Arquivo:** `src/pages/admin/AdminWhatsApp.tsx`

**1. Novos estados e refs:**
- `isPaused` (state) — controla o botão pause/play na UI
- `isPausedRef` (useRef) — consultado dentro do loop async (state não funciona dentro de closures)
- `pendingQueueRef` (useRef) — lista de users que ainda faltam enviar
- Importar `Pause`, `Play` do lucide-react

**2. Refatorar `handleSend`:**
- Ao iniciar, salvar a lista de destinatários no `pendingQueueRef`
- Criar função `processQueue()` que:
  - Faz um `while (pendingQueueRef.current.length > 0)`
  - Antes de cada envio, checa `isPausedRef.current` — se true, aguarda em loop de 500ms até despausar
  - Envia a mensagem, remove o user da fila, atualiza progresso
  - Aplica o delay aleatório 15-35s com countdown (também checando pause durante o countdown)

**3. Auto-pause ao sair da página:**
- `useEffect` com `document.addEventListener('visibilitychange')` — quando `hidden`, seta `isPaused = true`
- Quando volta (`visible`), **não** retoma automaticamente — mostra estado pausado com botão Play para o admin decidir
- `beforeunload` event para avisar ao fechar aba

**4. Botão Pause/Play na UI:**
- Na seção de progresso, adicionar botão ao lado da barra:
  - Se enviando e não pausado: botão Pause (ícone ⏸)
  - Se pausado: botão Play (ícone ▶) + texto "Pausado"
- Botão "Retomar" claro e visível

**5. Fluxo resumido:**
```text
[Enviar] → processa fila → [Pause] → loop aguarda
                                    → sai da aba → auto-pause
                                    → volta → vê "Pausado" → [Play] → continua de onde parou
```

### Escopo
Apenas `src/pages/admin/AdminWhatsApp.tsx` — nenhuma mudança em banco ou edge functions.

