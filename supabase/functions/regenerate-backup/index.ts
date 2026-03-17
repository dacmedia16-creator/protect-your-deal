import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { ficha_id, send_email } = await req.json();

    if (!ficha_id) {
      return new Response(
        JSON.stringify({ error: 'ficha_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[regenerate-backup] Iniciando regeneração para ficha: ${ficha_id}`);

    // 1. Buscar dados da ficha
    const { data: ficha, error: fichaError } = await supabase
      .from('fichas_visita')
      .select('id, protocolo, status')
      .eq('id', ficha_id)
      .single();

    if (fichaError || !ficha) {
      console.error('[regenerate-backup] Registro não encontrado:', fichaError);
      return new Response(
        JSON.stringify({ error: 'Registro não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se a ficha está em status válido para backup
    if (ficha.status !== 'completo' && ficha.status !== 'finalizado_parcial') {
      console.log(`[regenerate-backup] Registro ${ficha.protocolo} não está finalizado (status: ${ficha.status})`);
      return new Response(
        JSON.stringify({ error: 'Apenas registros finalizados podem ter backup regenerado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[regenerate-backup] Ficha encontrada: ${ficha.protocolo}, status: ${ficha.status}`);

    // 2. Chamar generate-pdf para obter o PDF (agora sem JWT)
    const generatePdfUrl = `${supabaseUrl}/functions/v1/generate-pdf`;
    
    console.log(`[regenerate-backup] Chamando generate-pdf...`);
    
    const pdfResponse = await fetch(generatePdfUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ 
        ficha_id,
        app_url: 'https://visitaprova.com.br',
        force_partial: ficha.status === 'finalizado_parcial'
      }),
    });

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      console.error('[regenerate-backup] Erro ao gerar PDF:', errorText);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar PDF', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Obter os bytes do PDF
    const pdfBytes = await pdfResponse.arrayBuffer();
    console.log(`[regenerate-backup] PDF gerado com sucesso, tamanho: ${pdfBytes.byteLength} bytes`);

    // 4. Fazer upload para o storage
    const timestamp = Date.now();
    const fileName = `${ficha.protocolo}-backup-${timestamp}.pdf`;
    
    console.log(`[regenerate-backup] Fazendo upload para storage: ${fileName}`);

    const { error: uploadError } = await supabase.storage
      .from('comprovantes-backup')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('[regenerate-backup] Erro no upload:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar backup', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[regenerate-backup] Upload concluído: ${fileName}`);

    // 5. Atualizar backup_gerado_em na ficha
    const { error: updateError } = await supabase
      .from('fichas_visita')
      .update({ backup_gerado_em: new Date().toISOString() })
      .eq('id', ficha_id);

    if (updateError) {
      console.error('[regenerate-backup] Erro ao atualizar registro:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar registro', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[regenerate-backup] Backup regenerado com sucesso para ficha ${ficha.protocolo}`);

    // 6. Enviar email com PDF se solicitado
    if (send_email && pdfBytes) {
      console.log(`[regenerate-backup] Enviando email com PDF anexado...`);
      
      try {
        // Buscar dados completos da ficha para o email
        const { data: fichaCompleta } = await supabase
          .from('fichas_visita')
          .select('*, user_id, corretor_parceiro_id, protocolo, imovel_endereco, proprietario_nome, comprador_nome')
          .eq('id', ficha_id)
          .single();

        if (fichaCompleta) {
          // Converter PDF para base64
          const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));
          
          // Buscar email do corretor principal
          const { data: corretorProfile } = await supabase
            .from('profiles')
            .select('email, nome')
            .eq('user_id', fichaCompleta.user_id)
            .single();

          const recipients: Array<{ email: string; nome: string }> = [];
          
          if (corretorProfile?.email) {
            recipients.push({ email: corretorProfile.email, nome: corretorProfile.nome });
          }

          // Buscar email do corretor parceiro se houver
          if (fichaCompleta.corretor_parceiro_id) {
            const { data: parceiroProfile } = await supabase
              .from('profiles')
              .select('email, nome')
              .eq('user_id', fichaCompleta.corretor_parceiro_id)
              .single();

            if (parceiroProfile?.email) {
              recipients.push({ email: parceiroProfile.email, nome: parceiroProfile.nome });
            }
          }

          // Enviar email para cada destinatário
          const sendEmailUrl = `${supabaseUrl}/functions/v1/send-email`;
          
          for (const recipient of recipients) {
            try {
              console.log(`[regenerate-backup] Enviando email para ${recipient.email}...`);
              const emailResponse = await fetch(sendEmailUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({
                  action: 'send-template',
                  template_tipo: 'ficha_completa',
                  to: recipient.email,
                  ficha_id: ficha_id,
                  variables: {
                    nome: recipient.nome || 'Corretor',
                    protocolo: fichaCompleta.protocolo,
                    endereco: fichaCompleta.imovel_endereco || '',
                    data_visita: fichaCompleta.data_visita
                      ? new Date(fichaCompleta.data_visita).toLocaleDateString('pt-BR')
                      : '',
                    link: `https://visitaprova.com.br/fichas/${ficha_id}`,
                  },
                  attachments: [{
                    filename: `${fichaCompleta.protocolo}-comprovante.pdf`,
                    content: pdfBase64,
                    contentType: 'application/pdf',
                  }],
                }),
              });

              if (!emailResponse.ok) {
                const errText = await emailResponse.text();
                console.error(`[regenerate-backup] Erro ao enviar email para ${recipient.email}:`, errText);
              } else {
                await emailResponse.text();
                console.log(`[regenerate-backup] Email enviado com sucesso para ${recipient.email}`);
              }
            } catch (emailErr) {
              console.error(`[regenerate-backup] Erro ao enviar email para ${recipient.email}:`, emailErr);
            }
          }
        }
      } catch (emailError) {
        console.error('[regenerate-backup] Erro ao processar envio de emails:', emailError);
        // Não falhar o backup por causa do email
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Backup regenerado com sucesso',
        fileName,
        protocolo: ficha.protocolo
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[regenerate-backup] Erro inesperado:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
