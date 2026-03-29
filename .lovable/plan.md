

## Correção: Último passo envia formulário automaticamente

### Problema
Quando o usuário está no penúltimo step e pressiona Enter em qualquer campo de texto (ex: telefone, nome), o navegador dispara o `onSubmit` do `<form>` nativo. Como o formulário inteiro está envolvido em `<form onSubmit={handleSubmit}>`, isso submete diretamente, pulando o step de revisão.

### Solução

**`src/pages/NovaFicha.tsx`** — Alterar o `handleSubmit` para bloquear submissão se não estiver no último step:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Bloquear submit se não estiver no último passo
  if (!isLastStep) {
    handleNext(); // Avançar ao próximo step em vez de submeter
    return;
  }
  
  // ... restante da lógica existente
};
```

Uma alteração de 4 linhas no início do `handleSubmit`. Isso garante que pressionar Enter em qualquer step intermediário apenas avança para o próximo step, e a submissão real só acontece no step de revisão.

