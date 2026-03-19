

## Cupom Automático de Rastreamento para Afiliados

### O que será feito

Quando um afiliado for criado (pelo admin), o sistema gerará automaticamente um cupom de rastreamento com 0% de desconto. Isso permite que o afiliado compartilhe um link de cadastro (`?ref=CODIGO`) sem que o cliente precise digitar nada, e toda a lógica existente de comissões via `cupons_usos` e `asaas-webhook` continua funcionando sem alterações.

### Mudanças

#### 1. Gerar cupom automático ao criar afiliado
**Arquivo:** `src/pages/admin/AdminAfiliados.tsx`
- Após o `insert` na tabela `afiliados`, inserir automaticamente um cupom na tabela `cupons` com:
  - `codigo`: nome do afiliado em uppercase, sem espaços, sem acentos (ex: "FERNANDA", "JOAOSILVA")
  - `tipo_desconto`: "percentual"
  - `valor_desconto`: 0
  - `comissao_percentual`: valor padrão da `configuracoes_sistema` (ou 10%)
  - `ativo`: true
- Se o código já existir, adicionar sufixo numérico (ex: "FERNANDA2")

#### 2. Seção "Meu Link de Indicação" no painel do afiliado
**Arquivo:** `src/pages/afiliado/AfiliadoDashboard.tsx`
- Adicionar card com o link de registro personalizado usando o código do primeiro cupom ativo
- Formato: `{origin}/registro-tipo?ref=CODIGO`
- Botão "Copiar link" com feedback visual
- Se tiver múltiplos cupons, mostrar um link por cupom ativo

#### 3. Ler `?ref=` nas páginas de registro e auto-preencher cupom
**Arquivos:** `src/pages/auth/RegistroCorretorAutonomo.tsx`, `src/pages/auth/RegistroImobiliaria.tsx`
- Ler `searchParams.get('ref')` na inicialização
- Se presente, preencher automaticamente o campo de cupom e disparar validação via `validar_cupom`
- Mostrar badge "Cupom aplicado automaticamente" e desabilitar edição do campo

#### 4. Propagar `ref` param no seletor de tipo de registro
**Arquivo:** `src/pages/auth/RegistroTipo.tsx`
- Ler `?ref=` e incluir nas URLs de navegação para `/registro-autonomo` e `/registro`

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/admin/AdminAfiliados.tsx` | Criar cupom automático ao criar afiliado |
| `src/pages/afiliado/AfiliadoDashboard.tsx` | Seção "Meu Link" com botão copiar |
| `src/pages/auth/RegistroCorretorAutonomo.tsx` | Ler `?ref=` e auto-preencher cupom |
| `src/pages/auth/RegistroImobiliaria.tsx` | Ler `?ref=` e auto-preencher cupom |
| `src/pages/auth/RegistroTipo.tsx` | Propagar `ref` param |

### O que NÃO muda
- Tabelas do banco (nenhuma migration necessária)
- Edge functions de registro e webhook (lógica de comissões intacta)
- Fluxo de pagamento e cálculo de comissões

