

# Plano: Campo editavel de recursos/beneficios nos planos

## Problema
Os cards de planos (landing page, admin, assinatura) mostram apenas fichas/mes e corretores de forma hardcoded. O admin nao consegue personalizar os itens listados no card de cada plano.

## Solucao
Adicionar uma coluna `recursos_texto` (text, nullable) na tabela `planos` que armazena uma lista de beneficios customizados, um por linha. O admin edita como texto livre no dialog de edicao. Os cards renderizam cada linha como um item com check.

## Etapa 1 — Migration

Adicionar coluna `recursos_texto` (text, nullable) na tabela `planos`.

```sql
ALTER TABLE public.planos ADD COLUMN recursos_texto text;
```

Sem RLS adicional (planos ja tem policies).

## Etapa 2 — AdminPlanos.tsx

- Adicionar `recursos_texto` ao form e interfaces
- Novo campo Textarea no dialog: "Recursos/Beneficios (um por linha)"
- Placeholder: "Ex: PDF basico\nSuporte por email\nSem anuncios"

## Etapa 3 — Renderizar nos cards

Em todos os pontos que listam features dos planos, alem dos itens hardcoded (fichas/mes, corretores), renderizar cada linha de `recursos_texto` como item com check:

| Arquivo | Onde aparece |
|---------|-------------|
| `src/pages/admin/AdminPlanos.tsx` | Cards no painel admin |
| `src/pages/Index.tsx` | Landing page publica |
| `src/pages/CorretorAssinatura.tsx` | Tela de assinatura do corretor |
| `src/pages/empresa/EmpresaAssinatura.tsx` | Tela de assinatura da imobiliaria |
| `src/pages/auth/RegistroConstrutora.tsx` | Registro de construtora |

Logica de renderizacao:
```ts
{plano.recursos_texto?.split('\n').filter(Boolean).map((linha, i) => (
  <li key={i} className="flex items-center gap-2">
    <Check className="h-4 w-4 text-primary" />
    {linha.trim()}
  </li>
))}
```

## Resultado
O super admin pode escrever livremente os beneficios de cada plano (ex: "PDF basico", "Suporte prioritario", "Integracao WhatsApp") e eles aparecem automaticamente em todos os cards do sistema.

