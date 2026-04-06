

# Feature Flag para "Registrar Visita de Empreendimento"

## Resumo
Adicionar uma feature flag `empreendimento_visita` (similar a `post_visit_survey`) que o Super Admin pode ativar/desativar por imobiliária. Quando desativada, o botão "Registrar visita de empreendimento" fica oculto no Dashboard e o modo `?modo=construtora` não funciona no NovaFicha.

Para construtoras nativas (role `construtora_admin`), o comportamento não muda -- a seleção de empreendimento continua sempre ativa.

## Alterações

### 1. Admin: toggle na lista de imobiliárias (`AdminImobiliarias.tsx`)
- Buscar flag `empreendimento_visita` da tabela `imobiliaria_feature_flags` (mesmo padrão de `post_visit_survey`)
- Adicionar coluna/ação "Empreendimentos" no dropdown com switch para ativar/desativar
- Upsert na tabela `imobiliaria_feature_flags` com `feature_key: 'empreendimento_visita'`

### 2. Admin: toggle nos detalhes da imobiliária (`AdminDetalhesImobiliaria.tsx`)
- Na aba "Features", adicionar switch para `empreendimento_visita` ao lado do já existente `post_visit_survey`

### 3. Dashboard: condicionar botão à flag (`Dashboard.tsx`)
- Importar `useImobiliariaFeatureFlag('empreendimento_visita')`
- Mudar condição de `parceriasConstrutoras.length > 0` para `parceriasConstrutoras.length > 0 && empreendimentoEnabled`
- Aplicar nos dois locais (mobile e desktop)

### 4. NovaFicha: bloquear modo construtora parceira sem flag (`NovaFicha.tsx`)
- Importar `useImobiliariaFeatureFlag('empreendimento_visita')`
- Alterar `modoConstrutoraParceira` para incluir checagem da flag: `!isConstrutora && !!imobiliariaId && searchParams.get('modo') === 'construtora' && empreendimentoEnabled`
- Se o usuário acessar `?modo=construtora` sem a flag, redirecionar para `/fichas/nova` normal

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/admin/AdminImobiliarias.tsx` | Buscar + toggle flag `empreendimento_visita` |
| `src/pages/admin/AdminDetalhesImobiliaria.tsx` | Switch na aba Features |
| `src/pages/Dashboard.tsx` | Condicionar botões à flag |
| `src/pages/NovaFicha.tsx` | Bloquear modo parceira sem flag |

Nenhuma migração de banco necessária -- reutiliza a tabela `imobiliaria_feature_flags` existente.

