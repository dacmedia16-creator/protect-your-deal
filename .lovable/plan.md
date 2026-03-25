

## Tornar Frase de Impacto Clicável → /sobre

### Mudança

| Arquivo | O que fazer |
|---------|------------|
| `src/pages/Index.tsx` (linhas 369-371) | Trocar o `<p>` por um `<Link to="/sobre">` com classes adicionais `cursor-pointer hover:underline block` |

### Código

```tsx
// ANTES
<p className="text-amber-600 font-semibold text-base md:text-lg mb-6 animate-fade-in">
  "Criado por um corretor que perdeu R$ 240 mil de comissão."
</p>

// DEPOIS
<Link to="/sobre" className="text-amber-600 font-semibold text-base md:text-lg mb-6 animate-fade-in cursor-pointer hover:underline block">
  "Criado por um corretor que perdeu R$ 240 mil de comissão."
</Link>
```

`Link` já está importado no arquivo. Apenas 1 elemento alterado.

