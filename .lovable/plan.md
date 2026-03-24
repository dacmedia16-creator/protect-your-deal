

## Criar Página Dedicada "Para Imobiliárias"

### Resumo
Criar uma página standalone `/para-imobiliarias` seguindo o mesmo estilo da página `/afiliados` (dark gradient, AnimatedSection), focada em converter donos de imobiliárias. A seção existente na landing continuará como preview, com o CTA agora linkando para essa nova página.

### Mudanças

| Arquivo | O que fazer |
|---------|------------|
| `src/pages/ParaImobiliarias.tsx` | Criar página dedicada com as seções abaixo |
| `src/App.tsx` | Adicionar rota pública `/para-imobiliarias` |
| `src/pages/Index.tsx` | Atualizar CTA da seção "Para Imobiliárias" para linkar para `/para-imobiliarias` em vez de `/registro/tipo` |

### Estrutura da página `/para-imobiliarias`

1. **Header** — Logo + "Voltar ao início" (mesmo padrão da página Afiliados)

2. **Hero** — Badge "Para Imobiliárias" + título impactante: "Gestão completa e segurança jurídica para sua imobiliária" + subtítulo + CTA "Cadastrar minha Imobiliária" → `/registro/tipo`

3. **Problemas** — "Os riscos de não ter controle digital"
   - Corretor sai e leva os clientes
   - Sem prova de quem atendeu qual cliente
   - Visitas sem rastreabilidade

4. **Argumentos principais** — 2 cards destacados:
   - "Controle em tempo real" — saber quais clientes sua equipe está atendendo
   - "Proteção do histórico" — histórico fica com a empresa, não com o corretor

5. **Funcionalidades para gestão** — Grid com benefícios específicos para imobiliárias:
   - Dashboard com visão geral da equipe
   - Relatórios por corretor
   - Gestão de equipes
   - Pesquisa de satisfação pós-visita

6. **Como funciona** — Passos simplificados para a imobiliária

7. **CTA Final** — "Cadastre sua Imobiliária" → `/registro/tipo`

8. **Footer** — Logo + site

### Estilo
- Mesmo visual dark gradient da página Afiliados (`bg-gradient-to-b from-[#0F172A] to-[#1E3A5F] text-white`)
- `AnimatedSection` para animações de scroll
- Cards com `bg-white/5 backdrop-blur border border-white/10`
- Cor de destaque: `#60A5FA` (azul) para consistência

