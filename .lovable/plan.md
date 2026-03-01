

## Plano: Enviar WhatsApp de Boas-Vindas no Cadastro

### Contexto
Existem 3 pontos de cadastro que precisam enviar a mensagem:
1. **`registro-corretor-autonomo/index.ts`** — tem o telefone do corretor disponível (`corretor.telefone`)
2. **`registro-imobiliaria/index.ts`** — tem o telefone da imobiliária (`imobiliaria.telefone`), mas não do admin diretamente
3. **`AceitarConvite.tsx`** (frontend) — cadastro via convite, não passa por edge function de registro

### Alterações

#### 1. `supabase/functions/registro-corretor-autonomo/index.ts`
Após o bloco de envio de email de boas-vindas (linha ~386), adicionar envio de WhatsApp não-bloqueante:
- Verificar se `corretor.telefone` existe
- Invocar `send-whatsapp` com `action: 'send-text'`, `channel: 'default'`, e a mensagem formatada com `{nome}` substituído por `corretor.nome`

#### 2. `supabase/functions/registro-imobiliaria/index.ts`
Após o log "Registration completed successfully" (linha ~254), antes do return:
- Verificar se `imobiliaria.telefone` existe
- Invocar `send-whatsapp` com `action: 'send-text'`, `channel: 'default'`, e a mensagem formatada com `{nome}` substituído por `admin.nome`

#### 3. Mensagem (hardcoded nas edge functions)
```
Seja bem-vindo {nome} ao Visita Prova – Sistema de Segurança para Visitas Imobiliárias.

Seu acesso já está ativo e pronto para uso.

A partir de agora, você pode registrar e validar suas visitas com mais organização, controle e proteção operacional.

Nosso objetivo é oferecer mais segurança ao corretor e mais profissionalismo ao processo de atendimento.

📌 Importante:
Caso precise de ajuda, tirar dúvidas ou receber orientação sobre o uso do sistema, este mesmo canal funciona como suporte oficial.

Basta enviar sua mensagem que nossa equipe irá te auxiliar.

Conte conosco para elevar o padrão das suas visitas.
```

#### Padrão de chamada (ambas as functions)
```typescript
try {
  const whatsResponse = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: JSON.stringify({
      action: 'send-text',
      phone: telefone,
      message: mensagemBoasVindas,
      channel: 'default',
    }),
  });
} catch (whatsErr) {
  console.error("Error sending welcome WhatsApp:", whatsErr);
}
```

Ambos são não-bloqueantes — falha no WhatsApp não impede o cadastro.

