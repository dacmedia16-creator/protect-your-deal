

## Plano: Fluxo de aceite para convites de parceria Construtora → Imobiliária

### Situação atual
Quando a construtora "convida" uma imobiliária, o registro é inserido direto em `construtora_imobiliarias` com `status: 'ativa'`. Não há notificação nem aceite.

### Proposta
Implementar um fluxo de convite com aceite, onde a imobiliária precisa aprovar a parceria antes dela ficar ativa.

### Mudanças

**1. Database — Novo status "pendente" no fluxo**
- Alterar o INSERT para usar `status: 'pendente'` ao invés de `'ativa'`
- Nenhuma migração necessária — a coluna `status` já é `text` e aceita qualquer valor

**2. Notificação para a imobiliária**
- Ao inserir a parceria pendente, enviar notificação via WhatsApp para o admin da imobiliária (buscar telefone via `user_roles` + `profiles`)
- Usar a edge function `send-whatsapp` existente
- Mensagem informando que a construtora X deseja uma parceria, com link para aceitar

**3. Página/UI de aceite na imobiliária**
- No layout da imobiliária, adicionar um indicador de convites pendentes (badge no menu)
- Criar seção em `/empresa/configuracoes` ou nova página `/empresa/parcerias-construtoras` listando convites pendentes
- Cada convite mostra: nome da construtora, data do convite, botões "Aceitar" e "Recusar"
- Aceitar: `UPDATE construtora_imobiliarias SET status = 'ativa'`
- Recusar: `DELETE` ou `UPDATE SET status = 'recusada'`

**4. RLS — Permitir imobiliária atualizar seus convites**
- Adicionar política UPDATE na tabela `construtora_imobiliarias` para `imobiliaria_admin`:
```sql
CREATE POLICY "Imobiliaria admin pode aceitar/recusar parcerias"
  ON public.construtora_imobiliarias
  FOR UPDATE
  TO authenticated
  USING (imobiliaria_id = get_user_imobiliaria(auth.uid())
    AND is_imobiliaria_admin(auth.uid(), imobiliaria_id))
  WITH CHECK (imobiliaria_id = get_user_imobiliaria(auth.uid())
    AND is_imobiliaria_admin(auth.uid(), imobiliaria_id));
```

**5. Ajustes na tela da construtora**
- `ConstutoraImobiliarias.tsx`: mudar INSERT para `status: 'pendente'`
- Mostrar badge "Pendente" nos cards de parceiras com status pendente
- Filtrar parceiras por status (ativa/pendente/recusada)

**6. Ajustes nas queries existentes**
- Queries que usam `construtora_imobiliarias` para vincular empreendimentos devem filtrar apenas `status = 'ativa'`
- A RLS de `empreendimentos` (SELECT para imobiliária parceira) já depende de `empreendimento_imobiliarias`, então não é afetada

### Arquivos afetados
- `src/pages/construtora/ConstutoraImobiliarias.tsx` — status pendente + badge
- Nova página ou seção: `src/pages/empresa/EmpresaParceriasConstrutoras.tsx`
- `src/App.tsx` — nova rota
- `src/components/layouts/ImobiliariaLayout.tsx` — link no menu + badge
- 1 migração SQL — RLS para UPDATE na `construtora_imobiliarias`

### Fluxo resumido
```text
Construtora busca imobiliária
       ↓
Insere construtora_imobiliarias (status: pendente)
       ↓
WhatsApp enviado ao admin da imobiliária
       ↓
Admin da imobiliária vê convite no painel
       ↓
  Aceitar → status: ativa    |    Recusar → status: recusada
```

