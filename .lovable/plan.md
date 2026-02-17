

# Atualizar CORS Headers de Todas as Edge Functions

## Resumo

46 funcoes no total. 6 ja tem os headers corretos (`create-survey`, `send-whatsapp`, `send-otp`, `get-otp-info`, `verify-otp`, `generate-marketing-image`). As 40 restantes precisam ser atualizadas.

## Alteracao

Em cada funcao, substituir a linha `Access-Control-Allow-Headers` de:

```
authorization, x-client-info, apikey, content-type
```

Para:

```
authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version
```

## Lista completa das 40 funcoes a atualizar

### Com aspas simples (29 funcoes):
1. `aceitar-convite-externo/index.ts`
2. `aceitar-convite-parceiro/index.ts`
3. `admin-create-user/index.ts`
4. `admin-delete-user/index.ts`
5. `admin-promote-corretor/index.ts`
6. `admin-reset-corretor-password/index.ts`
7. `admin-update-corretor/index.ts`
8. `admin-update-user/index.ts`
9. `admin-vincular-usuario/index.ts`
10. `app-version/index.ts`
11. `asaas-cancel-subscription/index.ts`
12. `asaas-create-customer/index.ts`
13. `asaas-create-subscription/index.ts`
14. `asaas-payment-link/index.ts`
15. `asaas-webhook/index.ts`
16. `asaas-webhook-test/index.ts`
17. `chat-assistente/index.ts`
18. `elevenlabs-tts/index.ts`
19. `empresa-delete-corretor/index.ts`
20. `enviar-convite-parceiro/index.ts`
21. `generate-pdf/index.ts`
22. `get-ficha-externa/index.ts`
23. `get-imobiliaria-by-email/index.ts`
24. `get-survey-by-token/index.ts`
25. `otp-reminder/index.ts`
26. `process-otp-queue/index.ts`
27. `regenerate-backup/index.ts`
28. `register-version/index.ts`
29. `serve-survey-meta/index.ts`
30. `submit-survey-response/index.ts`
31. `survey-og/index.ts`
32. `survey-og-page/index.ts`
33. `text-to-speech/index.ts`
34. `verify-comprovante/index.ts`
35. `verify-pdf-integrity/index.ts`

### Com aspas duplas (11 funcoes):
36. `admin-create-corretor/index.ts`
37. `admin-criar-acesso-afiliado/index.ts`
38. `admin-fix-inconsistencies/index.ts`
39. `admin-get-corretores-emails/index.ts`
40. `admin-list-users/index.ts`
41. `admin-reset-password/index.ts`
42. `master-login/index.ts`
43. `registro-corretor-autonomo/index.ts`
44. `registro-imobiliaria/index.ts`
45. `seed-test-admin/index.ts`
46. `send-email/index.ts`

## Funcoes ja atualizadas (nao serao tocadas)

- `create-survey` - ja atualizada
- `send-whatsapp` - ja atualizada
- `send-otp` - ja atualizada
- `get-otp-info` - ja atualizada
- `verify-otp` - ja atualizada
- `generate-marketing-image` - ja atualizada

## Impacto

- 40 arquivos modificados, 1 linha cada
- Todas as funcoes serao redeployadas
- Nenhuma mudanca de logica, apenas CORS headers
- Resolve problemas intermitentes de conexao em clientes Supabase modernos
