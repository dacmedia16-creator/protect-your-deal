

## Adicionar Mockup de Celular na Hero Section

### Resumo
Transformar o hero da landing page de layout centralizado (texto-only) para um layout de 2 colunas: texto à esquerda e mockup de celular à direita, usando a screenshot real do app que o usuário enviou como referência visual.

### Mudança

| Arquivo | O que fazer |
|---------|------------|
| `src/pages/Index.tsx` | Reestruturar a hero section (linhas 338-370) de `text-center max-w-3xl` para grid 2 colunas `md:grid-cols-2`. Texto/CTAs à esquerda (alinhados à esquerda em desktop), mockup à direita |
| `src/components/mockups/MobileAppMockup.tsx` | Atualizar o conteúdo da tela para refletir melhor a interface real do app (baseado na screenshot): saudação "Bem-vindo!", cards de stats (Total Registros, Confirmadas, Pendentes), seção "Ações Rápidas" com items como "Novo Registro de Visita" e "Ver Registros" |

### Layout do Hero

```text
Desktop (md+):
┌─────────────────────────────────────┐
│  [Badge]              [Phone Mock]  │
│  Prove Suas Visitas.  │ ┌────────┐ │
│  Proteja Sua          │ │ App UI │ │
│  Comissão.            │ │ Stats  │ │
│                       │ │ Cards  │ │
│  Subtítulo...         │ └────────┘ │
│  [CTA] [CTA] [CTA]   │            │
└─────────────────────────────────────┘

Mobile:
┌───────────────┐
│ [Badge]       │
│ Título        │
│ Subtítulo     │
│ [CTAs]        │
│ [Phone Mock]  │
└───────────────┘
```

### Mockup atualizado
O `MobileAppMockup` será atualizado para mostrar uma tela mais fiel ao app real:
- Header com logo "VisitaProva"
- "Bem-vindo!" com subtítulo
- 3 mini cards lado a lado: Total Registros (25), Confirmadas (23), Pendentes (2)
- Cards de "Ações Rápidas": Novo Registro, Ver Registros
- Bottom nav com ícones (Início, Registros, Convites, Pesquisas, Perfil)

### Estilo
- Texto alinhado à esquerda em desktop, centralizado em mobile
- Mockup com leve animação de float/shadow para destaque
- Responsivo: mockup aparece abaixo do texto em mobile

