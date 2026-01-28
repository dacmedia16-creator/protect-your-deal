

# Restaurar Link de Seleção de Tipo de Cadastro

## Resumo

Corrigir os botões "Criar Conta Grátis" e os CTAs dos planos para levarem à página de seleção de tipo de cadastro (`/registro/tipo`), em vez de ir diretamente para o cadastro de corretor autônomo.

## Alterações

### 1. Header Desktop (linha 236)
- **De:** `/registro-autonomo?plano=gratuito`
- **Para:** `/registro/tipo`

### 2. Menu Mobile (linha 301)
- **De:** `/registro-autonomo?plano=gratuito`
- **Para:** `/registro/tipo`

### 3. Hero CTA Principal (linha 334)
- **De:** `/registro-autonomo?plano=gratuito`
- **Para:** `/registro/tipo`

### 4. Cards de Planos (linha 573)
- **De:** Lógica condicional CPF/CNPJ
- **Para:** Sempre `/registro/tipo?plano=...`

## Comportamento Após a Correção

1. Usuário clica em "Criar Conta Grátis"
2. É levado para `/registro/tipo`
3. Escolhe entre:
   - Pessoa Física (Corretor Autônomo)
   - Vincular a Imobiliária
   - Pessoa Jurídica (Imobiliária/Empresa)
4. É redirecionado para o formulário correto com o plano selecionado

## Arquivo a Modificar

- `src/pages/Index.tsx` (4 alterações pontuais)

