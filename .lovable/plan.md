

# Melhorar qualidade das imagens de marketing geradas por IA

## Analise do estado atual

A edge function atual usa `google/gemini-3-pro-image-preview` com prompts muito longos (2000+ caracteres). Ela ja tem cenarios detalhados por template e funcionalidade, redimensionamento com ImageScript e overlay de logo.

## Problemas identificados

1. **Prompts longos demais**: Modelos de imagem funcionam melhor com prompts mais concisos e bem estruturados. O prompt atual mistura instrucoes tecnicas (dimensoes, formato) com instrucoes criativas, diluindo o foco.
2. **Sem exemplos de referencia visual**: Nao usa tecnica de "style anchoring" com descricoes de fotografos/estilos conhecidos.
3. **Instrucoes negativas fracas**: O prompt diz o que NAO fazer de forma dispersa. Concentrar e reforcar ajuda muito.
4. **Sem variacao de seed/temperatura**: Cada geracao pode ser muito similar.
5. **Uma unica tentativa**: Se a imagem nao ficar boa, nao ha retry automatico.
6. **Texto na UI nao e adicionado na imagem**: O titulo e subtitulo nao aparecem na imagem final, apenas no prompt como contexto. Poderia usar uma abordagem de 2 etapas: gerar imagem base + adicionar texto com overlay.

## Plano de melhorias

### 1. Reestruturar prompts (mais concisos e eficazes)

Reduzir o prompt principal para ~800 caracteres focados, usando tecnica de "style anchoring":

```
Professional advertising photo, shot by Annie Leibovitz style.
Brazilian real estate agent, 35yo, business casual, confident smile.
Showing smartphone with verification code screen to client.
Modern luxury property entrance, golden hour lighting.
Ultra-realistic, 8K, shallow depth of field, warm tones.
Color palette: navy #0F172A, blue #60A5FA, green #10B981.
NO text, NO logos, NO watermarks. Clean top-left corner.
```

Em vez do prompt atual de 2000+ caracteres com paragrafos descritivos.

### 2. Adicionar overlay de texto na imagem

Usar ImageScript para renderizar o titulo e subtitulo diretamente na imagem, criando um resultado mais profissional e pronto para postar. Atualmente so a logo e sobreposta.

- Titulo em fonte grande, bold, na parte inferior da imagem
- Subtitulo menor abaixo
- Fundo semi-transparente atras do texto para legibilidade
- Posicionamento varia por formato (quadrado, vertical, stories)

### 3. Sistema de retry inteligente

Se a primeira geracao nao retornar imagem, tentar novamente com prompt simplificado automaticamente (max 2 tentativas).

### 4. Adicionar opcao de "refinamento"

Nova flag `refine: true` que faz 2 etapas:
1. Gera imagem base
2. Envia a imagem de volta ao modelo com instrucao de refinamento ("Make this more photorealistic, improve lighting")

### 5. Pre-sets de qualidade visual

Adicionar parametro de qualidade que ajusta o prompt:
- `rapido`: Prompt curto, 1 tentativa
- `premium`: Prompt detalhado, com retry e refinamento

### 6. Cache de prompts otimizados

Manter um mapa de prompts "que funcionaram bem" por combinacao template+funcionalidade, refinados ao longo do tempo.

## Arquivos modificados

1. **`supabase/functions/generate-marketing-image/index.ts`** - Reestruturacao completa dos prompts, adicao de overlay de texto, sistema de retry, opcao de refinamento

2. **`src/pages/admin/AdminMarketingImages.tsx`** - Adicionar toggle de qualidade (rapido/premium), preview do texto na imagem

## Detalhes tecnicos

### Novo formato do prompt (exemplo para template "feature" + funcionalidade "otp-whatsapp"):

```text
Professional advertising photography, Annie Leibovitz style editorial.
Scene: Brazilian real estate agent (35yo, business casual, warm smile) 
showing smartphone verification code screen to impressed client.
Setting: Modern luxury apartment entrance, golden hour lighting.
Phone screen: Clean PIN input with 6 digits, green checkmark.
Style: 8K, shallow DOF, warm cinematic tones.
Palette: navy #0F172A, electric blue #60A5FA, emerald #10B981.
Mood: Trust, security, professionalism, innovation.
AVOID: text, logos, watermarks, signature pads, stylus pens.
Keep top-left 15% clean for logo overlay.
```

### Overlay de texto com ImageScript:

Como ImageScript nao suporta fontes TrueType diretamente, a abordagem sera:
- Usar a API de edicao do proprio Gemini para adicionar texto na imagem gerada
- Enviar a imagem base + instrucao "Add this text overlay: [titulo] in large white bold text at the bottom, with [subtitulo] below in smaller text, on a semi-transparent dark gradient bar"
- Isso gera um resultado mais natural e profissional do que texto programatico

### Sistema de retry:

```typescript
let imageData = null;
let attempts = 0;
const maxAttempts = 2;

while (!imageData && attempts < maxAttempts) {
  attempts++;
  const prompt = attempts === 1 ? fullPrompt : simplifiedPrompt;
  // ... chamada ao AI Gateway
}
```

## Resultado esperado

- Imagens mais fotorrealistas e profissionais
- Texto do titulo/subtitulo visivel na imagem final (pronta para postar)
- Menos falhas de geracao com o sistema de retry
- Opcao de qualidade premium com refinamento em 2 etapas
