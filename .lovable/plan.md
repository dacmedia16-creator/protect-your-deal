

## Plano: Corrigir envio de teste Meta 1 e Meta 2 no AdminConfiguracoes

### Problema
O envio de teste para canais Meta falha porque falta o parâmetro `buttonUrlDynamicParams` no body da requisição. O template `visita_prova_2` da Meta exige esse parâmetro para o botão CTA "Confirmar Visita".

### Alteração em `src/pages/admin/AdminConfiguracoes.tsx`

Na função `sendTestMessage`, adicionar `buttonUrlDynamicParams: ['confirmar/teste-123']` ao body dos canais `meta` e `meta2`, alinhando com a implementação funcional da página `/integracoes`.

**De:**
```typescript
{ action: 'send-template', phone, templateName: 'visita_prova_2', templateParams: { ... }, language: 'pt_BR', channel }
```

**Para:**
```typescript
{ action: 'send-template', phone, templateName: 'visita_prova_2', templateParams: { ... }, buttonUrlDynamicParams: ['confirmar/teste-123'], language: 'pt_BR', channel }
```

