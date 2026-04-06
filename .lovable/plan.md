

# Atualizar Página de Afiliados

## Mudanças

### 1. Remover seção "Simulação 100 Clientes"
Remover todo o bloco (linhas 140-208) com os cenários conservador, misto, rede 2º nível e total combinado.

### 2. Atualizar valores dos planos
Os valores atuais no banco são diferentes dos exibidos na página:

| Plano | Valor antigo | Valor atual | Descrição |
|-------|-------------|-------------|-----------|
| Profissional | R$79,90 | R$89,90 | Corretor autônomo |
| Imobiliárias Pro | R$297,90 (Pequena) | R$349,90 | Até 5 corretores |
| Imobiliárias Pro Max | R$497,90 (Média) | R$599,90 | Até 10 corretores |

Os nomes dos planos também serão atualizados para corresponder ao banco.

## Arquivo alterado

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Afiliados.tsx` | Remover seção simulação + atualizar cards de planos |

