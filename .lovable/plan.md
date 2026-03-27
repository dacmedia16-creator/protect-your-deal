

## Plano: Substituir campos de endereço/tipo por seleção de empreendimento para construtora

### Problema
Quando um corretor de construtora cria uma ficha, ele precisa digitar endereço e tipo do imóvel manualmente. Mas a construtora já tem empreendimentos cadastrados com esses dados.

### Solução
Para corretores de construtora (`isConstrutora = true`), substituir os campos "Endereço completo" e "Tipo do imóvel" por um **Select de empreendimentos** disponíveis da construtora. Ao selecionar um empreendimento, os campos `imovel_endereco` e `imovel_tipo` são preenchidos automaticamente com os dados do empreendimento, e o `empreendimento_id` é salvo na ficha.

### Mudanças em `src/pages/NovaFicha.tsx`

1. **Query de empreendimentos**: Adicionar `useQuery` para buscar empreendimentos ativos da construtora (`empreendimentos` WHERE `construtora_id = construtoraId` AND `status = 'ativo'`)

2. **Estado**: Adicionar `empreendimentoId` ao estado do formulário

3. **UI condicional na seção "Dados do Imóvel"**:
   - Se `isConstrutora`: mostrar um `Select` com os empreendimentos (nome + endereço)
   - Ao selecionar, preencher `imovel_endereco` com o endereço do empreendimento e `imovel_tipo` com o tipo
   - Se NÃO construtora: manter campos atuais (endereço + tipo)

4. **Submit**: Incluir `empreendimento_id` no `insertData` quando for construtora

5. **Validação**: Para construtora, validar que um empreendimento foi selecionado ao invés de exigir endereço/tipo digitados

### Arquivos afetados
- `src/pages/NovaFicha.tsx` — única alteração necessária

