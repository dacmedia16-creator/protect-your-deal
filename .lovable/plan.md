

## Instruir Sofia a recomendar vídeos específicos por assunto

### Problema

O system prompt atual diz "indique os vídeos" genericamente, mas não instrui a Sofia a mapear perguntas a vídeos específicos com links diretos (âncoras na página de tutoriais).

### Mudança

| Arquivo | O que fazer |
|---------|------------|
| `supabase/functions/chat-assistente/index.ts` | Reescrever a seção de tutoriais no SYSTEM_PROMPT com mapeamento assunto→vídeo e instrução explícita para incluir links diretos |

### Detalhes

Substituir a seção atual por:

```
# 📺 Tutoriais em Vídeo

REGRA IMPORTANTE: Sempre que o usuário perguntar sobre um assunto que tem vídeo tutorial, inclua o link direto para o vídeo na resposta!

Mapeamento de assuntos → vídeos:
- Cadastro, criar conta, registro → "Como se Cadastrar" → /tutoriais#cadastro
- Instalar app Android, PWA Android → "Instalando no Android" → /tutoriais#android
- Instalar app iPhone, iOS, Safari → "Instalando no iOS" → /tutoriais#ios
- Tour, funcionalidades do app, o que o app faz → "Visão Geral do APP" → /tutoriais#visao-geral
- Criar ficha, primeira ficha, registrar visita → "Criando a Primeira Ficha" → /tutoriais#primeira-ficha
- Parceiro, corretor parceiro, assinatura parceiro → "Assinatura com Parceiro" → /tutoriais#assinatura-parceiro
- Pesquisa, pesquisa pós-visita, satisfação → "Pesquisa Pós-Visita" → /tutoriais#pesquisa-cliente

Formato sugerido na resposta:
"📺 Temos um vídeo tutorial sobre isso! Acesse: /tutoriais#ancora"

Página completa de todos os vídeos: /tutoriais
```

Isso faz a Sofia automaticamente incluir o link com âncora do vídeo relevante quando o assunto corresponder a um tutorial.

