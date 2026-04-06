

# Correção do Tour de Onboarding

## Problema
O passo 4 (`ver-registros`) não encontra nenhum elemento no HTML porque nenhum componente tem `data-tour="ver-registros"`. O tour pula esse passo ou exibe o tooltip sem posição.

## Correções

### 1. Adicionar `data-tour="ver-registros"` (linha 484)
Adicionar o atributo ao card "Total" na grid de stats mobile, que já navega para `/fichas`. Este é o elemento mais lógico para esse passo.

```tsx
<Card 
  data-tour="ver-registros"
  className="animate-fade-in cursor-pointer ..."
  onClick={() => navigate('/fichas')}
>
```

### 2. Revisar textos dos 6 passos

| # | target | Título atual | Título novo | Descrição nova |
|---|--------|-------------|-------------|----------------|
| 1 | `welcome` | "Bem-vindo ao VisitaProva! 🎉" | "Bem-vindo ao VisitaProva! 👋" | "Este é seu painel. Daqui você cria registros, acompanha pendências e gerencia tudo." |
| 2 | `stats` | "Seus Números" | "Resumo rápido" | "Veja de relance quantos registros você tem, quantos já foram confirmados e quantos aguardam confirmação." |
| 3 | `novo-registro` | "Novo Registro de Visita" | "Criar registro de visita" | "Toque aqui para registrar uma visita. O proprietário confirma via WhatsApp em segundos." |
| 4 | `ver-registros` | "Seus Registros" | "Acessar seus registros" | "Toque no total para ver a lista completa. Você pode filtrar por status, buscar por endereço e gerenciar cada ficha." |
| 5 | `indicacoes` | "Indique e Ganhe 💰" | "Programa de indicações" | "Indique corretores ou imobiliárias e ganhe comissão recorrente por cada assinatura ativa." |
| 6 | `nav-menu` | "Navegação" | "Menu de navegação" | "Use a barra inferior para acessar Início, Registros, Convites e Perfil a qualquer momento." |

**Mudanças de copy**: textos mais diretos, orientados à ação e sem redundância. Emojis reduzidos (só 👋 no welcome).

### Arquivo alterado
`src/pages/Dashboard.tsx` — linhas 63-94 (steps) e linha 484 (data-tour)

