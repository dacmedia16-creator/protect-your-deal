

## Plano: Tornar cards de imobiliárias parceiras clicáveis

### Problema
Os cards de imobiliárias parceiras na página `/construtora/imobiliarias` não são clicáveis. O usuário quer poder clicar no card para ver mais detalhes.

### Solução

#### Alterar `ConstutoraImobiliarias.tsx`

Envolver o `<Card>` com um `<Link>` ou usar `onClick` + `navigate` para redirecionar ao clicar no card. Como não existe uma página de detalhes da imobiliária para construtora, a melhor abordagem é navegar para a página de fichas filtrada por imobiliária:

- Envolver o card principal com `onClick={() => navigate('/construtora/fichas?imobiliaria=' + p.imobiliaria_id)}` e adicionar `cursor-pointer hover:border-primary transition-colors`
- Os botões internos (WhatsApp, Empreendimentos, dropdown) devem usar `e.stopPropagation()` para não disparar a navegação do card
- Importar `useNavigate` de `react-router-dom`

#### Atualizar `ConstutoraFichas.tsx`

- Ler o query param `imobiliaria` da URL
- Se presente, filtrar as fichas exibidas apenas para aquela imobiliária
- Mostrar um indicador visual (badge ou texto) de que está filtrando por imobiliária, com botão para limpar o filtro

### Detalhes técnicos
- `useSearchParams` para ler/limpar o filtro na URL
- O filtro será aplicado no frontend sobre os dados já carregados (a RPC `get_fichas_construtora` já retorna `corretor_imobiliaria`)
- O `stopPropagation` nos botões impede conflito de cliques

