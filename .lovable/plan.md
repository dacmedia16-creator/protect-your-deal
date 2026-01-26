
## Plano: Desativar Verificação de Versão no Preview

### Problema
O overlay de atualização fica em loop infinito no preview do Lovable porque o `VITE_BUILD_ID` permanece estático mesmo após recarregar a página.

### Solução
Adicionar uma verificação no início do componente para não renderizar nada quando estiver em ambiente de desenvolvimento/preview.

### Implementação

**Arquivo:** `src/components/VersionCheckWithOverlay.tsx`

Adicionar verificação logo no início do componente:

```typescript
export function VersionCheckWithOverlay() {
  // Não verificar versão em ambiente de desenvolvimento/preview
  const isDevEnvironment = import.meta.env.DEV || 
    window.location.hostname.includes('lovableproject.com') ||
    window.location.hostname.includes('localhost');

  // ... resto dos hooks ...

  // Retornar null antes do JSX se for ambiente de dev
  if (isDevEnvironment) {
    return null;
  }

  return (
    <UpdateCountdownOverlay ... />
  );
}
```

### Detalhes Técnicos

| Condição | Descrição |
|----------|-----------|
| `import.meta.env.DEV` | Vite define como `true` em modo desenvolvimento |
| `lovableproject.com` | Domínio do preview do Lovable |
| `localhost` | Desenvolvimento local |

### Resultado Esperado

- **Preview Lovable**: Overlay nunca aparece (correto para desenvolvimento)
- **App publicado** (`protect-your-deal.lovable.app`): Continua funcionando normalmente
- **PWA instalado**: Atualiza corretamente para usuários reais

### Impacto
Nenhum impacto para usuários finais. Apenas melhora a experiência de desenvolvimento.
