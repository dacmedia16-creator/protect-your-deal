

# Plano: Landing Page "Para Construtoras"

## Resumo

Criar a página `/para-construtoras` com 10 seções modulares, seguindo o padrão visual existente (dark gradient `#0F172A` to `#1E3A5F`, como `ParaImobiliarias.tsx`) mas elevado para SaaS B2B premium. Rota já existe em `publicRoutes.tsx`.

## Arquivos a criar

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/ParaConstrutoras.tsx` | Página principal, compõe as 10 seções |
| `src/components/para-construtoras/HeroSection.tsx` | Hero com headline + mockup dashboard |
| `src/components/para-construtoras/ProblemSection.tsx` | 6 cards de dor |
| `src/components/para-construtoras/SolutionSection.tsx` | Central de inteligência + callouts |
| `src/components/para-construtoras/BenefitsSection.tsx` | 6 blocos de benefício |
| `src/components/para-construtoras/ReportsSection.tsx` | 6 categorias de relatórios (seção mais forte) |
| `src/components/para-construtoras/ImpactSection.tsx` | 6 blocos de impacto executivo |
| `src/components/para-construtoras/DashboardShowcaseSection.tsx` | Mockup grande do painel com balões |
| `src/components/para-construtoras/ComparisonSection.tsx` | Tabela comparativa descentralizada vs VisitaProva |
| `src/components/para-construtoras/FAQSection.tsx` | 6 perguntas com Accordion |
| `src/components/para-construtoras/FinalCTASection.tsx` | CTA final premium |
| `src/components/para-construtoras/DashboardMockup.tsx` | Mockup SVG/CSS do dashboard com KPIs, funil, gráficos, rankings |

## Arquivo a editar

| Arquivo | Mudança |
|---------|---------|
| `src/routes/publicRoutes.tsx` | Adicionar rota `/para-construtoras` (já tem o lazy import de `ParaConstrutoras`) |

## Direção técnica

- **Base visual**: Fundo dark gradient (`from-[#0F172A] to-[#1E3A5F]`), texto branco, accent `#60A5FA`/`#3B82F6`
- **Dashboard mockup**: Construído 100% em CSS/Tailwind (não imagem), com KPI cards, mini funil, barras de gráfico, tabelas de ranking — tudo estilizado para parecer interface real
- **Animações**: `AnimatedSection` existente com variações de `direction` e `delay`
- **Componentes reutilizados**: `SEOHead`, `AnimatedSection`, `LogoIcon`, `Button`, `Badge`, `Accordion`
- **Responsivo**: Grid 1col mobile → 2-3col desktop
- **CTAs**: "Agendar demonstração" abre WhatsApp com mensagem pré-formatada; "Ver painel em funcionamento" linka para `/registro-construtora`
- **Copy**: Exatamente conforme especificado, sem clichês, tom executivo

## Ordem de implementação

1. Criar `DashboardMockup.tsx` (componente visual core)
2. Criar as 10 seções como componentes independentes
3. Criar `ParaConstrutoras.tsx` compondo todas as seções
4. Adicionar rota em `publicRoutes.tsx`

