

## Plano: Busca por CEP nos campos de endereço

Adicionar um campo de CEP com busca automática via API ViaCEP (gratuita, sem chave) para preencher o endereço nos 3 locais onde o endereço manual aparece no formulário de Nova Ficha, e também no FormImovel.

### Como funciona

1. Campo de CEP com máscara `00000-000` aparece **acima** do campo "Endereço completo"
2. Ao digitar 8 dígitos, faz fetch em `https://viacep.com.br/ws/{cep}/json/`
3. Auto-preenche o endereço com `logradouro, bairro, cidade - UF`
4. Usuário pode editar o endereço após o preenchimento
5. Se CEP não encontrado, mostra mensagem e permite digitação manual

### Alterações

**Novo componente `src/components/CepInput.tsx`**:
- Input com máscara de CEP (99999-999)
- Ao completar 8 dígitos, chama ViaCEP
- Props: `onAddressFound(endereco: string)`, `disabled?`
- Mostra spinner durante busca e erro se CEP inválido

**`src/pages/NovaFicha.tsx`** — 3 pontos de inserção:
1. **Linha ~806** (construtora parceira genérico): adicionar `<CepInput>` antes do campo endereço
2. **Linha ~907** (construtora direta genérico): adicionar `<CepInput>` antes do campo endereço
3. **Linha ~963** (modo completo/imóvel): adicionar `<CepInput>` antes do campo endereço

Callback `onAddressFound` seta `formData.imovel_endereco` com o endereço retornado.

**`src/pages/FormImovel.tsx`**: adicionar `<CepInput>` antes do campo endereço existente, setando `formData.endereco`.

### Detalhes técnicos

- API ViaCEP é pública, sem autenticação: `fetch('https://viacep.com.br/ws/01001000/json/')`
- Resposta: `{ logradouro, bairro, localidade, uf, erro? }`
- Formato do endereço gerado: `{logradouro}, {bairro}, {localidade} - {uf}`
- Máscara aplicada via regex no onChange, sem dependência externa

