
# Correção: Link "Acessar Minha Conta" não funciona no email de boas-vindas

## Problema Identificado

O botão "Acessar Minha Conta" no email de boas-vindas está mostrando `[{link}]` ao invés de uma URL clicável porque a variável `{link}` **não está sendo passada** ao template.

### Diagnóstico Técnico

**Template de email (`boas_vindas`) espera:**
```html
<a href="{link}" style="...">Acessar Minha Conta</a>
```

**Variáveis que estão sendo passadas (linhas 357-360 da edge function):**
```typescript
variables: {
  nome: corretor.nome,  // ✅ Usado no template
  email: corretor.email, // ❌ Não usado no template
}
// ❌ {link} NÃO está sendo passado!
```

**Resultado:** A função `replaceVariables()` no `send-email` não encontra a variável `{link}` e deixa o texto literal no HTML.

---

## Solução

Adicionar a variável `link` ao objeto `variables` na edge function `registro-corretor-autonomo`, apontando para a página de login do VisitaProva.

### Mudança no arquivo

**Arquivo:** `supabase/functions/registro-corretor-autonomo/index.ts`

**Localização:** Linhas 353-361

**De:**
```typescript
const emailPayload = {
  action: 'send-template',
  to: corretor.email,
  template_tipo: 'boas_vindas',
  variables: {
    nome: corretor.nome,
    email: corretor.email,
  }
};
```

**Para:**
```typescript
const emailPayload = {
  action: 'send-template',
  to: corretor.email,
  template_tipo: 'boas_vindas',
  variables: {
    nome: corretor.nome,
    email: corretor.email,
    link: 'https://visitaprova.com.br/auth',
  }
};
```

---

## Por que usar `/auth` ao invés de `/`?

| URL | Comportamento |
|-----|---------------|
| `/auth` | Página de login - usuário pode entrar diretamente |
| `/` | Landing page - requer clique extra para acessar login |

Como o email é para um usuário recém-cadastrado que precisa fazer login, `/auth` é o destino mais adequado.

---

## Impacto

- ✅ Link do botão funcionará corretamente
- ✅ Não afeta outros templates de email
- ✅ Consistente com o domínio principal `visitaprova.com.br`
- ✅ Após correção, novos cadastros receberão emails com links funcionais
