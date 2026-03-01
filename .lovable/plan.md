

## Diagnóstico

O email foi enviado pela função `regenerate-backup`, que usa **nomes de variáveis incorretos** no template:

| Template espera | regenerate-backup envia |
|---|---|
| `{nome}` | `corretor_nome` |
| `{endereco}` | `imovel_endereco` |
| `{data_visita}` | _(não envia)_ |
| `{link}` | _(não envia)_ |

Por isso `{protocolo}` aparece corretamente (mesmo nome nos dois lados), mas os outros ficam sem substituir.

A função `verify-otp` envia os nomes corretos — o bug está apenas em `regenerate-backup`.

## Correção

**Arquivo:** `supabase/functions/regenerate-backup/index.ts` (linhas 188-194)

Alterar as variáveis para usar os mesmos nomes que o template espera:

```typescript
variables: {
  nome: recipient.nome || 'Corretor',
  protocolo: fichaCompleta.protocolo,
  endereco: fichaCompleta.imovel_endereco || '',
  data_visita: fichaCompleta.data_visita
    ? new Date(fichaCompleta.data_visita).toLocaleDateString('pt-BR')
    : '',
  link: `https://visitaprova.com.br/ficha/${ficha_id}`,
},
```

Isso alinha os nomes das variáveis com o template `ficha_completa` e adiciona `data_visita` e `link` que estavam faltando.

