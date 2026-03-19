

## Corrigir 404 na página de Registro Tipo

### Problema
A rota definida no `App.tsx` é `/registro/tipo`, mas os links gerados no dashboard do afiliado e na landing page usam `/registro-tipo` (com hífen). Resultado: 404.

### Solução
Adicionar uma rota alternativa no `App.tsx` para `/registro-tipo` apontando para o mesmo componente `RegistroTipo`. Isso garante compatibilidade com links já compartilhados.

### Mudança

| Arquivo | Mudança |
|---------|---------|
| `src/App.tsx` | Adicionar `<Route path="/registro-tipo" element={<RegistroTipo />} />` ao lado da rota existente `/registro/tipo` |

Ambas as rotas continuarão funcionando.

