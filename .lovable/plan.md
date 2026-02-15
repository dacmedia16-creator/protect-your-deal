

# Adicionar Seletor de Canal WhatsApp nas Configuracoes do Super Admin

## Resumo

Adicionar uma configuracao no painel do Super Admin (AdminConfiguracoes) para escolher qual numero WhatsApp usar como padrao para envios do sistema. A pagina de Integracoes continuara mostrando os cards para teste de conexao, mas a escolha de qual numero usar ficara exclusivamente nas configuracoes do admin.

## Alteracoes

### 1. Criar configuracao no banco de dados

Inserir um registro na tabela `configuracoes_sistema` com a chave `whatsapp_channel_padrao` e valor `default`. As opcoes serao:
- `default` -- Numero padrao (ZionTalk texto)
- `meta` -- Numero oficial Meta (ZionTalk API oficial)

### 2. Atualizar `src/pages/admin/AdminConfiguracoes.tsx`

Adicionar um novo card ou secao dentro do card de "Integracoes" existente com:
- Um seletor (Radio Group ou Select) para escolher entre "Numero Padrao" e "API Oficial Meta"
- Descricao explicando a diferenca entre os dois
- O valor sera salvo na tabela `configuracoes_sistema` com a chave `whatsapp_channel_padrao`

O card de Integracoes existente ja lista "WhatsApp (ZionTalk)" -- sera expandido para incluir o seletor de canal.

### 3. Atualizar edge functions para ler a configuracao

Nas edge functions que enviam WhatsApp (`send-otp`, `process-otp-queue`, `otp-reminder`, etc.), quando nao receberem um `channel` explicito, buscar o valor de `whatsapp_channel_padrao` na tabela `configuracoes_sistema` para decidir qual API Key usar.

## Arquivos modificados

| Arquivo | Alteracao |
|---------|-----------|
| Migration SQL | Inserir registro `whatsapp_channel_padrao` em `configuracoes_sistema` |
| `src/pages/admin/AdminConfiguracoes.tsx` | Adicionar seletor de canal WhatsApp no card de Integracoes |
| `supabase/functions/send-whatsapp/index.ts` | Buscar canal padrao do banco quando `channel` nao for informado |

## Detalhes tecnicos

### Configuracao no banco
```text
INSERT INTO configuracoes_sistema (chave, valor, descricao)
VALUES ('whatsapp_channel_padrao', '"default"', 'Canal WhatsApp padrao para envios do sistema (default ou meta)');
```

### Seletor no AdminConfiguracoes
Dentro do card "Integracoes", adicionar um Select com duas opcoes:
- "Numero Padrao (ZionTalk)" -> valor `default`
- "API Oficial Meta" -> valor `meta`

A mutacao `updateConfigMutation` existente sera reutilizada para salvar a escolha.

### Leitura na edge function
No `send-whatsapp`, quando `channel` nao for passado no request, buscar na tabela `configuracoes_sistema`:
```text
const { data } = await supabaseClient
  .from('configuracoes_sistema')
  .select('valor')
  .eq('chave', 'whatsapp_channel_padrao')
  .single();
const channel = data?.valor || 'default';
```

