

## Plano: Otimizar performance do sistema

### Problema
O app carrega todos os ~100 componentes de página de uma vez no bundle inicial (sem code splitting). Isso significa que ao abrir a landing page, o navegador baixa e processa código de todas as páginas admin, empresa, construtora, etc. Além disso, o `ChatAssistente` (959 linhas) é carregado globalmente mesmo em páginas públicas.

### Alterações

**1. `src/App.tsx` — Lazy loading de todas as rotas**
- Converter todos os imports de páginas para `React.lazy(() => import(...))`
- Envolver `<Routes>` com `<Suspense fallback={<LoadingSpinner />}>`
- Isso reduz drasticamente o bundle inicial, carregando cada página sob demanda

**2. `src/App.tsx` — Lazy load do ChatAssistente**
- O componente `ChatAssistente` tem 959 linhas e é carregado em todas as páginas
- Convertê-lo para `React.lazy` com `Suspense` para que só seja carregado quando necessário

**3. `src/pages/Index.tsx` — Lazy load dos Mockups**
- `MobileAppMockup` e `SofiaMockup` são componentes visuais pesados usados só na landing
- Convertê-los para `React.lazy` para que sejam carregados sob demanda enquanto o usuário rola a página

**4. `src/pages/Index.tsx` — Evitar bloqueio de renderização por auth**
- Atualmente a landing page mostra spinner enquanto `useAuth` carrega, mesmo para visitantes não-logados
- Renderizar o conteúdo principal imediatamente e mostrar o botão correto (Dashboard vs Entrar) quando auth resolver, sem bloquear a página inteira

### Resultado esperado
- Bundle inicial significativamente menor (carrega só o código da página atual)
- Landing page renderiza instantaneamente sem esperar auth
- Navegação para outras páginas carrega o código sob demanda
- Componentes pesados (mockups, chat) carregados apenas quando necessários

