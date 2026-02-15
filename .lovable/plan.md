

# Atualizar parametros do template Meta visita_prova

## Problema

O template aprovado na Meta possui 4 variaveis no body:
- `{{nome}}` - Nome do destinatario
- `{{imovel}}` - Dados do imovel
- `{{codigo}}` - Codigo de confirmacao
- `{{lembrete}}` - Texto complementar

O codigo atual na pagina de Integracoes envia parametros errados: `nome`, `aviso`, `lembrete` (falta `imovel` e `codigo`, e `aviso` nao existe no template).

Alem disso, o template tem um botao CTA "Confirmar Visita" com URL dinamica que precisa do `buttonUrlDynamicParams`.

## Alteracoes

### 1. Atualizar `src/pages/Integracoes.tsx`

Corrigir os `templateParams` no envio de teste do Meta (linha 112-115) para:

```text
templateParams: {
  nome: 'Teste',
  imovel: 'Rua Exemplo, 123 - Centro',
  codigo: '123456',
  lembrete: 'Este é um envio de teste via API Oficial Meta.'
},
buttonUrlDynamicParams: ['confirmar/teste-123'],
```

### 2. Atualizar `send-whatsapp` edge function

O edge function ja suporta `buttonUrlDynamicParams` e `templateParams` corretamente. Nenhuma alteracao necessaria.

## Resumo das mudancas

| Arquivo | O que muda |
|---------|------------|
| `src/pages/Integracoes.tsx` | Corrigir parametros do template de teste: trocar `aviso` por `imovel` e `codigo`, adicionar `buttonUrlDynamicParams` |

