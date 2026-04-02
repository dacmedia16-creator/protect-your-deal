

## Plano: Adicionar botão de mostrar/ocultar senha no login

### Alteração

**`src/pages/Auth.tsx`**

1. Adicionar estado `showPassword` no componente
2. Importar ícones `Eye` e `EyeOff` de lucide-react
3. Substituir o `<Input>` de senha (linhas 591-598) por um campo com botão de toggle, usando `type={showPassword ? 'text' : 'password'}` e um botão com ícone de olho posicionado à direita do input (mesmo padrão usado em `RedefinirSenha.tsx`)

### Resultado
O campo de senha na tela de login terá um ícone de olho para mostrar/ocultar a senha digitada.

