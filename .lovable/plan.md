

## Animação de destaque no card "Indique e Ganhe" por 30s após login

### Mudança

| Arquivo | O que fazer |
|---------|------------|
| `src/pages/Dashboard.tsx` | Adicionar estado `showPulse` que fica `true` por 30s ao montar o componente, e aplicar uma classe de animação pulsante ao card "Indique e Ganhe" enquanto ativo |
| `src/index.css` | Adicionar keyframe `attention-pulse` que alterna o brilho/sombra do card com cores teal para chamar atenção |

### Implementação

- `useState(true)` + `useEffect` com `setTimeout(30000)` para desligar o pulso
- Keyframe CSS: pulso suave alternando `box-shadow` e `border-color` em tons teal (2s loop)
- Classe condicional no card: `showPulse ? 'animate-attention-pulse' : ''`

