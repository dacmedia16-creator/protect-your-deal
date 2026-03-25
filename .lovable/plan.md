

## Mover Frase de Impacto para Abaixo do Título

### Resumo
Mover a frase vermelha "Criado por um corretor que perdeu R$ 240 mil de comissão." de acima do `<h1>` para abaixo dele, entre o título e o parágrafo de subtítulo.

### Mudança

| Arquivo | O que fazer |
|---------|------------|
| `src/pages/Index.tsx` | Remover o `<p>` da linha 365-367 e reinseri-lo após o `</h1>` (linha 371), antes do parágrafo de subtítulo |

### Resultado visual

```text
Badge
Prove Suas Visitas. Proteja Sua Comissão.
"Criado por um corretor que perdeu R$ 240 mil de comissão."
Nunca mais perca um cliente...
[Botões]
```

