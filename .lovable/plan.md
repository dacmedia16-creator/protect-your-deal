
Objetivo: fazer o botão/link “Acessar Minha Conta” sempre sair com uma URL real (e clicável) no email de boas-vindas, mesmo se alguma chamada esquecer de enviar a variável `link`.

Diagnóstico (com base no que vimos)
- O template `boas_vindas` no banco está correto: ele usa `<a href="{link}">Acessar Minha Conta</a>`.
- O seu print mostrando `[{link}]Acessar Minha Conta` é típico de quando o cliente de email está exibindo a mensagem em modo “texto simples”, convertendo links HTML para o formato `[URL]Texto`. Como a URL ficou `{link}`, ele exibiu `[{link}]...`.
- Já confirmamos que `registro-corretor-autonomo` foi alterada para enviar `link`, mas no teste ainda ficou “{link}”, então precisamos **garantir** que a variável chegue ou ter um **fallback** no serviço de email.

Causa mais provável
- O email que você abriu pode ter sido um envio anterior (sem `link`) ou alguma chamada ao envio de template ainda está indo sem `link`.
- Como não temos no log o conteúdo final do HTML nem as variáveis recebidas, o caminho mais seguro é:
  1) adicionar logging mínimo para confirmar as variáveis recebidas
  2) criar um fallback no envio do template para nunca deixar `{link}` sem valor no `boas_vindas`.

Implementação proposta (mudanças de código)
1) “Blindagem” no serviço de envio de email (função `send-email`)
   - Antes de aplicar `replaceVariables`, normalizar as variáveis:
     - Converter tudo para string (evita casos de `null`, `number`, etc).
     - Se `template_tipo === 'boas_vindas'` e `vars.link` estiver vazio/ausente, definir:
       - `vars.link = 'https://visitaprova.com.br/auth'`
   - Resultado: mesmo se algum fluxo esquecer de mandar `link`, o email sai correto.

2) Logs de diagnóstico (temporários, mas úteis)
   - No `send-email`, logar (sem dados sensíveis) apenas:
     - `template_tipo`
     - `Object.keys(vars)`
     - Um aviso se ainda sobrar `{link}` no `finalHtml` após o replace (isso indicaria falha real de substituição).
   - No `registro-corretor-autonomo`, logar que está enviando `link` (ex.: “Welcome email vars: nome, email, link”), sem imprimir o email inteiro.

3) Validação / Teste após a correção
   - Fazer 1 novo cadastro teste (ou reenviar um “boas_vindas” via chamada interna) e conferir:
     - Se o email chegar em HTML com botão
     - E, mesmo em “texto simples”, aparecer como:
       - `[https://visitaprova.com.br/auth]Acessar Minha Conta`
     - Em paralelo, checar os logs do `send-email` para confirmar que `link` estava presente (ou foi aplicado via fallback).

Critério de pronto
- Qualquer email de boas-vindas novo deve ter link funcional:
  - HTML: botão abrindo a página de login
  - Texto simples: mostrar a URL real entre colchetes (ou a URL no corpo) sem `{link}`.

Risco / impacto
- Impacto baixo e positivo: só afeta o template `boas_vindas` quando `link` vier ausente.
- Não quebra outros templates e reduz chance de regressão no futuro.

Observação rápida para o seu teste
- Vale confirmar se você abriu o email mais recente (o mais novo na caixa de entrada). Se tiver mais de um “Bem-vindo ao VisitaProva”, pode existir um antigo sem o link corrigido.

Arquivos envolvidos (quando eu for implementar no modo padrão)
- `supabase/functions/send-email/index.ts` (fallback + logs)
- `supabase/functions/registro-corretor-autonomo/index.ts` (log adicional opcional, e manter `link` como já está)
