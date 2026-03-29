

## Correção: Formulário ainda envia sozinho no último passo

### Problema
O botão "Criar Registro" no último step tem `type="submit"`, e o `<form onSubmit={handleSubmit}>` ainda controla o fluxo. Pressionar Enter em qualquer campo do último step (observação, data) dispara o submit nativo do form. A guard `!isLastStep` não ajuda porque **já estamos** no último step.

### Solução

**`src/pages/NovaFicha.tsx`** — Duas mudanças:

1. **Linha 1311**: Mudar `<form onSubmit={handleSubmit}>` para `<form onSubmit={(e) => e.preventDefault()}>` — o form nunca submete nativamente.

2. **Linha 1333**: Mudar o botão "Criar Registro" de `type="submit"` para `type="button"` com `onClick={handleSubmit}` — a submissão é 100% controlada pelo clique no botão.

Isso elimina completamente o submit nativo do browser. O Enter em campos de texto não faz mais nada.

