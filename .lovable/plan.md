

## Plano: Usar remetente noreply@visitaprova.com.br nos emails de afiliados

### Alteração

**`supabase/functions/admin-criar-acesso-afiliado/index.ts`**

Adicionar o campo `from_email: "noreply@visitaprova.com.br"` no body da chamada `send-email`, tanto para novos usuários (email com senha temporária) quanto para usuários existentes (email de ativação). A edge function `send-email` já suporta o parâmetro `from_email` para selecionar o remetente.

Nas duas chamadas `fetch` existentes para `send-email`, adicionar:
```json
"from_email": "noreply@visitaprova.com.br"
```

### Resultado
Todos os emails enviados a afiliados (criação de acesso e ativação) virão do remetente **noreply@visitaprova.com.br** (VisitaProva).

