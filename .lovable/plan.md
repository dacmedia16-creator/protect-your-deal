

## Adicionar edição de Dados do Imóvel e Observações na DetalhesFicha

### Mudanças

| Arquivo | O que fazer |
|---------|------------|
| `src/pages/DetalhesFicha.tsx` | Adicionar estados, handlers e UI de edição inline para o card "Dados do Imóvel" (endereço + tipo) e o card "Detalhes da Visita" (observações). Botão "Editar" visível apenas quando nenhuma parte confirmou (`!proprietario_confirmado_em && !comprador_confirmado_em`). |

### Detalhes

1. **Novos estados**: `editandoImovel`, `editImovelData` (endereco, tipo), `editandoDetalhes`, `editDetalhesData` (observacoes)

2. **Condição de edição**: `const podeEditar = !ficha.proprietario_confirmado_em && !ficha.comprador_confirmado_em && ficha.status !== 'completo' && ficha.status !== 'finalizado_parcial'`

3. **Card "Dados do Imóvel"** (linhas ~1909-1931): Adicionar botão Editar no header (condicional a `podeEditar`). Ao clicar, mostrar inputs para endereço e select para tipo (usando `tiposImovel`). Salvar via `supabase.from('fichas_visita').update(...)`.

4. **Card "Detalhes da Visita"** (linhas ~2176-2202): Adicionar botão Editar no header. Ao clicar, mostrar textarea para observações. Salvar da mesma forma.

5. **Padrão visual**: Mesmo padrão de edição inline já usado nos cards Proprietário/Comprador (botões Cancelar/Salvar, ícones Pencil/X/Save).

