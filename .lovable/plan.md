

## Atualizar a Sofia com tutoriais em vídeo e recursos atualizados

### Objetivo

Adicionar ao system prompt da Sofia o conhecimento sobre a página de tutoriais em vídeo, a página "Como Funciona" com vídeo demo, Tour de Áudio, Demo Animado, e a página AppLanding. Também adicionar contexto e quick replies para as rotas dessas páginas.

### Mudanças

| Arquivo | O que fazer |
|---------|------------|
| `supabase/functions/chat-assistente/index.ts` | Adicionar seção no SYSTEM_PROMPT sobre tutoriais em vídeo e páginas informativas |
| `src/components/ChatAssistente.tsx` | Adicionar entradas no `PAGE_CONTEXT_MAP` para `/tutoriais`, `/como-funciona`, `/funcionalidades`, `/tour-audio`, `/demo` |

### Detalhes do System Prompt (nova seção)

Adicionar após "Informações Técnicas" uma seção:

```
# 📺 Tutoriais em Vídeo

O VisitaProva tem uma página completa de tutoriais em vídeo em /tutoriais.
Sempre que alguém tiver dúvida sobre como usar o sistema, indique os vídeos!

Vídeos disponíveis:
1. Como se Cadastrar - Passo a passo do cadastro na plataforma
2. Instalando o App no Android - Como instalar o PWA no Android
3. Instalando o App no iOS (iPhone) - Como instalar no Safari
4. Visão Geral do APP - Tour por todas as funcionalidades
5. Criando a Primeira Ficha de Visita - Como criar seu primeiro registro
6. Assinatura com Corretor Parceiro - Como funciona a parceria
7. Pesquisa Pós-Visita para o Cliente - Como funciona a pesquisa de satisfação

# 📄 Páginas Informativas

- /como-funciona - Página com vídeo demo e os 4 passos do sistema
- /funcionalidades - Lista completa de funcionalidades com mockups
- /tutoriais - Hub de vídeos tutoriais
- /tour-audio - Tour narrado com áudio gerado por IA
- /demo - Demonstração animada interativa do sistema
- /app - Página de instalação rápida do app
```

### Detalhes do PAGE_CONTEXT_MAP (novas entradas)

```typescript
'/tutoriais': {
  context: 'Página de tutoriais em vídeo',
  quickReplies: ['Qual vídeo assistir primeiro?', 'Como criar minha primeira ficha?', 'Como instalar o app?']
},
'/como-funciona': {
  context: 'Página explicativa com vídeo demo e 4 passos',
  quickReplies: ['Quero criar minha conta', 'Como funciona o OTP?', 'Ver funcionalidades']
},
'/funcionalidades': {
  context: 'Página de funcionalidades do VisitaProva',
  quickReplies: ['Qual plano escolher?', 'Criar conta grátis', 'Como funciona a parceria?']
},
'/tour-audio': {
  context: 'Tour narrado com áudio sobre o VisitaProva',
  quickReplies: ['Quero testar o sistema', 'Ver tutoriais em vídeo', 'Criar conta grátis']
},
'/demo': {
  context: 'Demonstração animada do sistema',
  quickReplies: ['Quero criar minha conta', 'Ver tutoriais em vídeo', 'Falar com suporte']
}
```

