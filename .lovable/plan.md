

## Adicionar upload de foto nos depoimentos

### Resumo
Permitir que o super admin faça upload de uma foto ao cadastrar/editar um depoimento. A foto será armazenada no storage e exibida no card da landing page.

### Mudanças

| Arquivo/Recurso | O que fazer |
|-----------------|------------|
| **Migration SQL** | Criar bucket `depoimentos` (público) no storage com política de leitura pública e upload/delete para super_admin |
| `src/pages/admin/AdminDepoimentos.tsx` | Adicionar campo de upload de foto no dialog de criar/editar. Ao selecionar imagem, fazer upload para o bucket `depoimentos`, salvar a URL pública no campo `avatar_url` da tabela. Mostrar preview da foto atual. Permitir remover foto |
| `src/components/DepoimentosSection.tsx` | Já suporta `avatar_url` — nenhuma mudança necessária |

### Detalhes técnicos

**Storage bucket:**
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('depoimentos', 'depoimentos', true);
-- RLS: leitura pública, upload/delete para super_admin
```

**Admin dialog — campo de foto:**
- Input file com accept `image/*`, limite 2MB
- Preview da imagem atual (se houver)
- Botão para remover foto
- Upload ao selecionar arquivo, salva URL no `avatar_url`

