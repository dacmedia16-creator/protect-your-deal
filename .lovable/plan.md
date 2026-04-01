

## Plano: Redesign do Dashboard do Corretor (estilo app bancário)

Inspirado na imagem de referência (app com header azul escuro, ícones de ações rápidas em grid, saldo destacado, e cards arredondados), vamos modernizar o layout mobile do Dashboard.

### Alterações em `src/pages/Dashboard.tsx`

**1. Novo Header Mobile com gradiente azul escuro**
- Substituir o header atual por um header com fundo gradiente azul escuro (primary → slate-900)
- Nome do usuário e saudação em branco sobre o fundo escuro
- Logo da imobiliária no canto superior

**2. Card de destaque com estatísticas principais**
- Card flutuante (com margin-top negativo, sobrepondo o header) mostrando o total de registros como número grande central
- Abaixo, 3 mini-indicadores inline: Total | Confirmadas | Pendentes
- Visual similar ao "saldo" do app da foto

**3. Grid de ações rápidas (ícones circulares)**
- Substituir a lista vertical de ações por um grid 4 colunas com ícones circulares + label abaixo
- Itens: Novo Registro, Ver Registros, Convites, Ajuda Jurídica (+ Construtoras se aplicável)
- Estilo: ícone dentro de círculo colorido, texto pequeno abaixo

**4. Cards inferiores mantidos mas com visual refinado**
- Manter cards de parceiro, pesquisas, indicações, equipe
- Adicionar bordas mais suaves e espaçamento melhorado

**5. Desktop mantém layout atual** (mudanças focadas no mobile `sm:hidden`)

### Detalhes técnicos
- Todas as mudanças em `src/pages/Dashboard.tsx`
- Pode precisar de pequenos ajustes em `src/index.css` para o gradiente do header
- Nenhuma mudança de lógica/dados, apenas visual
- Mantém todos os `data-tour` attributes para o onboarding

