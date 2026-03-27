

## Plano: Adicionar foto do fundador na página Nossa História

### Alteração

**1. Copiar imagem para o projeto**
- `user-uploads://DenisfotoBanner.png` → `src/assets/DenisfotoBanner.png`

**2. Editar `src/pages/NossaHistoria.tsx` — Seção 2 (Fundador, linhas 196-233)**

Transformar o layout atual (centralizado, apenas texto) em um grid de 2 colunas no desktop:
- **Coluna esquerda**: texto atual (badge, título, citação, frase de destaque)
- **Coluna direita**: foto do fundador com tratamento premium — imagem com `rounded-2xl`, sombra suave, e abaixo da foto o nome "Denis" + cargo "Fundador & CEO · Corretor de Imóveis"

No mobile, a foto aparece acima do texto (stack vertical).

Import no topo do arquivo:
```typescript
import denisPhoto from "@/assets/DenisfotoBanner.png";
```

### Design da foto
- Container com `rounded-2xl overflow-hidden shadow-lg`
- Imagem `object-cover` com aspect ratio natural
- Caption elegante abaixo: nome em bold + cargo em `text-muted-foreground text-sm`
- Envolvida em `AnimatedSection` com direction `right` para entrada lateral

