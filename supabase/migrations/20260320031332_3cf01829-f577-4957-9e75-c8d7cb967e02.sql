CREATE POLICY "Authenticated pode ler config indicacao"
ON public.configuracoes_sistema
FOR SELECT
TO authenticated
USING (chave IN ('indicacao_tipo_comissao', 'indicacao_comissao_corretor'));