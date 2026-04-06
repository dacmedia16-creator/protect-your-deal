

# Expandir Onboarding Tour com novos passos

## Situação atual
- O `data-tour="ver-registros"` já foi corrigido (está no card Total na linha 485).
- Faltam targets para **Parcerias/Convites** e **Sofia (Ajuda)** no MobileNav.
- O MobileNav renderiza itens dinamicamente via `.map()`, sem `data-tour` individual nos botões. O botão Sofia é estático mas também sem `data-tour`.

## Alterações

### 1. MobileNav.tsx — Adicionar data-tour nos botões
- Adicionar `data-tour` condicional no `.map()`: quando `item.path === '/convites'`, renderizar `data-tour="parcerias"`.
- Adicionar `data-tour="sofia-ajuda"` no botão estático da Sofia.

### 2. Dashboard.tsx — Adicionar 2 novos passos ao tour
Inserir após o passo `indicacoes` e antes de `nav-menu`:

| # | target | Título | Descrição |
|---|--------|--------|-----------|
| 6 | `parcerias` | "Parcerias e convites" | "Envie e receba convites de parceria com outros corretores. Vocês compartilham fichas de visita de forma segura." |
| 7 | `sofia-ajuda` | "Sofia, sua assistente" | "Precisa de ajuda? Toque aqui para conversar com a Sofia. Ela explica funcionalidades e tira dúvidas em tempo real." |
| 8 | `nav-menu` | "Menu de navegação" | (mantém texto atual, agora como passo 8) |

Total: 8 passos (antes eram 6).

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/components/MobileNav.tsx` | `data-tour="parcerias"` no botão Convites, `data-tour="sofia-ajuda"` no botão Sofia |
| `src/pages/Dashboard.tsx` | 2 novos passos no array `ONBOARDING_STEPS` |

### Sem mudança em
- OnboardingTour.tsx (componente genérico, já suporta N passos)
- Lógica de dados, queries, navegação

