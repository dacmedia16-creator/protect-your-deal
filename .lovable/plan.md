

## Plano: Adicionar campos "Número" e "Complemento" após busca por CEP

### Alterações

**`src/components/CepInput.tsx`**:
- Após CEP encontrado com sucesso, exibir dois campos em grid lado a lado:
  - **Número** (ex: 123) — obrigatório visualmente mas não bloqueante
  - **Complemento** (ex: Apto 12, Bloco B) — opcional
- Ao preencher número ou complemento, re-chamar `onAddressFound` com endereço atualizado: `{logradouro}, {número} - {complemento}, {bairro}, {cidade} - {uf}`
- Os campos só aparecem após busca bem-sucedida do CEP

### Comportamento
1. Usuário digita CEP → endereço preenchido automaticamente
2. Campos "Número" e "Complemento" aparecem abaixo do CEP
3. Ao digitar, o endereço final é recalculado e enviado via callback
4. Ambos opcionais — se vazios, endereço fica como veio da API

