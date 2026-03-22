

## Criar página pública "Como Usar" com vídeos tutoriais

### Mudanças

| Arquivo | O que fazer |
|---------|------------|
| `src/pages/Tutoriais.tsx` | Nova página seguindo o padrão visual de `ComoFunciona.tsx` — header sticky com logo + voltar, título, grid de cards de vídeo (placeholder "Em breve"), footer |
| `src/App.tsx` | Adicionar rota pública `/tutoriais` com import da página |
| `src/pages/Index.tsx` | Adicionar link "Tutoriais" no menu do header e footer da landing |

### Estrutura da página

- SEOHead com título "Tutoriais — VisitaProva"
- Header sticky com LogoIcon + botão "Voltar" (link para `/`)
- Título "Como Usar" + subtítulo "Aprenda a usar a plataforma com nossos vídeos tutoriais"
- Grid responsivo (1 col mobile, 2 cols desktop) pronto para receber cards de vídeo
- Placeholder inicial: card com ícone e texto "Em breve novos tutoriais serão adicionados aqui"
- Footer com ano atual

Após implementação, você envia os vídeos e eu adiciono cada um como card com título, `<video>` e descrição.

