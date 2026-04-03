

## Plano: Ocultar overlay de atualização para visitantes não-logados

### Problema
O overlay de "Nova versão disponível" aparece para todos os visitantes, incluindo quem não está logado na landing page pública. O countdown chega a valores negativos (-78) porque continua decrementando sem parar. Visitantes não-logados não precisam ver esse aviso.

### Alterações

**`src/components/VersionCheckWithOverlay.tsx`**

1. Importar `useAuth` e verificar sessão antes de iniciar qualquer check de versão
2. Se não há usuário logado, retornar `null` sem executar nenhuma lógica
3. Corrigir o countdown para parar em 0 (prevenir valores negativos)

```typescript
// Adicionar import
import { useAuth } from '@/hooks/useAuth';

// Dentro do componente, após o check de dev environment:
const { user } = useAuth();

// Se não está logado, não verificar versão
if (!user) return null;
```

4. No intervalo de countdown, impedir que vá abaixo de 0:
```typescript
setCountdown(prev => {
  if (prev <= 0) return 0;
  return prev - 1;
});
```

### Resultado
- Visitantes na landing page não verão o overlay de atualização
- Apenas usuários logados receberão notificação de nova versão
- Countdown não vai mais para valores negativos

