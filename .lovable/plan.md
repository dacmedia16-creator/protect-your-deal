
# Desabilitar todos os prompts de instalacao PWA

## Problema

O modal "Instalar VisitaProva" continua aparecendo para os usuarios. O usuario quer desabilitar completamente todos os prompts de instalacao PWA.

## Solucao

Fazer os 3 componentes PWA retornarem `null` imediatamente, sem nenhuma logica:

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/PWAInstallModal.tsx` | Retornar `null` no inicio da funcao |
| `src/components/PWAInstallBanner.tsx` | Retornar `null` no inicio da funcao |
| `src/components/PWAInstallFAB.tsx` | Retornar `null` no inicio da funcao |

Isso desabilita os 3 pontos onde o prompt aparece (modal global no App.tsx, banner no Dashboard e ListaFichas, e FAB flutuante) sem precisar remover imports ou referencias, minimizando mudancas.
