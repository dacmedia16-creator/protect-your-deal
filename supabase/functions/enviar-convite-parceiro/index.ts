import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface EnviarConviteRequest {
  ficha_id: string;
  telefone_parceiro: string;
  parte_faltante: 'proprietario' | 'comprador';
  app_url: string;
  permite_externo?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { ficha_id, telefone_parceiro, parte_faltante, app_url, permite_externo }: EnviarConviteRequest = await req.json();
    console.log(`Enviar convite parceiro: ficha=${ficha_id}, telefone=${telefone_parceiro}, parte=${parte_faltante}, externo=${permite_externo}`);

    // Validate input
    if (!ficha_id || !telefone_parceiro || !parte_faltante) {
      return new Response(
        JSON.stringify({ error: 'Dados incompletos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean phone number
    const telefoneLimpo = telefone_parceiro.replace(/\D/g, '');

    // Verify ficha exists
    const { data: ficha, error: fichaError } = await supabase
      .from('fichas_visita')
      .select('*')
      .eq('id', ficha_id)
      .maybeSingle();

    if (fichaError || !ficha) {
      console.error('Registro não encontrado:', fichaError);
      return new Response(
        JSON.stringify({ error: 'Registro não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar permissão: corretor principal OU corretor parceiro
    const isCorretorPrincipal = ficha.user_id === user.id;
    const isCorretorParceiro = ficha.corretor_parceiro_id === user.id;

    if (!isCorretorPrincipal && !isCorretorParceiro) {
      console.error(`Usuário ${user.id} sem permissão para ficha ${ficha_id}`);
      return new Response(
        JSON.stringify({ error: 'Você não tem permissão para convidar parceiros neste registro' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if ficha already has a partner (que não seja o próprio usuário)
    if (ficha.corretor_parceiro_id && ficha.corretor_parceiro_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Este registro já possui um corretor parceiro' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search for partner broker by phone directly (optimized query)
    let parceiroEncontrado = false;
    let parceiroId: string | null = null;
    let parceiroNome = 'Corretor';

    // Buscar parceiro pelo telefone - usar limit(1) para evitar erro com telefones duplicados
    const { data: parceirosPerfis, error: perfilError } = await supabase
      .from('profiles')
      .select('user_id, nome')
      .eq('telefone', telefoneLimpo)
      .order('created_at', { ascending: false })
      .limit(1);

    const parceiroPerfil = parceirosPerfis?.[0] || null;

    if (perfilError) {
      console.log('Erro ao buscar perfil:', perfilError);
    } else if (parceiroPerfil) {
      parceiroEncontrado = true;
      parceiroId = parceiroPerfil.user_id;
      parceiroNome = parceiroPerfil.nome;
      console.log(`Parceiro encontrado: ${parceiroNome} (${parceiroId})`);
    } else {
      console.log('Parceiro não encontrado no sistema');
    }

    // Check for existing pending invite
    const { data: existingInvite } = await supabase
      .from('convites_parceiro')
      .select('*')
      .eq('ficha_id', ficha_id)
      .eq('status', 'pendente')
      .maybeSingle();

    if (existingInvite) {
      // Update existing invite
      await supabase
        .from('convites_parceiro')
        .update({
          corretor_parceiro_telefone: telefoneLimpo,
          corretor_parceiro_id: parceiroId,
          parte_faltante,
          expira_em: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          permite_externo: permite_externo || false,
        })
        .eq('id', existingInvite.id);
    }

    // Create new invite if none exists
    let conviteToken = existingInvite?.token;
    if (!existingInvite) {
      const { data: novoConvite, error: conviteError } = await supabase
        .from('convites_parceiro')
        .insert({
          ficha_id,
          corretor_origem_id: user.id,
          corretor_parceiro_telefone: telefoneLimpo,
          corretor_parceiro_id: parceiroId,
          parte_faltante,
          permite_externo: permite_externo || false,
        })
        .select()
        .single();

      if (conviteError) {
        console.error('Erro ao criar convite:', conviteError);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar convite' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      conviteToken = novoConvite.token;
    }

    // Build the invite URL - use external route if permite_externo is true
    const conviteRoute = permite_externo ? 'convite-externo' : 'convite-parceiro';
    const conviteUrl = `${app_url}/${conviteRoute}/${conviteToken}`;
    console.log(`URL do convite: ${conviteUrl}`);

    // Get origin broker profile
    const { data: origemPerfil } = await supabase
      .from('profiles')
      .select('nome')
      .eq('user_id', user.id)
      .maybeSingle();

    const origemNome = origemPerfil?.nome || 'Corretor';

    // Try to send WhatsApp via ZionTalk
    let whatsappEnviado = false;
    const ziontalkKey = Deno.env.get('ZIONTALK_API_KEY');
    
    if (ziontalkKey) {
      try {
        const parteLabel = parte_faltante === 'proprietario' ? 'proprietário' : 'comprador';
        
        // Para parceiros externos: enviar link direto (não têm o app)
        // Para parceiros internos: enviar lembrete para abrir o app (evita problema de deep linking)
        const mensagemBase = `🏠 *Confirmação de Visita - Convite de Parceria*

Olá!

${origemNome} te convidou para completar um registro de visita.

📍 *Imóvel:* ${ficha.imovel_endereco}
📝 *Parte faltante:* ${parteLabel}`;

        const instrucao = permite_externo
          ? `

✅ Você não precisa ter conta no sistema.
Acesse o link para preencher:
${conviteUrl}`
          : `

👉 *Abra o app VisitaProva* para aceitar o convite.
O convite já está esperando por você na aba "Convites Recebidos".`;

        const mensagem = `${mensagemBase}${instrucao}

⏰ Este convite expira em 7 dias.`;

        const authHeader = btoa(`${ziontalkKey}:`);
        const formData = new FormData();
        formData.append('msg', mensagem);
        formData.append('mobile_phone', `+55${telefoneLimpo}`);

        const response = await fetch('https://app.ziontalk.com/api/send_message/', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authHeader}`,
          },
          body: formData,
        });

        whatsappEnviado = response.status === 201;
        console.log(`WhatsApp enviado: ${whatsappEnviado}`);
      } catch (err) {
        console.error('Erro ao enviar WhatsApp:', err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        parceiro_encontrado: parceiroEncontrado,
        parceiro_nome: parceiroNome,
        whatsapp_enviado: whatsappEnviado,
        convite_url: conviteUrl,
        token: conviteToken,
        message: parceiroEncontrado 
          ? `Convite enviado para ${parceiroNome}` 
          : 'Convite criado. O corretor receberá o link quando se cadastrar com este telefone.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Error in enviar-convite-parceiro:', errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
