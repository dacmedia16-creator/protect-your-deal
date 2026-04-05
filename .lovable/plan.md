

# Plano: Eliminar o "pisca" na navegação do admin/super admin

## Causa raiz

Dois fatores combinados causam o flash:

1. **Suspense com spinner de tela cheia**: Cada página admin é `lazy()` e envolvida por `<Suspense fallback={<LoadingSpinner />}>` no App.tsx. Ao trocar de rota, o React desmonta a página atual e mostra um spinner de tela inteira até o chunk carregar — isso é o "pisca" principal.

2. **ProtectedRoute recria o spinner**: O `ProtectedRoute` é instanciado por rota (via função `P()`), então a cada navegação ele re-renderiza. Se `roleLoading` piscar `true` momentaneamente, mostra outro spinner.

## Solução

### Etapa 1 — Mover o Suspense para DENTRO do layout

Em vez de envolver todas as rotas num único `<Suspense>` com spinner de tela cheia, colocar o fallback dentro do `SuperAdminLayout` (e dos outros layouts). Assim o sidebar permanece visível enquanto o conteúdo carrega.

**App.tsx**: Trocar o `<Suspense fallback={<LoadingSpinner />}>` que envolve `<Routes>` por `<Suspense fallback={null}>` (ou remover). O fallback real fica dentro de cada layout.

**adminRoutes.tsx**: Envolver cada elemento lazy com `<Suspense>` cujo fallback é um skeleton leve (spinner pequeno centralizado na área de conteúdo), não tela cheia.

Criar um componente `PageLoader` simples que é só um spinner na área de conteúdo (sem `min-h-screen`).

### Etapa 2 — Aplicar o mesmo padrão nos outros layouts

Repetir para `ImobiliariaLayout` (empresa), `ConstutoraLayout` (construtora), `AfiliadoLayout` (afiliado).

### Arquivos modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/App.tsx` | Trocar fallback do Suspense externo para `null` |
| `src/routes/adminRoutes.tsx` | Envolver cada lazy component com `<Suspense fallback={<PageLoader />}>` |
| `src/routes/empresaRoutes.tsx` | Idem |
| `src/routes/construtoraRoutes.tsx` | Idem |
| `src/routes/corretorRoutes.tsx` | Idem |
| `src/routes/afiliadoRoutes.tsx` | Idem |
| `src/components/PageLoader.tsx` (novo) | Spinner pequeno centralizado, sem tela cheia |

### Resultado esperado

- O sidebar e header permanecem fixos durante a navegação
- Apenas a área de conteúdo mostra um loading breve
- Sem flash de tela branca

