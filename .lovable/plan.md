

## Plano: Atualizar Logo no Gerador de Imagens de Marketing

### Problema
A edge function `generate-marketing-image` busca o logo de `logos-imobiliarias/vp-logo.png` no Storage. Esse arquivo é o logo antigo. O logo atual (`/vp-logo.png`) está apenas no diretório `public/` do frontend, não no bucket do Storage.

### Solução
Há duas abordagens possíveis:

**Opção 1 — Upload do logo atual para o Storage (recomendada)**
- Criar um script que faça upload do `vp-logo.png` atual para o bucket `logos-imobiliarias` no Storage, substituindo o arquivo antigo
- Isso não requer mudança de código na edge function

**Opção 2 — Usar o logo SVG inline na edge function**
- Embutir o logo SVG diretamente no código da função, eliminando a dependência do Storage
- Mais complexo pois requer conversão SVG→raster dentro da função

### Alterações

**`supabase/functions/generate-marketing-image/index.ts`**
- Atualizar o path do logo no Storage para usar uma URL pública do site ao invés do bucket, apontando para o logo atualizado:
  - Trocar `${SUPABASE_URL}/storage/v1/object/public/logos-imobiliarias/vp-logo.png` por uma URL que aponte para o logo correto
  - Alternativa: usar a URL pública do app `https://protect-your-deal.lovable.app/vp-logo.png` como fonte do logo

Isso garante que a edge function sempre use o logo mais recente do site publicado, sem precisar manter uma cópia separada no Storage.

