

# Fix: Botão "Parceiro" visível no mobile

## Problema
A aba "Parceiro" na lista de registros fica escondida fora da tela no mobile porque as 4 tabs (Todas, Pendentes, Confirmadas, Parceiro) não cabem na largura de 390px. O scroll horizontal está habilitado mas é invisível (`scrollbar-hide`), então o usuário não percebe que pode rolar.

## Solução
Tornar as tabs mais compactas no mobile para que todas caibam sem scroll:

### Arquivo: `src/pages/ListaFichas.tsx`

1. **Encurtar labels mobile** — trocar os textos por versões mais curtas em telas pequenas:
   - "Todas" → manter
   - "Pendentes" → "Pend."
   - "Confirmadas" → "Conf."
   - "Parceiro" → manter (com ícone)

2. **Reduzir padding das tabs** — diminuir `px-3` para `px-2` no mobile, manter `md:px-4` no desktop

3. **Remover badges inline no mobile** — os números já são informativos, mas ocupam espaço. Manter apenas o número sem o componente `Badge` no mobile (usar `<span className="text-[10px]">`)

4. **Alternativa mais simples**: apenas reduzir o `min-w-full` do `TabsList` para `min-w-0` no mobile para que as tabs se comprimam naturalmente, e adicionar `flex-nowrap whitespace-nowrap` para garantir que não quebrem linha

### Abordagem escolhida
A mais limpa: **reduzir o padding das tabs e usar labels curtos no mobile** para que as 4 tabs caibam em 390px sem precisar de scroll horizontal.

Mudanças específicas:
- Tabs: `px-2 md:px-4` (menos padding mobile)
- Labels: usar `<span className="hidden sm:inline">` para label completo e `<span className="sm:hidden">` para label curto
- Badge: reduzir `ml-1` para `ml-0.5` no mobile
- Manter o scroll como fallback caso um dia haja mais tabs

