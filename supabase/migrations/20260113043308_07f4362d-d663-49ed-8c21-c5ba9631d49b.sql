-- Deletar o plano "Individual" que não está na lista
DELETE FROM planos WHERE id = 'f3fc6f02-a0dd-4b51-8d1f-6c439aadb1c2';

-- Atualizar "Gratuito CPF" para 2 registros/mês (conforme imagem)
UPDATE planos 
SET max_fichas_mes = 2 
WHERE id = '0da92038-fdf0-4185-a5aa-f1ae5ef179b0';