

## Adicionar campos de comissão de indicação na tela Admin Configurações

### Contexto
Os valores `indicacao_comissao_corretor` (10%) e `indicacao_comissao_imobiliaria` (10%) já estão salvos na tabela `configuracoes_sistema`, mas não há UI para o super admin editá-los. Vamos adicionar uma seção "Indicações" no `AdminConfiguracoes.tsx`.

### Mudança

| Arquivo | O que fazer |
|---------|------------|
| `src/pages/admin/AdminConfiguracoes.tsx` | Adicionar um novo Card "Indicações" (com ícone `Gift` ou `Share2`) contendo dois campos `Input type="number"` para editar `indicacao_comissao_corretor` e `indicacao_comissao_imobiliaria`, usando a mesma lógica de `getConfigNumberValue` + `updateConfigMutation` já existente na página |

### Detalhes
- Card posicionado após o card "Afiliados" no grid
- Dois inputs numéricos (0-100) com labels:
  - "% Comissão por Indicar Corretor" — chave `indicacao_comissao_corretor`
  - "% Comissão por Indicar Imobiliária" — chave `indicacao_comissao_imobiliaria`
- Mesma UX dos inputs de comissão de afiliados que já existem na página (skeleton loading, disabled enquanto salva)

