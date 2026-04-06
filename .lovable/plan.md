

# Refinamento Final do PDF Pós-Visita

## Avaliação da versão atual
O PDF já tem boa estrutura: cabeçalho slate, summary cards, info grid, barras de avaliação e feedback. Os pontos a polir:
- Cabeçalho: hierarquia plana entre protocolo/corretor/data — tudo com mesmo peso visual
- Campos vazios mostram "—" sem tratamento elegante
- Endereço pode ficar comprimido na coluna com `width: 80px` no label
- Rodapé simples demais — apenas 2 spans com `font-size: 9px`
- Não há conclusão/resumo interpretativo ao final
- Espaçamentos entre seções podem ser mais generosos

## Refinamentos

### 1. Cabeçalho — melhor hierarquia
- Protocolo no header-right com fonte maior e `font-family: monospace` para destaque
- Linha separadora sutil entre protocolo e demais info (imobiliária, corretor, data)
- Adicionar corretor no cabeçalho (mover de dentro do info-box para cá)
- Subtítulo com separador `•` entre "Pesquisa de Satisfação" e data da visita

### 2. Tratamento de campos vazios
- Quando `client_phone` está vazio, já não renderiza (ok)
- Quando `corretor_nome` é "—", exibir "Não informado" em `textLight` e itálico em vez de traço
- Mesmo para `imovel_tipo` e `data_visita`

### 3. Endereço mais legível
- Aumentar `info-label` width de `80px` para `85px`
- Endereço com `word-break: break-word` e `line-height: 1.5`
- Endereço em `font-size: 12px` com peso 500

### 4. Avaliações — polimento fino
- Aumentar altura da barra de 10px para 12px
- Adicionar `border-radius: 6px` consistente
- Espaçamento vertical entre rows: `padding: 11px 0`
- Barra de fundo com cor levemente mais forte `#e9edf2` para contraste

### 5. Rodapé mais resolvido
- Layout em 3 colunas: marca à esquerda, protocolo ao centro, data de geração à direita
- Aumentar `font-size` de 9px para 10px
- Adicionar uma linha fina decorativa acima (`border-top: 1px solid ${border}` + `2px solid primary` acima)
- Padding vertical mais generoso: `16px 32px`

### 6. Conclusão automática
- Nova seção "Parecer Resumido" antes do rodapé
- Gerada automaticamente com base nos dados:
  - Se média >= 4 e would_buy: "Avaliação altamente positiva. Cliente demonstrou interesse real de compra."
  - Se média >= 3 e would_buy: "Avaliação satisfatória com interesse de compra declarado."
  - Se média >= 3 e !would_buy: "Avaliação satisfatória, porém sem intenção de compra neste momento."
  - Se média < 3: "Avaliação abaixo da média. Recomenda-se atenção aos pontos negativos."
- Adicionar o critério com maior nota e o com menor nota como destaque
- Visual: card com borda esquerda colorida (accent), fundo `cardBg`, texto em 12px

### 7. Relatório consolidado (exportToPDF)
- Aplicar mesmos refinamentos de rodapé e header
- Não adicionar conclusão automática (faz sentido só no individual)

## Arquivo alterado

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useSurveyExport.ts` | Refinamentos CSS + conclusão automática + tratamento de vazios |

Nenhum outro arquivo precisa mudar. Apenas polimento no HTML/CSS do hook.

