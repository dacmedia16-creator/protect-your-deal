

# Corrigir Exibição do Card "Gratuito CPF"

## Problema Identificado

O card "Gratuito CPF" não está aparecendo porque depende de uma condição que verifica se existe um plano gratuito na lista de planos carregados:

```tsx
{planos.some(p => p.nome.toLowerCase() === 'gratuito' || p.valor_mensal === 0) && (
```

Porém, a query que busca os planos filtra apenas por `tipo_cadastro = 'cnpj'`:

```tsx
.eq('tipo_cadastro', 'cnpj')
```

Como o plano gratuito é do tipo `cpf`, ele não é carregado e a condição falha.

## Solução

Remover a condição que depende da lista de planos. O card "Gratuito CPF" deve **sempre** aparecer, pois é um atalho fixo para o registro de corretor autônomo.

## Alteração

### Arquivo: `src/pages/auth/RegistroImobiliaria.tsx`

**Linha 301-302:** Remover a condição `planos.some(...)`

**De:**
```tsx
{planos.some(p => p.nome.toLowerCase() === 'gratuito' || p.valor_mensal === 0) && (
  <label
    className="flex items-start gap-4 p-4 border-2 border-primary rounded-lg cursor-pointer transition-colors hover:bg-primary/5 relative"
    onClick={() => navigate('/registro-autonomo?plano=gratuito')}
  >
```

**Para:**
```tsx
{/* Card Gratuito CPF - sempre visível */}
<label
  className="flex items-start gap-4 p-4 border-2 border-primary rounded-lg cursor-pointer transition-colors hover:bg-primary/5 relative"
  onClick={() => navigate('/registro-autonomo?plano=gratuito')}
>
```

Também será necessário remover o fechamento correspondente `)}` ao final do card (aproximadamente linha 321).

## Resultado

O card "Gratuito CPF" com o badge "Comece Grátis" aparecerá sempre no topo da lista de planos, independente dos planos carregados do banco de dados.

