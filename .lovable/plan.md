

# Plano: Adicionar criação de corretor no dialog de Membros da Equipe (Construtora)

## Problema

No dialog "Membros" da página de Equipes da construtora (`ConstutoraEquipes.tsx`), o dropdown "Adicionar corretor..." só lista corretores já existentes. Se não há corretores cadastrados, não há como criar um diretamente ali.

## Solução

Adicionar um botão "Criar Corretor" dentro do dialog de gerenciamento de membros, que abre um sub-dialog com formulário de criação (nome, email, senha, telefone, CRECI, CPF). Após criar, o corretor é automaticamente adicionado à equipe e as listas são recarregadas.

## Arquivo alterado

`src/pages/construtora/ConstutoraEquipes.tsx`

## Mudanças

1. **Novos estados** para o dialog de criação e formulário (nome, email, senha, telefone, creci, cpf, loading)
2. **Função `handleCreateCorretor`** que:
   - Chama `admin-create-corretor` com `construtora: true` (mesmo padrão de `ConstutoraCorretores.tsx`)
   - Após sucesso, adiciona automaticamente o corretor à equipe selecionada via `equipes_membros`
   - Recarrega dados (`fetchData`)
3. **Botão "Criar Corretor"** ao lado do select de "Adicionar corretor..." no dialog de membros (linha ~488-498), com ícone `UserPlus`
4. **Novo Dialog** com formulário de criação (campos: nome*, email*, senha*, telefone, CRECI, CPF) — replicando o padrão visual já usado em `ConstutoraCorretores.tsx`
5. **Import** de `invokeWithRetry` e `PasswordInput`

## Fluxo do usuário

1. Abre o dialog de Membros de uma equipe
2. Vê o select "Adicionar corretor..." e ao lado um botão "Criar Corretor"
3. Clica em "Criar Corretor" → abre dialog com formulário
4. Preenche e salva → corretor é criado E adicionado à equipe automaticamente
5. Dialog fecha, lista de membros atualiza

