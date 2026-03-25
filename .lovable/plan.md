

## Converter Depoimentos para Carrossel

### Resumo
Trocar o grid de depoimentos por um carrossel que exibe um depoimento por vez, com navegação por setas e indicadores de posição (dots). Usar o componente `Carousel` já existente no projeto (`src/components/ui/carousel.tsx`) com autoplay.

### Mudança

| Arquivo | O que fazer |
|---------|------------|
| `src/components/DepoimentosSection.tsx` | Substituir o `grid` por `Carousel`/`CarouselContent`/`CarouselItem` com autoplay via `embla-carousel-autoplay`. Adicionar setas de navegação e dots indicadores. Cada slide mostra 1 card centralizado (`max-w-2xl mx-auto`) |

### Detalhes
- Importar `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext` de `@/components/ui/carousel`
- Usar plugin `embla-carousel-autoplay` (já instalado como dependência do carousel) com delay de 5s e `stopOnInteraction: false`
- Cada `CarouselItem` contém o card do depoimento existente, centralizado
- Adicionar dots de navegação abaixo do carrossel usando a API do Embla (`scrollTo`, `selectedScrollSnap`)
- Setas posicionadas nas laterais do carrossel

