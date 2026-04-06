

# Botão "Repetir Tour" no Perfil

## O que será feito
Adicionar um botão no card "Aplicativo" da página de Perfil que limpa as flags do localStorage (`visitaprova-onboarding-done` e `visitaprova-novaficha-tour-done`) e redireciona o usuário ao Dashboard, onde o tour reinicia automaticamente.

## Alteração

### `src/pages/Perfil.tsx`
- Importar `HelpCircle` do lucide-react
- Adicionar função `handleReplayTour` que:
  1. Remove `visitaprova-onboarding-done` e `visitaprova-novaficha-tour-done` do localStorage
  2. Mostra toast "Tour reiniciado!"
  3. Navega para `/dashboard`
- Inserir no card "Aplicativo", antes do botão "Forçar atualização", um novo item:

```
┌─────────────────────────────────────┐
│ 💬 Repetir tutorial                 │
│ Reveja o passo a passo do sistema   │
│                            [Iniciar]│
└─────────────────────────────────────┘
```

## Arquivo alterado
| Arquivo | Mudança |
|---------|---------|
| `src/pages/Perfil.tsx` | Botão + handler para resetar tour |

