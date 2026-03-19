

## Corrigir Geração de Cupom Automático + Gerar Cupons Retroativos

### Problema Identificado
O código de criação de cupom está dentro de um `try/catch` silencioso. Quando a inserção falha, o afiliado é criado mas o cupom não, e o admin recebe "sucesso" sem saber que o cupom falhou.

A causa provável é que `configuracoes_sistema.valor` é do tipo `jsonb` — o valor pode vir como objeto JSON em vez de número simples, fazendo `Number(configData.valor)` retornar `NaN`.

### Mudanças

#### 1. Corrigir `AdminAfiliados.tsx` — criação de cupom mais robusta
- Tratar `configData.valor` como jsonb corretamente (pode ser `{valor: 10}` ou `10` direto)
- Adicionar fallback seguro para `comissaoPadrao`
- Mostrar toast de erro se o cupom falhar (em vez de silenciar)
- Verificar o retorno do insert do cupom com `.select().single()` para capturar erros

#### 2. Gerar cupons retroativos para Fernanda e Francisco
- Usar a ferramenta de insert para criar os cupons de rastreamento para os afiliados sem cupom
- Código: `FERNANDAASOUZA` e `FRANCISCOASOUZA`
- `valor_desconto: 0`, `tipo_desconto: percentual`, `comissao_percentual: 10`

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/admin/AdminAfiliados.tsx` | Corrigir parsing de jsonb e tratamento de erro |

### Dados a inserir
- Cupom para Fernanda (afiliado_id: `61f45cf6-...`) com código `FERNANDAASOUZA`
- Cupom para Francisco (afiliado_id: `a7a58aaa-...`) com código `FRANCISCOASOUZA`

