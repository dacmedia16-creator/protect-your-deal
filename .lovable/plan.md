

## Plano: Adicionar upload de logo na página de configurações da Construtora

A página `ConstutoraConfiguracoes.tsx` não possui funcionalidade de upload de logo. A página equivalente para imobiliárias (`EmpresaConfiguracoes.tsx`) já tem essa funcionalidade. O bucket `logos-construtoras` já existe e é público.

### Alterações

**1. Atualizar `src/pages/construtora/ConstutoraConfiguracoes.tsx`**
- Adicionar seção de upload/remoção de logo (baseado no padrão de `EmpresaConfiguracoes.tsx`)
- Upload para bucket `logos-construtoras` com path `{construtoraId}/logo-{timestamp}.{ext}`
- Validação: apenas imagens, máximo 2MB
- Ao fazer upload: remove logo anterior, faz upload do novo, atualiza `construtoras.logo_url`
- Botão de remover logo existente
- Exibir preview da logo atual (avatar circular com fallback para ícone)

### Detalhes técnicos
- Bucket `logos-construtoras` já existe e é público
- Tabela `construtoras` já tem coluna `logo_url`
- RLS já permite `construtora_admin` atualizar sua construtora
- Reutilizar mesmo padrão de `extractFilePathFromUrl`, `handleLogoUpload`, `handleRemoveLogo` do `EmpresaConfiguracoes`

