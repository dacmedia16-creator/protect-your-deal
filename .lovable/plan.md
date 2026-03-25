

## Adicionar Toggle "Exibir no Site" nos Planos

### Contexto
Atualmente, o campo `ativo` controla se o plano aparece para cadastro e no site. O pedido é ter um controle separado para visibilidade no site público (landing page), independente do plano estar ativo.

### Mudanças

**1. Migração de banco de dados**
- Adicionar coluna `exibir_no_site` (boolean, default `true`) na tabela `planos`

```sql
ALTER TABLE public.planos ADD COLUMN exibir_no_site boolean NOT NULL DEFAULT true;
```

**2. AdminPlanos.tsx — Form e UI**
- Adicionar `exibir_no_site` ao `PlanoForm` interface e `defaultForm`
- Adicionar um novo Switch "Exibir no site" no formulário de edição/criação (ao lado do switch "Plano ativo")
- Mostrar um badge "Oculto no site" nos cards dos planos quando `exibir_no_site = false`

**3. Páginas públicas — Filtrar por `exibir_no_site`**
- `src/pages/Index.tsx` — adicionar `.eq('exibir_no_site', true)` na query de planos
- `src/pages/auth/RegistroCorretorAutonomo.tsx` — idem
- `src/pages/auth/RegistroImobiliaria.tsx` — idem

**4. Páginas internas de assinatura (manter sem filtro)**
- `CorretorAssinatura.tsx` e `EmpresaAssinatura.tsx` já filtram por `ativo` — adicionar também `.eq('exibir_no_site', true)` para consistência

### Resultado
O admin poderá manter um plano ativo (assinaturas existentes funcionam) mas ocultá-lo do site público e das telas de registro/assinatura.

