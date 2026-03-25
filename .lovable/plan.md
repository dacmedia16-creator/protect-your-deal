

## Plano: Mostrar logo VisitaProva quando não há imobiliária vinculada

### O que muda

Na página de login (`src/pages/Auth.tsx`), quando o email digitado não está vinculado a nenhuma imobiliária (ou seja, `imobiliariaData` é `null` e não está carregando), exibir o logo do VisitaProva no lugar onde apareceria o logo da imobiliária.

### Alteração

**Arquivo: `src/pages/Auth.tsx`**

Onde hoje existe (linhas 531-548):
```tsx
{/* Logo da imobiliária quando encontrada */}
{imobiliariaData && (
  <div>...</div>
)}
```

Mudar para: sempre mostrar o bloco de logo. Se `imobiliariaData` existir, mostrar o logo/nome da imobiliária (comportamento atual). Se não existir e não estiver carregando, mostrar o `LogoIcon` do VisitaProva com o nome "VisitaProva".

```tsx
{imobiliariaData ? (
  <div className="flex flex-col items-center gap-2 pb-4 border-b border-border mb-4">
    {imobiliariaData.logo_url ? (
      <img src={imobiliariaData.logo_url} alt={imobiliariaData.nome} ... />
    ) : (
      <div className="h-16 w-16 rounded-lg bg-muted ...">
        <Building2 ... />
      </div>
    )}
    <span>...</span>
  </div>
) : !loadingImobiliaria && (
  <div className="flex flex-col items-center gap-2 pb-4 border-b border-border mb-4">
    <LogoIcon size={48} />
    <span className="text-sm text-muted-foreground font-medium">VisitaProva</span>
  </div>
)}
```

O `LogoIcon` já está importado no arquivo.

