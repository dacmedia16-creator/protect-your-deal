

# Validação Pós-Lote 3 — Auth Multi-Role

## 1. Checklist de validação manual

### admin-get-corretores-emails
- [ ] Super admin consegue buscar emails de corretores de qualquer imobiliária
- [ ] Admin de imobiliária consegue buscar emails apenas dos seus corretores
- [ ] Admin de imobiliária NÃO recebe emails de corretores de outra imobiliária
- [ ] Request com user_ids vazio retorna `{ emails: {} }` sem erro
- [ ] Corretor comum recebe 403

### admin-reset-corretor-password
- [ ] Super admin reseta senha de qualquer corretor
- [ ] Admin de imobiliária reseta senha apenas de corretor da sua imobiliária
- [ ] Admin de construtora reseta senha apenas de corretor da sua construtora
- [ ] Admin de imobiliária NÃO consegue resetar senha de corretor de outra org
- [ ] Senha com menos de 6 caracteres retorna erro 400
- [ ] Corretor comum recebe 403

### admin-update-corretor
- [ ] Super admin edita qualquer campo de qualquer corretor
- [ ] Admin de imobiliária edita corretor da sua org (nome, telefone, creci, cpf, email, ativo)
- [ ] Admin de construtora edita corretor da sua org
- [ ] Líder de equipe consegue apenas ativar/desativar membro da sua equipe
- [ ] Líder de equipe NÃO consegue editar nome/telefone/creci de membro
- [ ] Líder de equipe NÃO consegue alterar corretor fora da sua equipe
- [ ] Desativação limpa telefone e transfere fichas (quando admin faz, não líder)
- [ ] Corretor comum sem liderança recebe 403

## 2. Maior atenção: admin-update-corretor

Três razões:
1. **Fluxo híbrido** — é a única função com fallback de `requireAnyRole` → `requireAuth` + RPC. Se o fallback falhar silenciosamente, líderes perdem acesso sem mensagem clara.
2. **Lógica de negócio densa** — deativação dispara efeitos colaterais (limpar telefone, transferir fichas, limpar parceiro). Qualquer regressão aqui afeta dados de produção.
3. **4 caminhos de autorização** — super_admin, imobiliária_admin, construtora_admin, líder. Mais caminhos = mais superfície de regressão.

## 3. Regressões mais prováveis no fluxo híbrido

| Cenário | Risco | Sintoma |
|:---|:---|:---|
| Líder recebe 403 direto | Alto | `requireAnyRole` retorna Response e o código não faz fallback corretamente |
| Líder consegue editar campos além de `ativo` | Médio | Guard de campos não é atingido porque `isLiderOfMembro` não é setado corretamente |
| Admin de construtora perde acesso | Médio | `construtoraAdminRole` não é extraído do `roleData` corretamente |
| Deativação por líder transfere fichas indevidamente | Baixo | Flag `isLiderOfMembro` não é usada no guard de transferência |

## 4. O que monitorar nos logs (24h)

- **Erros 403 inesperados** em `admin-update-corretor` — pode indicar que líderes perderam acesso
- **Erros 500** em qualquer das 3 funções — indica problema no helper ou no scoping
- **Ausência de logs** "admin-update-corretor: isLiderOfMembro: true" quando líder tenta ativar/desativar — indica que o fallback não está sendo atingido
- **Logs de boot/shutdown normais** — confirmar que as funções estão deployando sem crash

## 5. RLS, permissões e escopo organizacional

- Confirmar que nenhuma das 3 funções faz query direta sem `supabaseAdmin` (service role) — todas devem usar o client retornado pelo helper
- Verificar que o scoping por `imobiliaria_id` / `construtora_id` continua no corpo de cada função (não foi movido para o helper por design)
- Confirmar que o `roleData` retornado inclui `imobiliaria_id` e `construtora_id` (o select do helper faz `.select("role, imobiliaria_id, construtora_id")`)

## 6. Critério de encerramento do Lote 3

O lote está encerrado quando:
1. **48h sem erros 500** nas 3 funções migradas
2. **Zero relatos** de líder de equipe perdendo acesso a ativar/desativar
3. **Zero relatos** de admin de construtora/imobiliária sem acesso a reset de senha ou edição
4. **Grep confirmado**: zero `createClient` local nas 3 funções
5. **Docs atualizados**: `edge-functions-security.md` reflete o estado real

## 7. Próximo lote (sem reabrir Lote 3)

Candidatas naturais para o Lote 4:
1. **Migrar `admin-create-corretor`** — usa createClient local + auth manual
2. **Migrar `admin-create-user`** — mesma situação
3. **Migrar `admin-promote-corretor`** — já usa construtora_admin, encaixa em `requireAnyRole`
4. **Avaliar `empresa-delete-corretor`** — função longa com auth local e lógica de cleanup

Foco: continuar padronização de auth em funções de escrita (create/promote/delete), sem tocar em funções já migradas nos Lotes 2 e 3.

