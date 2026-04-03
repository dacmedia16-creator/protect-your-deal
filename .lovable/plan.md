

## Abrir link de pagamento em nova aba

### Alteração
Nos 3 arquivos de assinatura, trocar `window.location.href` por `window.open(..., '_blank')` para que o link de pagamento abra em uma nova aba/janela:

**Arquivos:**
- `src/pages/CorretorAssinatura.tsx` (linha 125)
- `src/pages/empresa/EmpresaAssinatura.tsx` (linha 129)
- `src/pages/construtora/ConstutoraAssinatura.tsx` (linha 94)

**De:**
```typescript
window.location.href = data.paymentLinkUrl;
```

**Para:**
```typescript
window.open(data.paymentLinkUrl, '_blank');
```

O usuário permanece na página de assinatura enquanto o pagamento abre em outra aba.

