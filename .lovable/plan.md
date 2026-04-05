

# Diagnóstico e Correção: Flicker na Navegação Admin

## Causa Raiz

O flicker acontece porque **cada página admin renderiza sua própria instância de `SuperAdminLayout`**. Ao navegar de `/admin/usuarios` para `/admin/planos`:

1. React desmonta completamente a página antiga (incluindo o sidebar, header mobile, queries, realtime subscriptions)
2. Monta uma nova instância de `ProtectedRoute` (que pode piscar o loading se auth/role states oscilarem)
3. Monta uma nova instância de `SuperAdminLayout` (reinicializa sidebar state, 3 queries, 4 subscriptions realtime)
4. `Suspense` mostra `PageLoader` enquanto carrega o chunk lazy

O resultado: **a tela inteira pisca** porque sidebar + header + conteudo sao todos desmontados e remontados.

O mesmo problema afeta `ImobiliariaLayout` (empresa) e `ConstutoraLayout` (construtora) — cada página renderiza o layout internamente.

## Arquivos Envolvidos

- `src/routes/adminRoutes.tsx` — cria N instancias de ProtectedRoute
- `src/routes/empresaRoutes.tsx` — idem
- `src/routes/construtoraRoutes.tsx` — idem
- `src/components/layouts/SuperAdminLayout.tsx` — layout que é remontado
- `src/components/layouts/ImobiliariaLayout.tsx` — idem
- `src/components/layouts/ConstutoraLayout.tsx` — idem
- 27 páginas admin, 10 páginas empresa, 11 páginas construtora (todas importam e renderizam o layout)

## Correção

Usar o padrão de **layout route** do React Router: renderizar `ProtectedRoute` + Layout UMA VEZ como rota pai, e as páginas como rotas filhas via `<Outlet />`.

### Etapa 1 — Modificar os 3 layouts para suportar `Outlet`

Cada layout passa a aceitar `children` OU renderizar `<Outlet />` quando não há children:

```tsx
// SuperAdminLayout.tsx
import { Outlet } from 'react-router-dom';

export function SuperAdminLayout({ children }: { children?: ReactNode }) {
  // ... todo o layout existente ...
  <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
    <div className="p-4 lg:p-8">
      {children || <Outlet />}
    </div>
  </main>
}
```

Mesma mudança em `ImobiliariaLayout` e `ConstutoraLayout`.

### Etapa 2 — Reestruturar as rotas para usar layout route

```tsx
// adminRoutes.tsx
import { Outlet } from 'react-router-dom';

// Layout wrapper renderizado UMA VEZ
const AdminLayout = () => (
  <ProtectedRoute allowedRoles={['super_admin']}>
    <SuperAdminLayout>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </SuperAdminLayout>
  </ProtectedRoute>
);

export const adminRoutes = (
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<AdminDashboard />} />
    <Route path="imobiliarias" element={<AdminImobiliarias />} />
    <Route path="imobiliarias/nova" element={<AdminNovaImobiliaria />} />
    <Route path="imobiliarias/:id" element={<AdminDetalhesImobiliaria />} />
    {/* ... todas as sub-rotas ... */}
  </Route>
);
```

Mesma estrutura para `empresaRoutes.tsx` e `construtoraRoutes.tsx`.

### Etapa 3 — Remover `<SuperAdminLayout>` de dentro de cada página

Em todas as 27 páginas admin, 10 empresa e 11 construtora:
- Remover o import do layout
- Remover o `<SuperAdminLayout>` / `<ImobiliariaLayout>` / `<ConstutoraLayout>` que envolve o conteudo
- Manter apenas o conteudo interno (o `<div className="space-y-6">` etc.)

Exemplo — AdminDashboard.tsx:
```tsx
// ANTES
return (
  <SuperAdminLayout>
    <div className="space-y-6">...</div>
  </SuperAdminLayout>
);

// DEPOIS
return (
  <div className="space-y-6">...</div>
);
```

### Etapa 4 — Tratar loading states internos

Páginas que têm loading states renderizando o layout (ex: `if (loading) return <SuperAdminLayout><Skeleton /></SuperAdminLayout>`) passam a retornar apenas o skeleton:
```tsx
if (loading) return <div className="space-y-6"><Skeleton ... /></div>;
```

## Resultado Esperado

- O sidebar, header mobile, queries e subscriptions realtime do layout permanecem montados durante toda a navegação
- Apenas o conteudo da área principal troca, com um breve `PageLoader` se o chunk ainda não foi carregado
- Zero flicker visual
- Sem mudança de UX

## Telas para Testar

1. Navegar entre todas as opções do sidebar admin (Dashboard → Imobiliárias → Planos → Usuarios → etc.)
2. Navegar entre opções do painel empresa (Dashboard → Corretores → Fichas → etc.)
3. Navegar entre opções do painel construtora
4. Verificar que o sidebar mantém o item ativo correto
5. Verificar que badges do sidebar continuam atualizando em tempo real
6. Testar em mobile (sidebar abre/fecha sem piscar)
7. Verificar que sign-out funciona normalmente

## Risco

- **Baixo-médio**: a mudança é mecânica (remover wrapper de 48 arquivos), mas o volume exige atenção para não esquecer nenhum arquivo
- Não altera lógica de negócio, auth ou queries
- Preserva toda a UX existente

