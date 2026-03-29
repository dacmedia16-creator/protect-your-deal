

## Plano: Wizard passo a passo para criar registro

Transformar o formulário longo em um Wizard com indicador visual de progresso, navegação por steps, e validação por etapa.

### Steps dinâmicos por tipo de usuário

```text
IMOBILIÁRIA (completo):
  Step 1: Modo de Criação
  Step 2: Dados do Imóvel
  Step 3: Proprietário
  Step 4: Comprador
  Step 5: Revisão + Data/Obs + WhatsApp

IMOBILIÁRIA (só proprietário):
  Step 1: Modo de Criação
  Step 2: Dados do Imóvel
  Step 3: Proprietário
  Step 4: Revisão + Data/Obs + WhatsApp

IMOBILIÁRIA (só comprador):
  Step 1: Modo de Criação
  Step 2: Dados do Imóvel
  Step 3: Comprador
  Step 4: Revisão + Data/Obs + WhatsApp

CONSTRUTORA (nativa ou parceira):
  Step 1: Empreendimento (+ construtora para parceira)
  Step 2: Comprador
  Step 3: Revisão + Data/Obs + WhatsApp
```

### Alterações

**`src/pages/NovaFicha.tsx`** — Refatorar o render:

1. Adicionar estado `currentStep` (number, começa em 0)
2. Criar array dinâmico `steps` baseado no modo (construtora vs imobiliária, modoCriacao)
3. Adicionar componente de **indicador de progresso** no topo:
   - Círculos numerados conectados por linhas
   - Step atual = primary, concluídos = check verde, futuros = cinza
   - Labels curtos: "Modo", "Imóvel", "Proprietário", "Comprador", "Confirmar"
4. Renderizar **apenas o card do step atual** (já existem como Cards separados)
5. Substituir botões "Cancelar"/"Criar" por:
   - "Voltar" + "Próximo" (steps intermediários)
   - "Voltar" + "Criar Registro" (último step)
6. Validação por step antes de avançar (ex: step Imóvel valida endereço + tipo)
7. No último step, mostrar um **resumo** dos dados preenchidos antes de confirmar

O indicador visual será inline no componente (sem criar componente separado para manter simplicidade). Usar Tailwind para estilizar os circles/connectors.

### Detalhes técnicos

- Os steps são recalculados via `useMemo` quando `modoCriacao`, `isConstrutora`, ou `modoConstrutoraParceira` mudam
- `currentStep` reseta para 0 quando `modoCriacao` muda
- Validação parcial por step usa a mesma lógica Zod existente mas verifica apenas os campos do step atual
- O `handleSubmit` continua igual, só é chamado no último step
- Mobile: indicador de progresso mostra apenas números (sem labels) para caber na tela

