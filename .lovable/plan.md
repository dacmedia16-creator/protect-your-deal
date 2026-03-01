

## Plano: Acrescentar frase na mensagem de boas-vindas

### Alteração
Adicionar a frase **"Importante: salve esse contato na sua agenda agora."** na mensagem de boas-vindas do WhatsApp, logo após o bloco "📌 Importante:".

### Mensagem atualizada
A seção "📌 Importante:" ficará assim:
```
📌 Importante:
Salve esse contato na sua agenda agora.
Caso precise de ajuda, tirar dúvidas ou receber orientação sobre o uso do sistema, este mesmo canal funciona como suporte oficial.
```

### Arquivos alterados
1. **`supabase/functions/registro-corretor-autonomo/index.ts`** (linha 391) — atualizar a string `mensagemBoasVindas`
2. **`supabase/functions/registro-imobiliaria/index.ts`** (linha 260) — atualizar a string `mensagemBoasVindas`

