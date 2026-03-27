

## Plano: Limpar código não usado

### O que será feito
Remover imports não utilizados, componentes órfãos, funções comentadas e a edge function desativada.

### Alterações

**1. Imports não utilizados em mockups**
- `CRMMockup.tsx`: remover `Mail`, `Tag` do import (não são usados no JSX)
- `MobileAppMockup.tsx`: remover `Users` do import (não é usado no JSX)

**2. Componente órfão: `AndroidInstallMockup.tsx`**
- Não é importado em nenhum lugar do projeto
- Remover o arquivo `src/components/mockups/AndroidInstallMockup.tsx`

**3. Página comentada: `DemoAnimado.tsx`**
- Import e rota estão comentados no `App.tsx` (linhas 36 e 181)
- Remover o arquivo `src/pages/DemoAnimado.tsx`
- Remover as linhas comentadas do `App.tsx`

**4. Edge functions não utilizadas pelo DemoAnimado**
- `supabase/functions/elevenlabs-tts/index.ts` — só era chamada pelo DemoAnimado
- Remover o diretório/arquivo

**5. Edge function desativada: `seed-test-admin`**
- Permanentemente desativada (retorna 403)
- Remover `supabase/functions/seed-test-admin/index.ts`

**6. Limpar `App.tsx`**
- Remover linhas comentadas (import DemoAnimado linha 36, rota linha 181)

### Arquivos afetados
| Arquivo | Ação |
|---------|------|
| `src/components/mockups/CRMMockup.tsx` | Remover `Mail`, `Tag` do import |
| `src/components/mockups/MobileAppMockup.tsx` | Remover `Users` do import |
| `src/components/mockups/AndroidInstallMockup.tsx` | Deletar arquivo |
| `src/pages/DemoAnimado.tsx` | Deletar arquivo |
| `supabase/functions/elevenlabs-tts/index.ts` | Deletar |
| `supabase/functions/seed-test-admin/index.ts` | Deletar |
| `src/App.tsx` | Remover linhas comentadas |

