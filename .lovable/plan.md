

## Criar Landing Page `/afiliados` — Programa de Afiliados Premium

### Resumo

Criar uma página pública `/afiliados` com design premium dark, mostrando o programa de afiliados com mercado, plano de ganhos, simulação com 100 clientes, e CTA para WhatsApp.

### Mudanças

| Arquivo | O que fazer |
|---------|------------|
| `src/pages/Afiliados.tsx` | Criar página completa com todas as 6 seções descritas |
| `src/App.tsx` | Adicionar rota pública `/afiliados` apontando para a nova página |

### Estrutura da página (seções)

1. **Header** — Logo + link "Voltar ao início" (mesmo padrão de `/como-funciona`)
2. **Hero** — "GANHE DINHEIRO INDICANDO" + subtítulo + ícone Rocket
3. **Mercado** — Cards com stats (47k imobiliárias, 600k corretores)
4. **Plano de Ganhos** — 2 cards (10% direto, 5% indireto) + badge "Comissão Vitalícia"
5. **Simulação 100 Clientes** — 3 cenários (conservador, misto, rede 2º nível) com valores em verde
6. **Tabela de Planos** — Mini cards com valores dos 3 planos
7. **CTA Final** — Botão WhatsApp + logo + URL

### Design

- Fundo: gradiente `from-[#0F172A] to-[#1E3A5F]`
- Texto: branco, valores em verde `#38A169`
- Cards: `bg-white/5 backdrop-blur border border-white/10 rounded-2xl`
- Destaques numéricos: `text-4xl font-bold text-green-400`
- Animações: `AnimatedSection` para reveal on scroll
- Mobile-first, responsivo com grid `md:grid-cols-2`

### Componentes reutilizados

- `SEOHead`, `LogoIcon`, `AnimatedSection`, `Button`
- Ícones Lucide: `Rocket`, `Building2`, `Users`, `TrendingUp`, `Zap`, `Crown`, `MessageCircle`

