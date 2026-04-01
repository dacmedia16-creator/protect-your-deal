

## Plano: Mover Sofia para a barra de navegação inferior

Transformar a Sofia de botão flutuante em item da barra de navegação inferior, ao lado de "Pesquisas".

### Alterações

**1. `src/components/MobileNav.tsx`**
- Importar `MessageCircle` do lucide-react
- Adicionar um botão "Sofia" após os navItems existentes (sempre visível, não condicional)
- Ao clicar, disparar um evento customizado (`window.dispatchEvent(new CustomEvent('toggle-sofia'))`) para abrir/fechar o chat
- Estilizar igual aos outros itens da nav

**2. `src/components/ChatAssistente.tsx`**
- Escutar o evento `toggle-sofia` para abrir/fechar o chat
- **No mobile (logado)**: remover o botão flutuante — a Sofia só abre via nav bar
- **No desktop e não-logado**: manter o botão flutuante como está
- Quando aberto via nav, posicionar o chat acima da nav bar (`bottom-16`)
- Remover o tooltip "Posso te ajudar?" no mobile logado (já que está na nav)

### Resultado
- Nav inferior: Início | Registros | Convites/Equipe | Pesquisas | Sofia
- Desktop: comportamento inalterado (botão flutuante)

