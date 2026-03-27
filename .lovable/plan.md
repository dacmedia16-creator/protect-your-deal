

## Plano: Proprietário pré-preenchido e pré-confirmado em fichas de construtora

### Contexto
Quando um corretor vinculado a uma construtora cria uma ficha, a construtora é a proprietária do imóvel. Portanto, os dados do proprietário devem ser preenchidos automaticamente com os dados da construtora (nome, CNPJ, telefone) e a confirmação OTP do proprietário deve ser dispensada (já marcada como confirmada).

### Mudanças

**1. `src/pages/NovaFicha.tsx` — Detectar corretor de construtora e pré-preencher**
- Extrair `construtoraId` e `construtora` de `useUserRole()`
- Se `construtoraId` existir:
  - Forçar `modoCriacao` para `'comprador'` (esconder seção proprietário do formulário)
  - No `handleSubmit`, preencher automaticamente:
    - `proprietario_nome` = nome da construtora
    - `proprietario_cpf` = CNPJ da construtora
    - `proprietario_telefone` = telefone da construtora
    - `proprietario_autopreenchimento` = false (dados reais, não autopreenchimento)
    - `construtora_id` = construtoraId
    - `proprietario_confirmado_em` = `new Date().toISOString()` (marcar como já confirmado)
  - Status inicial: `'aguardando_comprador'` ao invés de `'pendente'`
  - Apenas enfileirar OTP do comprador (não do proprietário)
  - Mostrar um card informativo: "O proprietário será preenchido automaticamente com os dados da construtora"
  - Esconder a opção de modo de criação (RadioGroup) ou mostrar apenas "Completo" que na verdade só pede comprador

**2. `src/pages/NovaFicha.tsx` — Resolver `construtora_id` no backend**
- Adicionar chamada `supabase.rpc('get_user_construtora', { _user_id: user.id })` para obter o `construtora_id` do corretor
- Usar no INSERT da ficha

**3. `src/pages/DetalhesFicha.tsx` — Tratar proprietário já confirmado**
- Quando `proprietario_confirmado_em` já estiver preenchido mas não houver OTP de proprietário, mostrar badge "Proprietário: Construtora (confirmado automaticamente)" ao invés de botão para enviar OTP
- O fluxo de PDF deve funcionar normalmente pois `proprietario_confirmado_em` já estará preenchido

**4. `supabase/functions/verify-otp/index.ts` — Sem alteração necessária**
- O fluxo de OTP do comprador continua normal
- Quando o comprador confirmar, o status mudará para `completo` (pois `proprietario_confirmado_em` já existe)
- A geração de PDF e emails funcionarão normalmente

**5. Validação de limites (check_plan_limits)**
- Como o corretor da construtora pode não ter `imobiliaria_id`, verificar se a lógica de limites funciona com `construtora_id` nas assinaturas — já existe tratamento para corretor autônomo, mas pode precisar de ajuste para construtora

### Arquivos afetados
- `src/pages/NovaFicha.tsx` — lógica principal de pré-preenchimento
- `src/pages/DetalhesFicha.tsx` — UI para proprietário já confirmado (construtora)

### Fluxo resumido
```text
Corretor de construtora abre /fichas/nova
       ↓
Dados do proprietário = dados da construtora (automático)
       ↓
Preenche apenas dados do comprador + imóvel
       ↓
INSERT com proprietário preenchido + confirmado_em + status: aguardando_comprador
       ↓
OTP enviado apenas para o comprador
       ↓
Comprador confirma → status: completo → PDF gerado
```

