

## Problema

Quando você navega para outra página do app, o React **desmonta** o componente `AdminWhatsApp`. Isso destrói todos os states, refs e o loop async — o envio morre.

Isso é uma limitação fundamental: o loop vive dentro do componente. Se o componente morre, o loop morre junto.

## Solução: Motor de envio global (fora do React)

Extrair toda a lógica de envio para um **módulo singleton** que vive fora do React. O componente apenas se inscreve para exibir o progresso.

### Arquivos

**1. Criar `src/lib/whatsappSendEngine.ts`** — Motor global

- Classe ou objeto singleton com:
  - `queue: UserWithRole[]`, `isPaused: boolean`, `isRunning: boolean`
  - `progress: { total, sent, success, failed }`, `results: SendResult[]`, `countdown: number`
  - Métodos: `start(users, message, token)`, `pause()`, `resume()`, `reset()`
  - Sistema de listeners (callback pattern) para notificar a UI de mudanças
  - O loop async roda no escopo do módulo, não depende de nenhum componente React

```text
whatsappSendEngine (módulo global)
  ├── start() → inicia o loop async
  ├── pause() / resume()
  ├── subscribe(callback) → UI se inscreve para atualizações
  └── estado persiste mesmo sem componente montado
```

**2. Refatorar `src/pages/admin/AdminWhatsApp.tsx`**

- Remover toda lógica de envio (refs, loop, processQueue)
- Importar o engine global
- No `useEffect`, fazer `subscribe` ao engine para sincronizar state local com o estado do engine
- Botões chamam `engine.start()`, `engine.pause()`, `engine.resume()`
- Ao montar, se o engine estiver rodando, mostra o progresso atual automaticamente

### Fluxo

```text
[Página WhatsApp] → clica Enviar → engine.start()
[Navega para Dashboard] → componente desmonta, engine continua rodando
[Volta para WhatsApp] → componente monta → subscribe → vê progresso atual
```

### Escopo
- Criar `src/lib/whatsappSendEngine.ts`
- Refatorar `src/pages/admin/AdminWhatsApp.tsx`
- Nenhuma mudança em banco ou edge functions

