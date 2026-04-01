

## Plano: Adicionar balões de ajuda (OnboardingTour) na criação de fichas

O tour de onboarding só existe no Dashboard. Vamos adicionar um tour específico para a página "Nova Ficha" que guia o usuário pelas etapas do wizard.

### Alterações

**1. `src/pages/NovaFicha.tsx`**

- Importar `OnboardingTour`
- Definir `NOVA_FICHA_TOUR_STEPS` com passos explicativos:
  1. `target: "ficha-progress"` — "Acompanhe seu progresso aqui. Cada etapa será marcada quando concluída."
  2. `target: "ficha-modo"` — "Escolha como criar: todos os dados de uma vez ou começar pelo proprietário/comprador."
  3. `target: "ficha-nav-buttons"` — "Use os botões para navegar entre as etapas. No final, clique em 'Criar Registro'."
- Adicionar `data-tour` attributes nos elementos:
  - `data-tour="ficha-progress"` no container do progress indicator
  - `data-tour="ficha-modo"` no Card do step Modo
  - `data-tour="ficha-nav-buttons"` no div dos botões de navegação
- Renderizar `<OnboardingTour steps={NOVA_FICHA_TOUR_STEPS} storageKey="visitaprova-novaficha-tour-done" />` no final do componente
- Usar `storageKey` diferente do Dashboard para que os tours sejam independentes

### Resultado
Na primeira vez que o usuário acessar "Nova Ficha", verá balões explicando o progresso, a escolha de modo e os botões de navegação. Após concluir ou fechar, não aparece novamente.

