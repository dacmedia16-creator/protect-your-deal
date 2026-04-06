

# Refatoração do PDF de Pesquisa Pós-Visita

## Método de geração
O PDF atual usa `html2pdf.js` (HTML → Canvas → PDF). Essa abordagem é suficiente para o nível de qualidade desejado — não há necessidade de trocar de engine. A melhora será estrutural e visual no HTML/CSS.

## Dados disponíveis vs. dados no PDF atual

O `Survey` interface no hook só recebe: `imovel_endereco`, `comprador_nome`, `protocolo`. Mas `fichas_visita` tem também `imovel_tipo`, `data_visita`, `user_id`. Para enriquecer o PDF, o select dos surveys precisa incluir esses campos extras + buscar o nome do corretor via `profiles`.

## Nova estrutura do PDF (Single)

```text
┌─────────────────────────────────────────────┐
│  CABEÇALHO                                  │
│  VisitaProva (ou nome da imobiliária)       │
│  "Relatório Pós-Visita"                     │
│  Protocolo: VS-2024-001234                  │
│  Data: 28/12/2024                           │
└─────────────────────────────────────────────┘
┌──────────────┬──────────────┬───────────────┐
│  MÉDIA GERAL │ INTENÇÃO DE  │ DATA DA       │
│    4.2/5     │ COMPRA: Sim  │ RESPOSTA      │
│              │              │ 30/12/2024    │
└──────────────┴──────────────┴───────────────┘
┌─────────────────────┬───────────────────────┐
│  DADOS DO CLIENTE   │ DADOS DO IMÓVEL       │
│  Nome: Maria Santos │ End: Rua das Flores   │
│  Tel: (11) 99999    │ Tipo: Apartamento     │
│                     │ Protocolo: VS-2024... │
└─────────────────────┴───────────────────────┘
┌─────────────────────────────────────────────┐
│  AVALIAÇÕES POR CRITÉRIO                    │
│                                             │
│  Localização    ████████████████░░  4/5     │
│  Tamanho        ████████████░░░░░░  3/5     │
│  Planta         ████████████████████ 5/5    │
│  Acabamentos    ████████████████░░  4/5     │
│  Conservação    ████████████░░░░░░  3/5     │
│  Áreas Comuns   ████████████████░░  4/5     │
│  Preço          ████████████░░░░░░  3/5     │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  FEEDBACK DO CLIENTE                        │
│                                             │
│  ✓ O que mais gostou                        │
│  "A vista é incrível e o bairro..."         │
│                                             │
│  ✗ O que menos gostou                       │
│  "O estacionamento é pequeno..."            │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  RODAPÉ                                     │
│  VisitaProva • Protocolo VS-2024-001234     │
│  Gerado em 06/04/2026                       │
└─────────────────────────────────────────────┘
```

## Alterações

### 1. Enriquecer dados do survey (`src/pages/Pesquisas.tsx`, `src/pages/empresa/EmpresaPesquisas.tsx`, `src/pages/construtora/ConstutoraPesquisas.tsx`)
- Adicionar `imovel_tipo`, `data_visita`, `user_id` ao select de `fichas_visita`
- Buscar nome do corretor via `profiles` para passar ao export

### 2. Atualizar interfaces (`src/hooks/useSurveyExport.ts`)
- Expandir `Survey.fichas_visita` com `imovel_tipo`, `data_visita`
- Adicionar campo opcional `corretor_nome` ao Survey

### 3. Redesenhar `exportSingleToPDF` — novo layout profissional
- **Cabeçalho**: faixa com cor institucional (#1e293b slate escuro), nome da imobiliária, título "Relatório Pós-Visita", protocolo e data
- **Resumo executivo**: 3 cards lado a lado — média geral (com cor condicional), intenção de compra, data da resposta
- **Ficha técnica**: grid 2 colunas — dados do cliente (nome, telefone) e dados do imóvel (endereço, tipo, protocolo)
- **Avaliações**: barras horizontais com label à esquerda, barra visual proporcional, nota à direita — visual limpo e comparável
- **Feedback**: cards com ícones para "o que mais gostou" e "o que menos gostou" — só aparecem se preenchidos
- **Rodapé**: linha fina com nome do sistema, protocolo e data de geração

### 4. Redesenhar `exportToPDF` (relatório consolidado)
- Mesma identidade visual do cabeçalho/rodapé
- Summary cards mais elegantes
- Barras horizontais nas médias por categoria (mesmo estilo)
- Cada survey individual com layout compacto mas profissional

### 5. Paleta de cores
- Trocar roxo (#6366f1) por slate escuro (#1e293b) como cor principal — mais executivo
- Accent: azul (#2563eb) para destaques e barras
- Verde (#059669) para positivos, vermelho (#dc2626) para negativos
- Fundos: #f8fafc para cards, branco para corpo

## Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useSurveyExport.ts` | Interfaces expandidas + redesign completo dos 2 PDFs |
| `src/pages/Pesquisas.tsx` | Adicionar campos ao SURVEY_SELECT + passar corretor_nome |
| `src/pages/empresa/EmpresaPesquisas.tsx` | Mesmo ajuste no select |
| `src/pages/construtora/ConstutoraPesquisas.tsx` | Mesmo ajuste no select |

Nenhuma migração necessária — os campos já existem na tabela.

