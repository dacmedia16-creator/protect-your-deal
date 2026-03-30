

## Plano: Mover Depoimentos para antes dos Planos e Preços

### Alteração em `src/pages/Index.tsx`

Mover a linha `<DepoimentosSection />` (linha 776) para antes da seção de Pricing (linha 650), ficando entre a seção Sofia e a seção de Planos.

**Ordem atual:** Sofia → Planos e Preços → Depoimentos → FAQ
**Ordem nova:** Sofia → Depoimentos → Planos e Preços → FAQ

### Detalhes técnicos
- Remover `<DepoimentosSection />` da linha 776
- Inserir `<DepoimentosSection />` entre as linhas 648-650 (após `</section>` da Sofia e antes do comentário `{/* Pricing Section */}`)

