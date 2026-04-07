
Diagnóstico revisado da ficha VS266F1823

O problema real não é a regra de “finalização parcial”.
Essa ficha pode, sim, ser finalizada com apenas 1 assinatura — e de fato ela já tem 1 confirmação válida.

O que confirmei:
- A ficha VS266F1823 está com status atual `aguardando_proprietario`
- O comprador já confirmou
- O proprietário ainda não confirmou
- O sistema chegou a gerar o PDF parcial com sucesso
- Depois disso, a tentativa de gerar o backup falhou porque o registro continuou com status antigo no banco

Motivo exato da falha:
- Quem tentou finalizar foi o usuário Edson Dias, com perfil `imobiliaria_admin`
- A ficha pertence ao corretor Juliano Moraes
- Hoje, a permissão de atualização dessa tabela permite alterar a ficha apenas para:
  - corretor dono da ficha
  - corretor parceiro
  - líder da equipe do corretor
  - super admin
- Não existe permissão de atualização para `imobiliaria_admin` nas fichas da própria imobiliária

Por isso o comportamento ficou “enganoso”:
1. a tela permitiu clicar em “Finalizar Parcialmente” porque há 1 assinatura
2. a aplicação tentou atualizar o status para `finalizado_parcial`
3. essa atualização não foi aplicada por permissão
4. como o front não valida se a linha foi realmente alterada, ele continuou
5. o PDF parcial foi gerado
6. o backup falhou com erro porque o backend ainda enxergou a ficha como `aguardando_proprietario`

Evidências que batem com isso:
- A ficha continua com status `aguardando_proprietario`
- O campo de documento gerado foi atualizado, mostrando que o PDF saiu
- O backup retornou erro de “registro não está finalizado”
- Não encontrei vínculo de liderança ativo entre o usuário que tentou finalizar e o corretor dono da ficha

Conclusão objetiva:
- Você está certo: essa ficha já atende a condição funcional para finalização parcial
- O bloqueio não é de negócio; é de permissão de atualização
- Nesta ficha específica, o usuário que tentou finalizar pode visualizar, mas não pode mudar o status dela

Correção mínima e segura a implementar depois:
1. decidir se administrador da imobiliária deve poder finalizar fichas da própria imobiliária
2. alinhar a permissão do backend com essa regra
3. fazer a tela confirmar que o status realmente mudou antes de seguir para PDF e backup, para não mascarar esse erro
