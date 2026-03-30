

## Plano: Adicionar campo "Condomínio" ao CepInput

### Alteração

**`src/components/CepInput.tsx`**:
- Adicionar um campo "Condomínio" abaixo da grid de Número/Complemento
- Campo opcional, texto livre (ex: "Condomínio Jardins", "Ed. Central")
- Incluir o condomínio na construção do endereço via `buildAddress`
- Formato: `{logradouro}, {número} - {complemento}, {condomínio}, {bairro}, {cidade} - {uf}`
- Se vazio, não altera o endereço atual

O campo aparece apenas após busca bem-sucedida do CEP, junto com Número e Complemento. Layout: grid 2 colunas para Número/Complemento + campo Condomínio em largura total abaixo.

