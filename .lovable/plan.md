

# Atualizar Aba "Criar Conta" para Link Externo

## Resumo

Modificar o botão/aba "Criar Conta" na página `/auth` para redirecionar ao link externo `https://visitaprova.com.br/registro?plano=gratuito` ao invés de exibir o formulário de cadastro.

## Alteração

### Arquivo: `src/pages/Auth.tsx`

#### Localização: Linhas 503-507

**De:**
```tsx
<Tabs defaultValue="login" className="w-full">
  <TabsList className="grid w-full grid-cols-2 mb-6">
    <TabsTrigger value="login">Entrar</TabsTrigger>
    <TabsTrigger value="signup">Criar Conta</TabsTrigger>
  </TabsList>
```

**Para:**
```tsx
<Tabs defaultValue="login" className="w-full">
  <TabsList className="grid w-full grid-cols-2 mb-6">
    <TabsTrigger value="login">Entrar</TabsTrigger>
    <TabsTrigger value="signup" asChild>
      <a href="https://visitaprova.com.br/registro?plano=gratuito">Criar Conta</a>
    </TabsTrigger>
  </TabsList>
```

## Detalhes Técnicos

| Aspecto | Descrição |
|---------|-----------|
| Componente | `TabsTrigger` com prop `asChild` |
| Método | Usar `asChild` para renderizar como `<a>` externo |
| Comportamento | Clique redireciona para URL externa |
| Impacto | A aba "signup" não será mais acessível por tabs, apenas via link externo |

## Resultado

- Ao clicar em "Criar Conta", o usuário será redirecionado para `https://visitaprova.com.br/registro?plano=gratuito`
- A aba "Entrar" continua funcionando normalmente para login
- Mantém visual consistente com o design atual das tabs

