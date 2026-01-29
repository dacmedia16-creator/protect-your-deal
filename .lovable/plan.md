
Objetivo
- Fazer a “aba/botão” **Criar Conta** na tela **/auth** abrir o link externo `https://visitaprova.com.br/registro?plano=gratuito` (e não trocar para a aba interna “signup” que mostra o formulário).

O que está acontecendo (por que não funciona hoje)
- Mesmo tendo colocado `<TabsTrigger value="signup" asChild><a ... /></TabsTrigger>`, o Radix Tabs ainda trata esse item como um “trigger de aba” e acaba **selecionando a aba `signup`** ao invés de navegar para o link. Por isso aparece o formulário do print.

Abordagem (correção)
- Parar de usar `TabsTrigger` para o “Criar Conta”.
- Renderizar “Criar Conta” como um **link `<a>` normal**, estilizado com as mesmas classes visuais do `TabsTrigger`, porém **sem** comportamento de tabs.
- (Opcional, mas recomendado) Remover o `TabsContent value="signup"` para não existir mais a tela interna de cadastro (evita confusão e garante que ninguém “caia” nela).

Mudanças no código (alta confiança)
1) Arquivo: `src/pages/Auth.tsx`
   - Na seção:
     - `TabsList` (onde estão “Entrar” e “Criar Conta”)
   - Substituir:
     - `<TabsTrigger value="signup" asChild>...`
   - Por:
     - Um `<a href="https://visitaprova.com.br/registro?plano=gratuito">Criar Conta</a>` simples
     - Com `className` copiado/compatível com o estilo base do `TabsTrigger` (para manter o mesmo visual).
     - Adicionar `rel="noreferrer"` (boa prática) e manter navegação na mesma aba (default).
2) (Recomendado) Ainda em `src/pages/Auth.tsx`
   - Remover completamente o bloco:
     - `<TabsContent value="signup"> ...form... </TabsContent>`
   - E, se ficar código morto, limpar:
     - estados/handlers relacionados a `signup` que não serão mais usados (opcional para esta etapa; podemos fazer em seguida se você quiser).

Critérios de aceite (como você valida)
- Acessar `/auth`
- Clicar em **Criar Conta**
  - Deve navegar para `https://visitaprova.com.br/registro?plano=gratuito`
  - Não deve mais “abrir” a tela interna de cadastro (o formulário do print).

Observações / Edge cases
- Isso funciona tanto no navegador quanto em PWA, porque é uma navegação padrão por URL.
- Se você quiser que abra em nova aba, dá para adicionar `target="_blank"` (me avise se prefere assim).

Arquivos envolvidos
- `src/pages/Auth.tsx` (único arquivo necessário para a correção principal)
