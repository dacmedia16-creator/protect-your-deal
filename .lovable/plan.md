

## Criar Página "Sobre Nós"

### Resumo
Criar uma página institucional `/sobre` com a história do VisitaProva, seguindo o mesmo padrão visual das páginas `ParaImobiliarias` e `Funcionalidades` (header com logo, `AnimatedSection`, footer).

### Mudanças

| Arquivo | O que fazer |
|---------|------------|
| `src/pages/SobreNos.tsx` | Criar página com as seções abaixo |
| `src/App.tsx` | Importar `SobreNos` e adicionar rota pública `/sobre` |
| `src/pages/Index.tsx` | Adicionar link "Sobre" no footer da landing (junto com Funcionalidades, Como Funciona, etc.) |

### Estrutura da página

1. **Header** — Logo + "Voltar ao início" (mesmo padrão das outras páginas institucionais)

2. **Hero institucional** — Frase de impacto:
   > "O Visita Prova nasceu para transformar a visita imobiliária em um processo mais profissional, organizado e protegido."
   Subtítulo curto sobre experiência real do mercado.

3. **História real** — Seção narrativa com a vivência do fundador: o caso de perda de R$ 240 mil, a batalha judicial, os R$ 20 mil gastos, e como essa dor originou a solução. Estilo editorial com destaque visual para citações/números.

4. **Por que existimos** — Card ou bloco destacado explicando a fragilidade da visita imobiliária e a missão de profissionalizar esse momento.

5. **O que o Visita Prova faz de verdade** — Grid com 4 cards de benefícios:
   - Mais profissionalismo
   - Mais organização
   - Mais proteção operacional
   - Mais prevenção de problemas

6. **Nossa visão** — Seção sobre a evolução do mercado, educação das partes (corretor, imobiliária, comprador/vendedor). Ícones com check para cada público.

7. **O que acreditamos** — Lista de crenças/valores com ícones.

8. **Nossa missão** — Bloco de destaque final com a missão e CTA "Testar Grátis Agora" → `/registro-autonomo?plano=gratuito`

9. **Footer** — Logo + site (mesmo padrão)

### Estilo
- Fundo claro com seções alternadas (`bg-muted/30`)
- `AnimatedSection` para scroll animations
- Cards com `bg-card border rounded-xl`
- Destaques numéricos (R$ 240 mil, 3 anos, R$ 20 mil) com cor `text-primary` e tamanho grande
- Citações em bloco com borda lateral `border-l-4 border-primary`

