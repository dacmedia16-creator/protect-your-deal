

# Corrigir label de nome no template Meta por tipo

## Problema

Quando o nome do destinatario esta vazio, o template Meta sempre mostra "Visitante", mesmo para proprietarios. O correto e:
- **proprietario** -> "Proprietario"
- **comprador** -> "Visitante"

## Solucao

Alterar o fallback do parametro `nome` nas chamadas ao template Meta em 2 edge functions. O `otp-reminder` ja faz isso corretamente.

## Arquivos modificados

### 1. `supabase/functions/send-otp/index.ts` (linha ~451)

```
// De:
nome: nome || 'Visitante',

// Para:
nome: nome || (tipo === 'proprietario' ? 'Proprietário' : 'Visitante'),
```

### 2. `supabase/functions/process-otp-queue/index.ts` (linha ~364)

```
// De:
nome: nome || 'Visitante',

// Para:
nome: nome || (item.tipo === 'proprietario' ? 'Proprietário' : 'Visitante'),
```

O `otp-reminder` ja usa `tipoLabel` corretamente e nao precisa de alteracao.

