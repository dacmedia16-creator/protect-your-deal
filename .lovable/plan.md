

## Sistema de Indicação de Corretores (Referral) — IMPLEMENTADO

### O que foi feito

1. **Tabela `indicacoes_corretor`** com RLS (corretor vê as suas, super_admin vê todas)
2. **Edge function `gerar-codigo-indicacao`** — gera código único IND-XXXXXX
3. **`registro-corretor-autonomo`** e **`registro-imobiliaria`** — aceitam `codigo_indicacao` e vinculam na tabela
4. **`asaas-webhook`** — no primeiro pagamento confirmado, calcula comissão e atualiza status para `comissao_gerada`
5. **Página `/minhas-indicacoes`** — links copiáveis, stats de comissões, histórico
6. **Card "Indique e Ganhe"** no Dashboard do corretor
7. **Configs padrão** em `configuracoes_sistema`: 10% para corretores e imobiliárias
