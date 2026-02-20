

# SEO e Meta Tags - Otimização para Google

## Problema Atual

A landing page e demais páginas públicas dependem apenas das meta tags genéricas do `index.html`. Isso significa que:
- Todas as páginas mostram o mesmo titulo e descrição no Google
- Palavras-chave importantes para corretores não estão presentes
- Páginas como "Funcionalidades" e "Como Funciona" não têm títulos únicos
- Não há dados estruturados (Schema.org) para aparecer com destaque no Google

## Plano de Implementação

### 1. Hook `useDocumentTitle` em todas as páginas públicas

Adicionar títulos únicos e descritivos em cada página pública:

| Página | Titulo |
|--------|--------|
| Index (Landing) | VisitaProva - Comprove Visitas Imobiliárias com WhatsApp OTP |
| Funcionalidades | Funcionalidades - VisitaProva |
| Como Funciona | Como Funciona - VisitaProva |
| Instalar App | Baixar App - VisitaProva |
| Tour Audio | Tour em Áudio - VisitaProva |
| Termos de Uso | Termos de Uso - VisitaProva |
| Politica de Privacidade | Politica de Privacidade - VisitaProva |

### 2. Componente `SEOHead` com meta tags dinâmicas

Criar um componente reutilizável que atualiza `<title>`, `<meta name="description">` e `<meta property="og:*">` dinamicamente via DOM, já que o React SPA não tem server-side rendering.

### 3. Melhorar meta tags do `index.html`

Otimizar as meta tags padrão com palavras-chave que corretores buscam no Google:
- **Title**: "VisitaProva - Comprove Visitas Imobiliárias | Ficha Digital com WhatsApp"
- **Description**: "Registre visitas imobiliárias com confirmação via WhatsApp. Ficha de visita digital, comprovante PDF com QR Code e prova de intermediação para corretores e imobiliárias."
- **Keywords**: ficha de visita digital, comprovante de visita imobiliária, prova de intermediação, corretor de imóveis, OTP WhatsApp

### 4. Dados estruturados (JSON-LD)

Adicionar Schema.org `SoftwareApplication` no `index.html` para que o Google entenda que é um produto SaaS imobiliário.

## Detalhes Técnicos

### Componente `SEOHead`
- Arquivo: `src/components/SEOHead.tsx`
- Recebe props: `title`, `description`, `keywords` (opcional)
- Usa `useEffect` para manipular as meta tags via `document.querySelector` e `document.title`
- Atualiza: title, meta description, og:title, og:description, twitter:title, twitter:description

### Alterações no `index.html`
- Title e description otimizados com palavras-chave de busca
- Adição de JSON-LD com Schema.org `SoftwareApplication`
- Keywords expandidas

### Páginas afetadas
- `src/pages/Index.tsx` - Landing page (titulo + description customizados)
- `src/pages/Funcionalidades.tsx`
- `src/pages/ComoFunciona.tsx`
- `src/pages/InstalarApp.tsx`
- `src/pages/TourAudioLanding.tsx`
- `src/pages/TermosDeUso.tsx`
- `src/pages/PoliticaPrivacidade.tsx`
- `src/pages/Auth.tsx`

Cada página receberá o componente `SEOHead` com titulo e descrição únicos.

