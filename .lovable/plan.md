

# Excluir componente PWAInstallPrompt não utilizado

## Contexto

O componente `src/components/PWAInstallPrompt.tsx` existe no projeto mas **nao e importado ou usado em nenhum lugar**. O sistema de instalacao PWA utiliza outros dois componentes:

- `PWAInstallModal.tsx` - banner automatico global (renderizado no `App.tsx`)
- `PWAInstallBanner.tsx` - banner inline (usado no Dashboard e ListaFichas)

## Acao

| Arquivo | Acao |
|---------|------|
| `src/components/PWAInstallPrompt.tsx` | **Deletar** |

## Impacto

- Nenhum. O componente nao e importado em nenhum lugar do projeto.
- Os outros dois componentes de instalacao PWA continuarao funcionando normalmente.
- Reducao de codigo morto no projeto.

