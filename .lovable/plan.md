

## Plano: Botão flutuante de WhatsApp na página inicial

### Implementação

1. **Criar `src/components/WhatsAppFAB.tsx`**:
   - Botão circular fixo no canto inferior direito, cor verde (#25D366)
   - Ícone SVG do WhatsApp
   - Link abre `https://wa.me/5515998459830` em nova aba
   - Animação pulse sutil

2. **Adicionar na `src/pages/Index.tsx`**:
   - Importar e renderizar `<WhatsAppFAB />` no final do componente

