

# Fix: Pesquisa pós-visita não enviada automaticamente para construtoras

## Causa raiz

A função `verify-otp` (que dispara o envio automático) e `create-survey` (criação manual) verificam a feature flag `post_visit_survey` apenas em duas tabelas:
- `imobiliaria_feature_flags` (se a ficha tem `imobiliaria_id`)
- `user_feature_flags` (se não tem imobiliária)

Fichas de construtora têm `construtora_id` preenchido, mas a tabela `construtora_feature_flags` nunca é consultada. Resultado: a flag habilitada para Planeta é ignorada.

## Solução

Adicionar verificação de `construtora_feature_flags` nos dois arquivos:

### 1. `supabase/functions/verify-otp/index.ts` (linhas 254-272)

Após checar `imobiliaria_feature_flags`, se ainda `featureEnabled === false` e `ficha.construtora_id` existe, consultar `construtora_feature_flags`:

```
if (!featureEnabled && ficha.construtora_id) {
  const { data: flag } = await supabase
    .from('construtora_feature_flags')
    .select('enabled')
    .eq('construtora_id', ficha.construtora_id)
    .eq('feature_key', 'post_visit_survey')
    .maybeSingle();
  featureEnabled = flag?.enabled === true;
}
```

### 2. `supabase/functions/create-survey/index.ts` (linhas 68-95)

Adicionar um `else if` para `ficha.construtora_id` consultando `construtora_feature_flags`, entre o bloco de imobiliária e o de corretor autônomo.

### Arquivos alterados
- `supabase/functions/verify-otp/index.ts`
- `supabase/functions/create-survey/index.ts`

### Resultado
Fichas vinculadas a construtoras com a flag `post_visit_survey` habilitada passarão a enviar a pesquisa automaticamente via WhatsApp após confirmação do comprador.

