
# Reorganizar Cards de Planos no Registro

## Resumo

Modificar a tela de seleção de planos (`RegistroImobiliaria.tsx`) para:
1. Remover o badge "Grátis" do card "Vincular a Imobiliária"
2. Criar um card destacado separado para o plano "Gratuito CPF"

## Alteracoes

### Arquivo: `src/pages/auth/RegistroImobiliaria.tsx`

#### 1. Card "Vincular a Imobiliaria" (linhas 342-364)

**Remover o badge "Gratis":**
- Linha 354: Remover `<span className="font-bold text-green-600">Grátis</span>`
- Substituir por texto descritivo ou deixar vazio

**De:**
```tsx
<span className="font-bold text-green-600">Grátis</span>
```

**Para:**
```tsx
{/* Sem indicacao de preco - usa plano da imobiliaria */}
```

Ou alternativamente, indicar que usa o plano da empresa:
```tsx
<span className="text-sm text-muted-foreground">Usa plano da empresa</span>
```

#### 2. Card "Gratuito CPF" (linhas 302-321)

**Transformar em card destacado separado:**
- Adicionar visual diferenciado (borda colorida, icone de destaque)
- Manter posicao no topo como opcao gratuita principal
- Adicionar badge "Comece Gratis" ou similar

**De:**
```tsx
<label
  className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors border-border hover:border-primary/50"
  onClick={() => navigate('/registro-autonomo?plano=gratuito')}
>
```

**Para:**
```tsx
<label
  className="flex items-start gap-4 p-4 border-2 border-primary rounded-lg cursor-pointer transition-colors hover:border-primary hover:bg-primary/5 relative"
  onClick={() => navigate('/registro-autonomo?plano=gratuito')}
>
  {/* Badge destaque */}
  <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
    Comece Gratis
  </div>
  ...
</label>
```

## Resultado Visual Esperado

| Card | Aparencia |
|------|-----------|
| Gratuito CPF | Card com borda primaria + badge "Comece Gratis" no topo |
| Profissional | Card normal com preco R$ 79,90/mes |
| Vincular a Imobiliaria | Card com fundo verde claro, SEM badge de preco, texto "Usa plano da empresa" |
| Planos CNPJ | Cards normais com precos |

## Comportamento

- Todos os cliques continuam redirecionando para as mesmas rotas
- Apenas mudanca visual para clareza do usuario
- "Vincular a Imobiliaria" fica claro que nao e um plano proprio, mas sim vinculacao

## Arquivo a Modificar

- `src/pages/auth/RegistroImobiliaria.tsx` (alteracoes nas linhas 302-364)
