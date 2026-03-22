

## Adicionar vídeo "Como se Cadastrar" na página de Tutoriais

### Mudanças

| Arquivo | O que fazer |
|---------|------------|
| `public/videos/` | Copiar o vídeo enviado como `tutorial-cadastro.mp4` |
| `src/pages/Tutoriais.tsx` | Adicionar item "Como se Cadastrar" como **primeiro** no índice e no grid de vídeos |

### Detalhes

- Novo item no índice (posição 1): `Como se Cadastrar`
- Os demais itens descem uma posição na numeração
- Card com `id="cadastro"`, vídeo apontando para `/videos/tutorial-cadastro.mp4`, título `📋 Como se Cadastrar`

