

## Correção

**Arquivo:** `src/pages/admin/AdminWhatsApp.tsx` (linha ~160)

Substituir o delay fixo de 500ms por um intervalo aleatório entre 15 e 35 segundos, e adicionar um indicador visual de contagem regressiva no progresso para o admin saber que o sistema está aguardando propositalmente.

**Mudanças:**

1. Adicionar estado para controlar o countdown entre envios
2. Trocar `setTimeout(r, 500)` por intervalo aleatório de 15-35s com countdown visual
3. Mostrar "Aguardando Xs..." na barra de progresso durante a pausa

