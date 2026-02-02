
# Plano: Organizar Lista de Corretores e Corrigir Contagem "Sem Equipe"

## Problemas Identificados

### 1. Contagem "Sem Equipe" Incorreta
A estatística `semEquipe` na linha 589 está contando **todos** os usuários sem equipe, incluindo **Administradores** (`imobiliaria_admin`).

No print do usuário: mostra "3 corretores sem equipe", mas na imagem vemos que 2 desses são **Admins** (Vinícios Geres e Vitor Baptista com badge verde "Admin") - que normalmente não precisam estar em equipe.

**Causa:** A lógica atual é:
```typescript
semEquipe: corretores.filter(c => !c.equipe).length
```

**Solução:** Filtrar apenas corretores (role = 'corretor') que não têm equipe:
```typescript
semEquipe: corretores.filter(c => c.role === 'corretor' && !c.equipe).length
```

### 2. Ordenação da Lista Ausente
A lista está sendo renderizada na ordem que vem do banco de dados, sem ordenação por hierarquia ou performance.

**Regra de Ordenação Solicitada:**
1. Administradores (`imobiliaria_admin`) primeiro
2. Líderes de Equipe (`isLider = true`) segundo
3. Corretores ordenados por número de registros (`fichas_count` decrescente)

---

## Mudanças no Código

### Arquivo: `src/pages/empresa/EmpresaCorretores.tsx`

#### 1. Corrigir estatística "Sem Equipe" (linha 589)

Antes:
```typescript
const stats = useMemo(() => ({
  ativos: corretores.filter(c => c.ativo).length,
  inativos: corretores.filter(c => !c.ativo).length,
  semEquipe: corretores.filter(c => !c.equipe).length,
}), [corretores]);
```

Depois:
```typescript
const stats = useMemo(() => ({
  ativos: corretores.filter(c => c.ativo).length,
  inativos: corretores.filter(c => !c.ativo).length,
  // Apenas corretores sem equipe (não inclui admins, que não precisam de equipe)
  semEquipe: corretores.filter(c => c.role === 'corretor' && !c.equipe).length,
}), [corretores]);
```

#### 2. Adicionar ordenação na lista filtrada (após linha 580)

Adicionar lógica de ordenação ao `filteredCorretores`:

```typescript
const filteredCorretores = corretores
  .filter(c => {
    const matchesSearch = c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.creci?.toLowerCase().includes(search.toLowerCase());
    
    const matchesEquipe = equipeFilter === 'all' || 
      (equipeFilter === 'none' && !c.equipe) ||
      c.equipe?.id === equipeFilter;

    return matchesSearch && matchesEquipe;
  })
  .sort((a, b) => {
    // 1. Admins primeiro
    if (a.role === 'imobiliaria_admin' && b.role !== 'imobiliaria_admin') return -1;
    if (a.role !== 'imobiliaria_admin' && b.role === 'imobiliaria_admin') return 1;
    
    // 2. Líderes depois dos admins
    if (a.isLider && !b.isLider) return -1;
    if (!a.isLider && b.isLider) return 1;
    
    // 3. Por número de fichas (decrescente)
    return (b.fichas_count || 0) - (a.fichas_count || 0);
  });
```

---

## Resultado Esperado

### Antes (imagem do usuário):
- Lista desordenada (Corretor, Admin, Líder, Corretor, Admin...)
- "3 Sem Equipe" incluindo 2 admins

### Depois:
- Lista ordenada:
  1. Vinícios Geres (Admin)
  2. Vitor Baptista (Admin)
  3. Lindenilton Miler (Líder - 2 fichas)
  4. Edilene Lima (Corretor - 1 ficha)
  5. Marcia Regina... (Corretor - 1 ficha)
  6. Demais corretores com 0 fichas
- "1 Sem Equipe" (somente corretores sem equipe, não admins)

---

## Arquivos a Modificar

1. `src/pages/empresa/EmpresaCorretores.tsx`
   - Linha 571-580: Adicionar `.sort()` após `.filter()`
   - Linha 589: Adicionar filtro de role na contagem `semEquipe`
