

## Plano: Landing Page Premium — História do Fundador

### Resumo
Criar uma nova página `/nossa-historia` com 13 seções narrativas premium, seguindo a estrutura e copy exatos do briefing. A página será independente da landing principal (`Index.tsx`) e terá estética SaaS de alto padrão.

### Arquivos a criar/editar

**1. `src/pages/NossaHistoria.tsx`** (~800-1000 linhas)
Página completa com todas as 13 seções do briefing. Componentes internos para manter tudo coeso:

- **Hero**: Headline emocional + bloco de números (R$200mil, R$20mil, 1 ano, 3 anos) com estética de "authority component" (glassmorphism + bordas sutis)
- **Seção Fundador**: Layout editorial com foto do CEO (`ceo-photo.png`), aspas grandes, assinatura visual
- **Timeline Narrativa**: Blocos sequenciais com ritmo visual (ícones numerados, linhas conectoras)
- **Seção Dor/Impacto**: Frase em destaque com tipografia grande, fundo sutil escuro
- **Seção Provas**: Grid premium de ícones (WhatsApp, áudios, fotos, cartório, advogado etc.)
- **Seção Injustiça**: Mini-cards com status ("Ganhei a ação", "Ainda não recebi", "Contas bloqueadas", "Paguei antes de receber")
- **Virada/Insight**: Transição visual clara — frase central em destaque
- **Origem do Produto**: Cards premium de benefícios (6 cards com ícones)
- **Comparativo**: Duas colunas (Sem formalização vs Com Visita Prova) com ícones ✗/✓
- **Propósito**: Frase final forte do fundador
- **Prova Social**: `DepoimentosSection` existente + placeholders para logos e métricas
- **CTA Final**: Background gradient, dois botões
- **Footer Premium**: Logo, links institucionais, WhatsApp, redes, termos/privacidade

### Componentes reutilizados
- `SEOHead`, `AnimatedSection`, `LogoIcon`, `Button`, `Card`, `DepoimentosSection`, `WhatsAppFAB`
- Foto do CEO: `import ceoPhoto from "@/assets/ceo-photo.png"`

### Design e estilo
- **Tipografia**: `Plus Jakarta Sans` (headings), `Inter` (body) — já configurados
- **Cores**: Paleta existente (primary blue `#2563EB`, slate `#0F172A`, muted backgrounds)
- **Espaçamento**: `py-20 md:py-28` entre seções para respiração premium
- **Animações**: `AnimatedSection` com delays escalonados por seção
- **Cards de números**: `backdrop-blur-sm bg-card/80 border border-border/50` (classe `.glass` existente)
- **Frases de destaque**: `text-2xl md:text-3xl font-heading` com `border-l-4 border-primary`
- **Comparativo**: Grid 2 colunas com fundo vermelho sutil (sem) vs verde sutil (com)
- **Dark mode**: Totalmente suportado via variáveis CSS existentes
- **Mobile**: Stack vertical em todas as seções, tipografia responsiva

### Rota
**2. `src/App.tsx`** — Adicionar rota:
```
<Route path="/nossa-historia" element={<NossaHistoria />} />
```

### Links de navegação
- CTAs "Quero proteger minhas visitas" → `/registro-autonomo`
- "Entender como funciona" → `/como-funciona`
- "Falar com a equipe" → WhatsApp link existente
- Footer links → `/termos-de-uso`, `/politica-privacidade`, `/funcionalidades`

### Performance
- Sem dependências novas — usa apenas componentes e libs já instalados
- Imagens lazy-loaded
- Seções animadas via IntersectionObserver (já implementado em `AnimatedSection`)

