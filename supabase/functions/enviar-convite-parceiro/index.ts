import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnviarConviteRequest {
  ficha_id: string;
  telefone_parceiro: string;
  parte_faltante: 'proprietario' | 'comprador';
  app_url: string;
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

    const { ficha_id, telefone_parceiro, parte_faltante, app_url }: EnviarConviteRequest = await req.json();
    console.log(`Enviar convite parceiro: ficha=${ficha_id}, telefone=${telefone_parceiro}, parte=${parte_faltante}`);

    // Validate input
    if (!ficha_id || !telefone_parceiro || !parte_faltante) {
      return new Response(
        JSON.stringify({ error: 'Dados incompletos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean phone number
    const telefoneLimpo = telefone_parceiro.replace(/\D/g, '');

    // Verify ficha exists and belongs to user
    const { data: ficha, error: fichaError } = await supabase
      .from('fichas_visita')
      .select('*')
      .eq('id', ficha_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (fichaError || !ficha) {
      console.error('Ficha não encontrada:', fichaError);
      return new Response(
        JSON.stringify({ error: 'Ficha não encontrada ou você não tem permissão' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if ficha already has a partner
    if (ficha.corretor_parceiro_id) {
      return new Response(
        JSON.stringify({ error: 'Esta ficha já possui um corretor parceiro' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search for partner broker by phone (normalize both sides to handle different formats)
    const { data: perfis, error: perfilError } = await supabase
      .from('profiles')
      .select('user_id, nome, telefone')
      .not('telefone', 'is', null);

    let parceiroEncontrado = false;
    let parceiroId: string | null = null;
    let parceiroNome = 'Corretor';

    if (perfis && !perfilError) {
      // Find partner by comparing normalized phone numbers
      const parceiroPerfil = perfis.find(p => 
        p.telefone?.replace(/\D/g, '') === telefoneLimpo
      );

      if (parceiroPerfil) {
        parceiroEncontrado = true;
        parceiroId = parceiroPerfil.user_id;
        parceiroNome = parceiroPerfil.nome;
        console.log(`Parceiro encontrado: ${parceiroNome} (${parceiroId})`);
      } else {
        console.log('Parceiro não encontrado no sistema');
      }
    } else {
      console.log('Erro ao buscar perfis:', perfilError);
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

    // Build the invite URL
    const conviteUrl = `${app_url}/convite-parceiro/${conviteToken}`;
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
        const mensagem = `🏠 *VisitaSegura - Convite de Parceria*\n\nOlá!\n\n${origemNome} te convidou para completar uma ficha de visita.\n\n📍 Imóvel: ${ficha.imovel_endereco}\n📝 Parte faltante: ${parteLabel}\n\nAcesse o link para aceitar:\n${conviteUrl}\n\n⏰ Este convite expira em 7 dias.`;

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
