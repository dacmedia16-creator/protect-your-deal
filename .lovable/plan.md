

## Plano: Estilizar os 3 cards informativos no mesmo padrão quadriculado

### Objetivo
Transformar os 3 cards (Registros como Parceiro, Pesquisas Respondidas, Indique e Ganhe) para seguirem o mesmo estilo visual dos ícones de ações rápidas — quadrados com ícone centralizado e layout limpo.

### Alteração em `src/pages/Dashboard.tsx`

**Card "Fichas como Parceiro" (linhas 462-482)**
- Aumentar o ícone container para `h-14 w-14 rounded-xl bg-muted`
- Ícone `Handshake` maior (`h-6 w-6`)
- Padding uniforme `p-4`, gap `gap-4`
- Adicionar chevron `>` à direita como os outros

**Card "Pesquisas Pós-Visita" (linhas 484-511)**
- Manter o estilo atual que já está próximo (ícone `h-12 w-12 rounded-xl`) — ajustar para `h-14 w-14` para uniformizar

**Card "Indique e Ganhe" (linhas 517-536)**
- Já está no estilo correto com ícone `h-12 w-12 rounded-xl` — ajustar para `h-14 w-14` para uniformizar

Todos os 3 cards terão o mesmo padrão visual: ícone quadrado arredondado à esquerda, texto à direita, chevron no final.

