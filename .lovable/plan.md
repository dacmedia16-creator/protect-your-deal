

## Plano: Aumentar tamanho do avatar do Perfil

Aumentar o avatar de `h-8 w-8` (32px) para `h-10 w-10` (40px) nos dois locais onde aparece.

### Alterações

**1. `src/pages/Dashboard.tsx` (linha 372)**
- `Avatar className="h-8 w-8"` → `Avatar className="h-10 w-10"`
- `AvatarFallback className="text-xs ..."` → `"text-sm ..."`

**2. `src/components/MobileHeader.tsx` (linha 123)**
- `Avatar className="h-8 w-8"` → `Avatar className="h-10 w-10"`
- `AvatarFallback className="text-xs ..."` → `"text-sm ..."`

