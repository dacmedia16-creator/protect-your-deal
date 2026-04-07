

# Página Pessoal Denis Souza — /denis

## Resumo
Criar uma página institucional/pessoal premium na rota `/denis`, reutilizando os padrões visuais de `NossaHistoria.tsx` e `SobreNos.tsx`. A página não será adicionada a nenhum menu ou navegação visível.

## Arquivos a criar/modificar

### 1. Criar `src/pages/Denis.tsx`
Página completa com 9 seções, usando os mesmos componentes e padrões do projeto:
- `SEOHead`, `AnimatedSection`, `LogoIcon`, `Button`, `WhatsAppFAB`
- Fotos: `DenisfotoBanner.png` (hero) e `ceo-photo.png` (seção alternativa)
- Ícones Lucide para evidências, timeline e cards
- Design consistente: `glass`, `gradient-primary`, `font-display`, `shadow-soft`, mesmas paletas de cores

**Estrutura das seções:**

1. **Header** — sticky, com botão voltar e logo (mesmo padrão de NossaHistoria)
2. **Hero** — foto grande do Denis, nome em destaque, headline de autoridade ("Corretor de imóveis | Fundador do Visita Prova"), subtítulo profissional, badges com 8 anos / R$60M VGV / VIP7 Imóveis, fundo com gradient e blur decorativo
3. **Minha Trajetória** — timeline vertical com etapas: início no mercado, REMAX (expansão, franqueado, Team Leader), campeão de vendas 2x, R$2M em comissões, fundação VIP7
4. **A dor que o mercado não vê** — seção emocional com frases destacadas em cards premium, quote block "Não basta trabalhar duro. É preciso ter como provar."
5. **A história que deu origem ao Visita Prova** — storytelling em blocos sequenciais: imóvel R$4,5M → captação → quase 1 ano → silêncio → bloqueio → traição
6. **Não foi só uma comissão perdida** — impacto emocional/financeiro em cards, stats visuais (1 ano, R$20mil, ~3 anos)
7. **O problema não acabou ali** — grid de ícones com tudo que precisou reunir (WhatsApp, áudios, vídeos, cartório, advogado etc.), resultado do processo
8. **Foi por isso que o Visita Prova nasceu** — seção manifesto, visual forte, quote "Porque não basta trabalhar duro. É preciso ter como provar."
9. **CTA final** — encerramento humano e confiante, botões para conhecer o Visita Prova e falar no WhatsApp, footer premium

### 2. Modificar `src/routes/publicRoutes.tsx`
- Adicionar `const Denis = lazy(() => import("@/pages/Denis"));`
- Adicionar `<Route path="/denis" element={<Denis />} />`
- Posicionar antes do `*` catch-all

## Decisões técnicas
- Reutilizar `AnimatedSection` para todas as animações (scroll-reveal com fade/slide)
- Usar as duas fotos existentes (`DenisfotoBanner.png` no hero, `ceo-photo.png` na trajetória)
- Não adicionar link em nenhum menu, footer ou navegação existente
- Todo conteúdo textual fornecido será incluído na íntegra, organizado visualmente em blocos
- Responsivo via grid/flex com breakpoints md/lg padrão do projeto

