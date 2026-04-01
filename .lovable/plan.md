

## Plano: Ajustar posições da Sofia e do botão Perfil no mobile

### Alterações

**1. `src/components/ChatAssistente.tsx`** — Descer a Sofia no mobile
- Linha 727: Mudar posição mobile de `top-4` para `bottom-20` (acima da nav bar)
- Linha 731: Idem para o chat aberto
- Ajustar tooltip/balão "Posso te ajudar?" para ficar acima do botão

**2. `src/components/MobileNav.tsx`** — Subir a nav bar (reduzir altura)
- Linha 88: Reduzir altura da nav de `h-16` para `h-14` para ficar mais compacta

### Detalhes técnicos

**Sofia (ChatAssistente):**
```
// De:
"fixed top-4 right-4 sm:bottom-6 sm:top-auto ..."
// Para:
"fixed bottom-20 right-4 sm:bottom-6 ..."
```

**MobileNav:**
```
// De: h-16
// Para: h-14
```

