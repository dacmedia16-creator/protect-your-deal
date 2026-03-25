

## Remover Fundo Quadriculado do Logo

### Problema
O arquivo `public/vp-logo.png` possui um fundo quadriculado (padrão de transparência) embutido na imagem.

### Solução
Reprocessar o arquivo PNG para adicionar um fundo branco sólido, removendo o padrão quadriculado.

### Mudanças

| Ação | Detalhes |
|------|----------|
| Reprocessar `public/vp-logo.png` | Usar script para compor a imagem sobre um fundo branco sólido e salvar como novo PNG |

Nenhum código de componente precisa ser alterado — apenas o arquivo de imagem será atualizado.

