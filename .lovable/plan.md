

# Adicionar foto dos prêmios REMAX à página /denis

## Análise
A foto mostra Denis segurando troféus e certificados da REMAX — encaixa perfeitamente na seção "Minha Trajetória", junto ao item da timeline "Campeão de Vendas 2× consecutivas" (2021–2022). O melhor local é substituir a imagem `ceo-photo.png` no "highlight card" (linhas 256-269) que já fala sobre os prêmios REMAX e comissões, ou adicionar a foto como um segundo bloco visual ali.

## Plano

### 1. Copiar a imagem para o projeto
- Copiar `user-uploads://IMG_5273.JPEG` para `src/assets/denis-premios-remax.jpeg`

### 2. Modificar `src/pages/Denis.tsx`
- Importar a nova imagem: `import denisPremios from "@/assets/denis-premios-remax.jpeg"`
- No "highlight card" da seção Trajetória (linha 256-269), trocar a imagem `denisCeo` pela nova `denisPremios`, já que esse card fala especificamente sobre os prêmios REMAX e comissões — a foto dos troféus é muito mais relevante ali
- Ajustar o `alt` para "Denis Souza com troféus e certificados REMAX"

Apenas 1 arquivo modificado, 1 asset adicionado. Sem mudança de layout ou estrutura.

