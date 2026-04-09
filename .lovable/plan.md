

# Fix: Pesquisas já respondidas não aparecem para corretor da construtora

## Problema

O menu "Pesquisas" não aparece na navegação do corretor Apolo porque a lógica que decide se o link é exibido só verifica duas tabelas de feature flags:
- `imobiliaria_feature_flags` (se tem `imobiliariaId`)
- `user_feature_flags` (fallback para corretor autônomo)

Como Apolo é corretor de **construtora** (sem `imobiliariaId`), o sistema cai no fallback `userSurveyEnabled` que consulta `user_feature_flags` — onde não existe flag. Resultado: `surveyEnabled = false`, link oculto, pesquisas invisíveis.

## Solução

Adicionar verificação da flag `construtora_feature_flags` nos componentes de navegação e no hook auxiliar.

### 1. Criar hook `useConstutoraFeatureFlag` (novo arquivo)

Arquivo: `src/hooks/useConstutoraFeatureFlag.ts`

Segue o mesmo padrão de `useImobiliariaFeatureFlag` mas consulta `construtora_feature_flags` usando o `construtora_id` do `user_roles`.

### 2. Atualizar `DesktopNav.tsx`

Importar o novo hook e alterar a lógica:

```
const { enabled: constSurveyEnabled } = useConstutoraFeatureFlag('post_visit_survey');
const surveyEnabled = imobiliariaId 
  ? imobSurveyEnabled 
  : (constutoraId ? constSurveyEnabled : userSurveyEnabled);
```

### 3. Atualizar `MobileNav.tsx`

Mesma lógica cascata: imobiliária → construtora → usuário.

### Arquivos alterados
- `src/hooks/useConstutoraFeatureFlag.ts` (novo)
- `src/components/DesktopNav.tsx`
- `src/components/MobileNav.tsx`

### Resultado
Corretores de construtoras com a flag `post_visit_survey` habilitada verão o link "Pesquisas" no menu e poderão acessar todas as pesquisas já realizadas.

