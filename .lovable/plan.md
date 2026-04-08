

# Alterar bodyParams para nomes de variáveis no template `pesquisa_pos_visita`

## Mudança

### `supabase/functions/verify-otp/index.ts` (linhas 347-351)

**De:**
```typescript
templateParams: {
  '1': ficha.comprador_nome || 'Cliente',
  '2': ficha.imovel_endereco || 'imóvel visitado',
  '3': 'Sua opinião nos ajuda a melhorar!',
},
```

**Para:**
```typescript
templateParams: {
  'nome': ficha.comprador_nome || 'Cliente',
  'imovel': ficha.imovel_endereco || 'imóvel visitado',
  'lembrete': 'Sua opinião nos ajuda a melhorar!',
},
```

## Resultado na API ZionTalk
- `bodyParams[nome]` → nome do comprador
- `bodyParams[imovel]` → endereço do imóvel
- `bodyParams[lembrete]` → texto de incentivo

## Escopo
- 1 arquivo, 3 linhas alteradas
- Redeploy automático
- Os nomes precisam corresponder exatamente aos configurados no template ZionTalk/Meta

