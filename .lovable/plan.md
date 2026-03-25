

## Adicionar Frase de Impacto no Hero da Landing Page

### Resumo
Adicionar a frase "Criado por um corretor que perdeu R$ 240 mil de comissão." como um destaque em vermelho abaixo do badge e acima do título principal no hero section.

### Mudança

| Arquivo | O que fazer |
|---------|------------|
| `src/pages/Index.tsx` | Inserir uma nova linha entre o badge (linha 364) e o `<h1>` (linha 365) com a frase em destaque vermelho |

### Detalhes
- Inserir um `<p>` com a frase estilizada em vermelho (`text-red-600 font-semibold`) entre o badge e o h1
- Formato: texto em tamanho médio (`text-base md:text-lg`), com destaque visual para chamar atenção como prova social/autoridade

