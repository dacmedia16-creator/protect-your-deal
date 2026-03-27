

## Plano: Tornar "Confirmado" clicável no card de status

### Problema
No card de status da ficha, os textos "Proprietário confirmou" e "Comprador confirmou" (com ícone verde) não são clicáveis. O usuário quer poder clicar neles para ver os detalhes da confirmação (dados jurídicos: nome, CPF, localização, IP, data/hora).

### Solução

Alterar os elementos de confirmação no Status Card (linhas ~1205-1241 de `DetalhesFicha.tsx`) para serem clicáveis e rolar suavemente até a seção "Dados Jurídicos" que já existe mais abaixo na página.

#### Alterações em `DetalhesFicha.tsx`

1. Adicionar `id="dados-juridicos"` ao Card de Dados Jurídicos (linha ~2396) para servir como âncora
2. Envolver os textos "Proprietário confirmou" e "Comprador confirmou" em um botão/link com:
   - `cursor-pointer hover:underline` para indicar que é clicável
   - `onClick` que faz `document.getElementById('dados-juridicos')?.scrollIntoView({ behavior: 'smooth' })`
   - Manter o visual atual (ícone verde + texto)

### Detalhes técnicos
- Não precisa de migração ou mudança de dados
- Apenas alteração visual/interativa no componente existente
- A seção "Dados Jurídicos" já é renderizada quando a ficha está completa/finalizada, então o scroll sempre encontrará o elemento

