

# Plano de Otimização CRO - Site VisitaProva

## Visao Geral

Este plano reestrutura o conteudo e hierarquia do site para maximizar conversao, focando em:
- **Dor + Beneficio direto** no topo
- **Proposta de valor clara** com beneficios reais
- **Prova social e autoridade**
- **Diferenciacao competitiva**
- **CTA unico e claro**

---

## 1. HERO SECTION - Reescrita Completa

### Problema Atual
- Headline focada em funcionalidade ("Fichas de Visita Digitais com Confirmacao Segura")
- Multiplos CTAs competindo (Teste Gratis, Comecar Agora, Como Funciona, Funcionalidades)
- Falta de conexao emocional com a dor do corretor

### Nova Abordagem

**Badge Superior:**
```
"Proteja sua comissao desde a primeira visita"
```

**Headline Principal:**
```
Prove Suas Visitas.
Proteja Sua Comissao.
```

**Subtitulo:**
```
Nunca mais perca um cliente por falta de comprovacao.
Registros digitais com confirmacao via WhatsApp e comprovante PDF verificavel.
```

**CTAs (Hierarquia Clara):**
- **Principal (destaque):** "Criar Conta Gratis" 
- **Secundario (discreto, outline):** "Ver Como Funciona"

### Mudancas Tecnicas
- Remover badges multiplos (manter apenas 1)
- Unificar "Teste Gratis" e "Comecar Agora" em unico CTA
- Remover botoes "Funcionalidades" do hero (ja esta no menu)
- Reduzir animacao pulsante para evitar distracao

---

## 2. NOVA SECAO - Proposta de Valor (apos Hero)

### Nova Secao "Por que corretores escolhem o VisitaProva?"

Criar bloco com 4 beneficios diretos (nao funcionalidades):

| Icone | Titulo | Descricao |
|-------|--------|-----------|
| Shield | Evite conflitos de comissao | Tenha prova documental de que foi voce quem apresentou o imovel |
| FileCheck | Comprove cada visita | Registro com confirmacao das duas partes via WhatsApp |
| Award | Mais profissionalismo | Impressione proprietarios e compradores com processo moderno |
| Scale | Seguranca juridica | Comprovante com QR Code verificavel e protocolo unico |

---

## 3. NOVA SECAO - Diferenciacao Competitiva

### Bloco "Ficha de papel vs VisitaProva"

Tabela comparativa simples e direta:

| Problema com Papel | Solucao VisitaProva |
|--------------------|---------------------|
| Pode ser contestada ou perdida | Registro digital com backup automatico |
| Sem validacao das partes | Confirmacao OTP via WhatsApp |
| Dificil comprovar autenticidade | QR Code + Protocolo unico verificavel |
| Informacoes incompletas | Formulario padronizado e completo |
| Demora para localizar | Busca instantanea por cliente ou imovel |

---

## 4. SECAO FEATURES - Transformar em Beneficios

### Reescrita dos Titulos/Descricoes

**Atual:** "Registros Digitais - Crie registros de visita completos..."  
**Novo:** "Nunca mais perca uma ficha - Todos os dados organizados na nuvem, acessiveis de qualquer lugar"

**Atual:** "Confirmacao via OTP - Envie codigos de confirmacao..."  
**Novo:** "Prova irrefutavel - Proprietario e comprador confirmam a visita via WhatsApp"

**Atual:** "QR Code de Verificacao - Cada comprovante possui..."  
**Novo:** "Autenticidade verificavel - Qualquer pessoa pode escanear e confirmar a validade"

**Atual:** "Comprovante PDF - Apos a confirmacao..."  
**Novo:** "Documento profissional - PDF pronto para apresentar em qualquer negociacao ou disputa"

---

## 5. SECAO COMO FUNCIONA - Adicionar Micro-copy

### Manter 4 passos + adicionar autoridade

Apos os 4 passos, inserir texto de micro-copy:

```
"Registro digital com validade como prova documental.
Cada comprovante possui protocolo unico e QR Code para verificacao instantanea."
```

---

## 6. NOVA SECAO - Prova Social

### Criar bloco de autoridade (antes de Planos)

**Titulo:** "Feito para a realidade do mercado imobiliario"

**Elementos:**
- Icone/badge de autoridade
- Texto: "Desenvolvido em parceria com corretores ativos para resolver problemas reais do dia a dia"
- Frase de validacao: "Utilizado por corretores e imobiliarias que valorizam seguranca e profissionalismo"
- Espaco preparado para depoimentos futuros (componente oculto ou placeholder discreto)

---

## 7. SECAO PLANOS - Melhorias

### Mudancas:
1. Destacar plano intermediario como "Mais escolhido" (badge)
2. Adicionar frases de orientacao por perfil:
   - Plano Gratuito: "Ideal para comecar"
   - Plano Individual: "Ideal para corretores autonomos"
   - Plano Equipe: "Ideal para imobiliarias em crescimento"
3. Adicionar frase de reforco abaixo dos planos:
   ```
   "Menos risco. Mais controle. Mais profissionalismo."
   ```

---

## 8. CTA FINAL - Reescrita Emocional

### Atual:
"Pronto para modernizar suas visitas?"

### Novo:
**Titulo:** "Trabalhe com mais seguranca desde a primeira visita"

**Subtitulo:** "Pare de depender de papeis que se perdem. Comece a construir sua carteira com provas solidas."

**CTA:** "Criar Conta Gratis" (unico botao, sem seta)

---

## 9. HIERARQUIA DE CTAs (Padronizacao)

| Local | CTA Principal | CTA Secundario |
|-------|---------------|----------------|
| Header | "Criar Conta Gratis" | "Entrar" |
| Hero | "Criar Conta Gratis" | "Ver Como Funciona" |
| Apos Planos | "Escolher Plano" (por plano) | - |
| CTA Final | "Criar Conta Gratis" | - |

**Regra:** Usar "Criar Conta Gratis" como CTA unico principal em todo o site.

---

## Arquivos a Modificar

1. **src/pages/Index.tsx**
   - Hero section (linhas 291-336): Reescrever headlines e CTAs
   - Features section (linhas 338-363): Atualizar textos para beneficios
   - Como Funciona (linhas 366-395): Adicionar micro-copy
   - Nova secao: Proposta de Valor (criar apos hero)
   - Nova secao: Diferenciacao (criar antes de features)
   - Nova secao: Prova Social (criar antes de planos)
   - Planos (linhas 397-463): Adicionar badges e orientacao
   - CTA Final (linhas 602-618): Reescrever texto

2. **src/pages/Funcionalidades.tsx**
   - Atualizar textos de features para manter consistencia

3. **src/pages/ComoFunciona.tsx**
   - Adicionar micro-copy de autoridade juridica

---

## Detalhes Tecnicos

### Novas Variaveis/Constantes
```typescript
const valuePropositions = [
  { icon: Shield, title: 'Evite conflitos de comissao', ... },
  { icon: FileCheck, title: 'Comprove cada visita', ... },
  { icon: Award, title: 'Mais profissionalismo', ... },
  { icon: Scale, title: 'Seguranca juridica', ... }
];

const comparisons = [
  { paper: 'Pode ser contestada', visitaprova: 'Registro digital com backup' },
  ...
];
```

### Novo Badge de Destaque (Planos)
```tsx
{plano.nome === 'Individual' && (
  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
    Mais escolhido
  </Badge>
)}
```

---

## Resumo das Entregas

1. Hero com headline focada em dor/beneficio
2. CTA unico "Criar Conta Gratis"
3. Secao de Proposta de Valor (4 beneficios)
4. Secao de Diferenciacao (tabela comparativa)
5. Features reescritos como beneficios
6. Micro-copy de autoridade juridica
7. Bloco de Prova Social
8. Planos com destaque e orientacao por perfil
9. CTA Final emocional

