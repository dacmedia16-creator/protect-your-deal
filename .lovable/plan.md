

## Plano: Refinar e elevar a página Nossa História

Ajustes cirúrgicos na copy, hierarquia visual e presença do fundador, sem refazer a estrutura.

### Arquivo: `src/pages/NossaHistoria.tsx`

**1. Hero (linhas 140-194)**
- Atualizar headline: adicionar "real do mercado" → "Foi dessa dor **real do mercado** que nasceu o Visita Prova."
- Atualizar subheadline com copy refinada ("provar meu trabalho" etc.)
- Adicionar bloco de presença do fundador logo abaixo dos CTAs: foto pequena circular + "Denis Souza" + "Fundador do Visita Prova | Corretor de imóveis" + frase curta italic

**2. Seção Fundador (linhas 196-255)**
- Atualizar título h2: "Essa não é uma história criada para vender software. **É a origem real do Visita Prova.**"
- Caption sob a foto: "Denis Souza" (nome completo)
- Dar mais destaque à citação "Eu criei por necessidade": aumentar tamanho para `text-2xl md:text-3xl`, adicionar card com `bg-primary/5 border-primary/20 rounded-2xl p-8` em vez de apenas `border-l-4`

**3. Timeline (linhas 257-283)**
- Substituir os 9 itens pelos textos refinados do briefing (mais humanos, primeira pessoa)

**4. Seção Dor/Impacto (linhas 286-316)**
- Dar mais destaque à frase-chave: aumentar para `text-2xl md:text-3xl`, adicionar mais padding (`p-10 md:p-14`), e `border-l-4 border-primary` no card

**5. Seção Provar (linhas 318-355)**
- Transformar a citação final de `border-l-4` para um card central maior: `bg-card border rounded-2xl p-8 md:p-10 text-center` com tipografia `text-xl md:text-2xl lg:text-3xl`

**6. Seção Injustiça (linhas 357-384)**
- Adicionar frase de reforço antes do parágrafo: "Eu ganhei a ação principal. E ainda assim, quase 3 anos depois, continuo sem receber."
- Ajustar copy do parágrafo para primeira pessoa ("eu já tinha investido")
- Estilo da frase de reforço: `text-xl md:text-2xl font-display font-bold text-foreground mb-6`

**7. Seção Origem do Produto (linhas 416-453)**
- Título: "Foi assim que uma dor real se transformou no **Visita Prova.**"
- Adicionar frase entre texto e cards: "O corretor não deveria descobrir tarde demais que trabalhou sem proteção." em card com `bg-primary/5 border-primary/20`

**8. Seção Propósito (linhas 507-535)**
- Adicionar frase "Eu transformei uma dor real em uma solução real." já existe — dar mais destaque visual com card `bg-primary/5` em vez de `border-l-4`

**9. CTA Final (linhas 572-614)**
- Atualizar copy: "provas improvisadas" em vez de "prova"
- Manter estrutura

**10. Seção Comparativo (linhas 455-505)**
- Adicionar mais respiro: `py-24 md:py-32` e `mb-16` no header

Nenhuma dependência nova. Apenas edições de copy e classes CSS no arquivo existente.

