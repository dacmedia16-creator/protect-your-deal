
# Atualizar Link do Botao "Criar Conta Gratis"

## Resumo

Alterar todos os botoes "Criar Conta Gratis" para usar o link externo completo `https://visitaprova.com.br/registro?plano=gratuito`.

## Alteracoes Necessarias

### Arquivo: `src/pages/Index.tsx`

| Local | Linha | Link Atual | Novo Link |
|-------|-------|------------|-----------|
| Header Desktop | 236 | `/registro/tipo` | `https://visitaprova.com.br/registro?plano=gratuito` |
| Menu Mobile | 301 | `/registro/tipo` | `https://visitaprova.com.br/registro?plano=gratuito` |
| Hero CTA | 334 | `/registro/tipo` | `https://visitaprova.com.br/registro?plano=gratuito` |

### Detalhes Tecnicos

Como o link e externo (URL completa), sera necessario trocar o componente `Link` do react-router por uma tag `<a>` padrao:

```tsx
// De:
<Link to="/registro/tipo">Criar Conta Gratis</Link>

// Para:
<a href="https://visitaprova.com.br/registro?plano=gratuito">Criar Conta Gratis</a>
```

Isso garante que o navegador trate como navegacao externa para o dominio de producao.
