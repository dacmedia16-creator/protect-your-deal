
Objetivo: corrigir o motivo real de “fiz o login e não funcionou”.

Diagnóstico confirmado:
- O login do Apolo funcionou.
- O corretor Apolo está vinculado à construtora `Planeta` via `user_roles` com `construtora_id`.
- A ficha dele (`82e90faa-6ed7-430a-90cc-15f1b31ac289`) existe e foi concluída.
- A pesquisa foi enviada automaticamente, então a flag da pesquisa está ativa no backend da construtora.
- Porém, no frontend, a leitura de `construtora_feature_flags` está voltando `[]` para o Apolo.

Causa raiz:
- A tabela `construtora_feature_flags` tem RLS permitindo leitura apenas para:
  - super admin
  - admin da construtora
- O Apolo é `corretor`, não `construtora_admin`.
- Resultado: o backend consegue enviar a pesquisa porque usa privilégio elevado, mas o app do corretor não consegue ler a flag e entende que a pesquisa está “desabilitada”.
- Por isso:
  - o menu “Pesquisas” continua oculto
  - a seção de pesquisa na ficha também pode continuar oculta
  - parece que “não funcionou”, mesmo com a pesquisa já criada

Plano de correção:
1. Criar uma migration para ajustar o RLS de `construtora_feature_flags`.
2. Adicionar uma policy de SELECT para usuários autenticados da própria construtora, usando a função já existente `get_user_construtora(auth.uid())`.
3. Manter as policies atuais de super admin e admin da construtora.
4. Não alterar a lógica do frontend agora, porque ela já está consultando `construtora_feature_flags`; o bloqueio atual é de permissão de leitura.
5. Validar o fluxo completo com o Apolo após a policy:
   - login do Apolo
   - menu “Pesquisas” visível
   - seção de pesquisa visível na ficha
   - pesquisa respondida aparecendo em `/pesquisas`

SQL esperado na migration:
```sql
CREATE POLICY "Users can read own construtora flags"
ON public.construtora_feature_flags
FOR SELECT
TO authenticated
USING (
  construtora_id IS NOT NULL
  AND construtora_id = public.get_user_construtora(auth.uid())
);
```

Resultado esperado após a correção:
- O Apolo conseguirá enxergar a flag da construtora.
- O app vai liberar corretamente o menu e a área de pesquisa.
- As pesquisas já realizadas devem aparecer no login dele, sem precisar recriar nada.

Detalhes técnicos:
- O problema não está no login.
- O problema principal também não está no envio automático da pesquisa.
- O gargalo está no acesso do corretor à tabela `construtora_feature_flags`.
- As queries de `surveys` do corretor já têm chance alta de funcionar depois disso, porque a pesquisa foi criada com `corretor_id` do próprio Apolo.
