

## Plano: Mostrar campo de teste sempre visível no card Meta 2

Atualmente o campo de envio de teste no card "ZionTalk Meta 2" só aparece após clicar "Testar Conexão" com sucesso (`meta2Status === 'connected'`). A alteração remove essa condição, tornando o campo sempre visível.

### Alteração

**`src/pages/Integracoes.tsx`**: Remover a condição `{meta2Status === 'connected' && (...)}` do bloco de teste do Meta 2, exibindo os campos de número e botão de envio sempre, independente do status de conexão.

