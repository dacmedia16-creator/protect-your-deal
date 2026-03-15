

## Habilitar Proteção contra Senhas Vazadas (HIBP)

### O que é
A proteção contra senhas vazadas verifica se a senha escolhida pelo usuário aparece em bancos de dados de vazamentos conhecidos (Have I Been Pwned). Quando habilitada, impede que usuários usem senhas comprometidas.

### Como resolver
Esta é uma **configuração de autenticação**, não requer migração SQL ou mudança de código.

**Passos:**
1. Abra a aba **Cloud** no seu projeto
2. Vá em **Users** → **Auth settings** (ícone de engrenagem)
3. Na seção de configurações de email/senha, habilite **Password HIBP Check**
4. Salve as alterações

### Após habilitar
Marcarei o finding como resolvido no scanner de segurança.

### Escopo
- 0 arquivos alterados
- 0 migrations
- 1 configuração manual pelo usuário na UI do Cloud

