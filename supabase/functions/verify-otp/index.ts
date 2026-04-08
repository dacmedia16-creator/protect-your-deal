import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Função para gerar backup do PDF em background (reutiliza generate-pdf)
// Retorna os bytes do PDF para reutilização no envio de email
async function generateBackupPDF(supabase: any, fichaId: string, isPartial: boolean = false): Promise<Uint8Array | null> {
  try {
    console.log('[verify-otp] Iniciando geração de backup PDF para ficha:', fichaId, 'isPartial:', isPartial);
    
    // Buscar protocolo da ficha
    const { data: ficha, error: fichaError } = await supabase
      .from('fichas_visita')
      .select('protocolo, status')
      .eq('id', fichaId)
      .single();
    
    if (fichaError || !ficha) {
      console.error('[verify-otp] Erro ao buscar ficha para backup:', fichaError);
      return null;
    }
    
    console.log('[verify-otp] Ficha encontrada para backup:', { protocolo: ficha.protocolo, status: ficha.status });
    
    // Chamar a função generate-pdf via HTTP (agora sem JWT)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    console.log('[verify-otp] Chamando generate-pdf para ficha:', fichaId);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({ 
        ficha_id: fichaId,
        app_url: 'https://visitaprova.com.br',
        force_partial: isPartial
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[verify-otp] Erro ao gerar PDF:', response.status, errorText);
      return null;
    }
    
    // Obter o PDF como bytes
    const pdfBytes = new Uint8Array(await response.arrayBuffer());
    console.log('[verify-otp] PDF gerado com sucesso, tamanho:', pdfBytes.byteLength, 'bytes');
    
    // Salvar no storage
    const timestamp = Date.now();
    const fileName = `${ficha.protocolo}-backup-${timestamp}.pdf`;
    
    console.log('[verify-otp] Salvando backup no storage:', fileName);
    
    const { error: uploadError } = await supabase.storage
      .from('comprovantes-backup')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false
      });
    
    if (uploadError) {
      console.error('[verify-otp] Erro ao fazer upload do backup:', uploadError);
      return pdfBytes; // Retorna o PDF mesmo se falhar o upload
    }
    
    // Atualizar ficha com timestamp do backup
    const backupTimestamp = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('fichas_visita')
      .update({ backup_gerado_em: backupTimestamp })
      .eq('id', fichaId);
    
    if (updateError) {
      console.error('[verify-otp] Erro ao atualizar backup_gerado_em:', updateError);
    }
    
    console.log('[verify-otp] ✅ Backup PDF gerado e salvo com sucesso:', fileName);
    return pdfBytes;
  } catch (error) {
    console.error('[verify-otp] ❌ Erro na geração do backup PDF:', error);
    return null;
  }
}

// Função para enviar emails de confirmação para os corretores
async function sendCompletionEmails(
  supabase: any, 
  ficha: any, 
  pdfBytes: Uint8Array
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    console.log('[verify-otp] Iniciando envio de emails de conclusão para ficha:', ficha.id);

    // Converter PDF para base64
    let pdfBase64 = '';
    const chunkSize = 8192;
    for (let i = 0; i < pdfBytes.length; i += chunkSize) {
      const chunk = pdfBytes.slice(i, i + chunkSize);
      pdfBase64 += String.fromCharCode(...chunk);
    }
    pdfBase64 = btoa(pdfBase64);
    
    console.log('[verify-otp] PDF convertido para base64, tamanho:', pdfBase64.length);

    // Buscar email do corretor principal
    const { data: corretorPrincipal } = await supabase
      .from('profiles')
      .select('nome, email, user_id')
      .eq('user_id', ficha.user_id)
      .single();
    
    // Se não tem email no profile, buscar do auth.users
    let emailPrincipal = corretorPrincipal?.email;
    if (!emailPrincipal && ficha.user_id) {
      const { data: authUser } = await supabase.auth.admin.getUserById(ficha.user_id);
      emailPrincipal = authUser?.user?.email;
    }
    
    const dataVisita = new Date(ficha.data_visita).toLocaleDateString('pt-BR');
    
    const variables = {
      nome: corretorPrincipal?.nome || 'Corretor',
      protocolo: ficha.protocolo,
      endereco: ficha.imovel_endereco,
      data_visita: dataVisita,
      link: `https://visitaprova.com.br/fichas/${ficha.id}`,
    };
    
    // Enviar para corretor principal
    if (emailPrincipal) {
      console.log('[verify-otp] Enviando email para corretor principal:', emailPrincipal);
      
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            action: 'send-template',
            to: emailPrincipal,
            template_tipo: 'ficha_completa',
            variables,
            ficha_id: ficha.id,
            attachments: [{
              filename: `comprovante-${ficha.protocolo}.pdf`,
              content: pdfBase64,
              contentType: 'application/pdf',
            }],
          }),
        });
        
        if (response.ok) {
          console.log('[verify-otp] ✅ Email enviado para corretor principal:', emailPrincipal);
        } else {
          const errorText = await response.text();
          console.error('[verify-otp] ❌ Erro ao enviar email para corretor principal:', errorText);
        }
      } catch (emailError) {
        console.error('[verify-otp] ❌ Erro ao enviar email para corretor principal:', emailError);
      }
    } else {
      console.log('[verify-otp] Corretor principal sem email cadastrado');
    }
    
    // Se tem corretor parceiro, enviar para ele também
    if (ficha.corretor_parceiro_id) {
      console.log('[verify-otp] Buscando email do corretor parceiro:', ficha.corretor_parceiro_id);
      
      const { data: corretorParceiro } = await supabase
        .from('profiles')
        .select('nome, email')
        .eq('user_id', ficha.corretor_parceiro_id)
        .single();
      
      let emailParceiro = corretorParceiro?.email;
      if (!emailParceiro) {
        const { data: authUser } = await supabase.auth.admin.getUserById(ficha.corretor_parceiro_id);
        emailParceiro = authUser?.user?.email;
      }
      
      if (emailParceiro) {
        console.log('[verify-otp] Enviando email para corretor parceiro:', emailParceiro);
        
        const parceiroVariables = {
          ...variables,
          nome: corretorParceiro?.nome || 'Corretor Parceiro',
        };
        
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({
              action: 'send-template',
              to: emailParceiro,
              template_tipo: 'ficha_completa',
              variables: parceiroVariables,
              ficha_id: ficha.id,
              attachments: [{
                filename: `comprovante-${ficha.protocolo}.pdf`,
                content: pdfBase64,
                contentType: 'application/pdf',
              }],
            }),
          });
          
          if (response.ok) {
            console.log('[verify-otp] ✅ Email enviado para corretor parceiro:', emailParceiro);
          } else {
            const errorText = await response.text();
            console.error('[verify-otp] ❌ Erro ao enviar email para corretor parceiro:', errorText);
          }
        } catch (emailError) {
          console.error('[verify-otp] ❌ Erro ao enviar email para corretor parceiro:', emailError);
        }
      } else {
        console.log('[verify-otp] Corretor parceiro sem email cadastrado');
      }
    }
    
    console.log('[verify-otp] Processamento de emails de conclusão finalizado');
  } catch (error) {
    // Não bloquear a confirmação se o envio de email falhar
    console.error('[verify-otp] ❌ Erro ao enviar emails de conclusão:', error);
  }
}

// Função para enviar pesquisa pós-visita via WhatsApp automaticamente
async function sendSurveyWhatsApp(supabase: any, ficha: any): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  console.log('[verify-otp] Verificando envio de pesquisa pós-visita para ficha:', ficha.id);

  // 1. Verificar feature flag
  let featureEnabled = false;
  if (ficha.imobiliaria_id) {
    const { data: flag } = await supabase
      .from('imobiliaria_feature_flags')
      .select('enabled')
      .eq('imobiliaria_id', ficha.imobiliaria_id)
      .eq('feature_key', 'post_visit_survey')
      .maybeSingle();
    featureEnabled = flag?.enabled === true;
  } else if (ficha.user_id) {
    const { data: flag } = await supabase
      .from('user_feature_flags')
      .select('enabled')
      .eq('user_id', ficha.user_id)
      .eq('feature_key', 'post_visit_survey')
      .maybeSingle();
    featureEnabled = flag?.enabled === true;
  }

  if (!featureEnabled) {
    console.log('[verify-otp] Feature post_visit_survey não habilitada, pulando envio');
    return;
  }

  // 2. Verificar se já existe survey para esta ficha
  const { data: existingSurvey } = await supabase
    .from('surveys')
    .select('id, token')
    .eq('ficha_id', ficha.id)
    .maybeSingle();

  let surveyToken: string;

  if (existingSurvey) {
    console.log('[verify-otp] Survey já existe para esta ficha:', existingSurvey.id);
    surveyToken = existingSurvey.token;
  } else {
    // 3. Criar survey — determinar corretor_id correto
    const corretorId = ficha.parte_preenchida_parceiro === 'comprador'
      ? ficha.corretor_parceiro_id
      : ficha.user_id;

    const { data: newSurvey, error: insertError } = await supabase
      .from('surveys')
      .insert({
        ficha_id: ficha.id,
        corretor_id: corretorId,
        imobiliaria_id: ficha.imobiliaria_id || null,
        construtora_id: ficha.construtora_id || null,
        client_name: ficha.comprador_nome,
        client_phone: ficha.comprador_telefone,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .select('id, token')
      .single();

    if (insertError || !newSurvey) {
      console.error('[verify-otp] Erro ao criar survey:', insertError);
      return;
    }

    console.log('[verify-otp] Survey criada:', newSurvey.id);
    surveyToken = newSurvey.token;
  }

  // 4. Obter canal WhatsApp padrão
  let channel: string = 'meta';
  try {
    const { data: configData } = await supabase
      .from('configuracoes_sistema')
      .select('valor')
      .eq('chave', 'whatsapp_channel_padrao')
      .single();
    const val = configData?.valor;
    if (val === 'meta2' || val === '"meta2"') channel = 'meta2';
    else if (val === 'meta' || val === '"meta"') channel = 'meta';
  } catch {
    console.log('[verify-otp] Usando canal padrão meta para pesquisa');
  }

  // 5. Enviar template via send-whatsapp
  const phone = ficha.comprador_telefone;
  if (!phone) {
    console.log('[verify-otp] Comprador sem telefone, não é possível enviar pesquisa');
    return;
  }

  const payload = {
    action: 'send-template',
    phone,
    templateName: 'pesquisa_pos_visita',
    templateParams: {
      '1': ficha.comprador_nome || 'Cliente',
      '2': ficha.imovel_endereco || 'imóvel visitado',
      '3': 'Sua opinião nos ajuda a melhorar!',
    },
    buttonUrlDynamicParams: ['', surveyToken],
    language: 'pt_BR',
    channel,
  };

  console.log('[verify-otp] Enviando pesquisa pós-visita via WhatsApp:', { phone, channel, surveyToken });

  const response = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (result.success) {
    console.log('[verify-otp] ✅ Pesquisa pós-visita enviada com sucesso via WhatsApp');
  } else {
    console.error('[verify-otp] ❌ Erro ao enviar pesquisa pós-visita:', result.error);
  }
}

// Função para obter geolocalização por IP
async function getLocationByIP(ip: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    // Ignora IPs locais/privados
    if (ip === 'unknown' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.') || ip === '127.0.0.1') {
      console.log('IP privado ou desconhecido, não é possível obter geolocalização:', ip);
      return null;
    }

    // Pega o primeiro IP se houver múltiplos (x-forwarded-for pode ter vários)
    const firstIP = ip.split(',')[0].trim();
    
    console.log('Buscando geolocalização para IP:', firstIP);
    
    // Usa o serviço ip-api.com (gratuito, sem necessidade de API key)
    const response = await fetch(`http://ip-api.com/json/${firstIP}?fields=status,lat,lon,message`);
    const data = await response.json();
    
    if (data.status === 'success' && data.lat && data.lon) {
      console.log('Geolocalização por IP obtida:', { lat: data.lat, lon: data.lon });
      return { latitude: data.lat, longitude: data.lon };
    }
    
    console.log('Falha ao obter geolocalização por IP:', data.message || 'Resposta inválida');
    return null;
  } catch (error) {
    console.error('Erro ao buscar geolocalização por IP:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      token, 
      codigo,
      aceite_legal,
      aceite_nome,
      aceite_cpf,
      aceite_latitude,
      aceite_longitude,
      aceite_user_agent
    } = await req.json();

    // Get client IP from headers
    const clientIP = req.headers.get('x-forwarded-for') 
      || req.headers.get('cf-connecting-ip') 
      || req.headers.get('x-real-ip')
      || 'unknown';
    
    // Determinar tipo de localização e coordenadas finais
    let finalLatitude = aceite_latitude;
    let finalLongitude = aceite_longitude;
    let localizacaoTipo: string | null = null;
    
    if (aceite_latitude && aceite_longitude) {
      // GPS fornecido pelo usuário
      localizacaoTipo = 'gps';
      console.log('Usando geolocalização GPS fornecida pelo usuário');
    } else {
      // Tentar fallback por IP
      console.log('GPS não fornecido, tentando fallback por IP...');
      const ipLocation = await getLocationByIP(clientIP);
      if (ipLocation) {
        finalLatitude = ipLocation.latitude;
        finalLongitude = ipLocation.longitude;
        localizacaoTipo = 'ip';
        console.log('Usando geolocalização aproximada por IP');
      } else {
        console.log('Não foi possível obter geolocalização por nenhum método');
      }
    }

    console.log('Verify OTP request:', { token, codigo, aceite_legal, aceite_nome, aceite_cpf: aceite_cpf ? '***' : null, clientIP });

    if (!token || !codigo) {
      return new Response(
        JSON.stringify({ error: 'Token e código são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate legal acceptance fields
    if (!aceite_legal) {
      return new Response(
        JSON.stringify({ error: 'O aceite da declaração é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!aceite_nome || aceite_nome.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: 'Nome completo é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cpfNumbers = aceite_cpf.replace(/\D/g, '');
    if (cpfNumbers.length !== 11) {
      return new Response(
        JSON.stringify({ error: 'CPF deve ter 11 dígitos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate CPF checksum digits
    if (!validateCPF(cpfNumbers)) {
      return new Response(
        JSON.stringify({ error: 'CPF inválido. Verifique os dígitos.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CPF validation function
    function validateCPF(cpf: string): boolean {
      // Reject known invalid patterns (all same digit)
      if (/^(\d)\1{10}$/.test(cpf)) {
        return false;
      }

      // Calculate first verification digit
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf[i]) * (10 - i);
      }
      let remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) {
        remainder = 0;
      }
      if (remainder !== parseInt(cpf[9])) {
        return false;
      }

      // Calculate second verification digit
      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf[i]) * (11 - i);
      }
      remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) {
        remainder = 0;
      }
      if (remainder !== parseInt(cpf[10])) {
        return false;
      }

      return true;
    }

    // Find OTP by token
    const { data: otp, error: otpError } = await supabase
      .from('confirmacoes_otp')
      .select('*, fichas_visita(*)')
      .eq('token', token)
      .maybeSingle();

    if (otpError || !otp) {
      console.error('OTP not found:', otpError);
      return new Response(
        JSON.stringify({ error: 'Código inválido ou expirado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already confirmed
    if (otp.confirmado) {
      return new Response(
        JSON.stringify({ error: 'Este código já foi utilizado', already_confirmed: true }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    if (new Date(otp.expira_em) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Código expirado. Solicite um novo código.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check attempts
    if (otp.tentativas >= 5) {
      return new Response(
        JSON.stringify({ error: 'Número máximo de tentativas excedido. Solicite um novo código.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify code
    if (otp.codigo !== codigo) {
      // Increment attempts
      const newAttempts = otp.tentativas + 1;
      await supabase
        .from('confirmacoes_otp')
        .update({ tentativas: newAttempts })
        .eq('id', otp.id);

      const remainingAttempts = 5 - newAttempts;
      return new Response(
        JSON.stringify({ 
          error: `Código incorreto. ${remainingAttempts > 0 ? `Você tem mais ${remainingAttempts} tentativa(s).` : 'Tentativas esgotadas!'}`,
          tentativas_restantes: remainingAttempts
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark OTP as confirmed with legal acceptance data
    const { error: updateOtpError } = await supabase
      .from('confirmacoes_otp')
      .update({ 
        confirmado: true,
        aceite_legal: true,
        aceite_nome: aceite_nome.trim(),
        aceite_cpf: aceite_cpf.replace(/\D/g, ''),
        aceite_ip: clientIP,
        aceite_latitude: finalLatitude || null,
        aceite_longitude: finalLongitude || null,
        aceite_localizacao_tipo: localizacaoTipo,
        aceite_user_agent: aceite_user_agent || null,
        aceite_em: new Date().toISOString()
      })
      .eq('id', otp.id);

    if (updateOtpError) {
      console.error('Error updating OTP:', updateOtpError);
      return new Response(
        JSON.stringify({ error: 'Erro ao registrar confirmação' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('OTP confirmed with legal data:', {
      otpId: otp.id,
      aceite_nome: aceite_nome.trim(),
      aceite_cpf: '***',
      aceite_ip: clientIP,
      aceite_latitude: finalLatitude,
      aceite_longitude: finalLongitude,
      aceite_localizacao_tipo: localizacaoTipo,
      aceite_em: new Date().toISOString()
    });

    // Check if this is autopreenchimento mode (name is null in ficha)
    const ficha = otp.fichas_visita;
    const isAutopreenchimento = otp.tipo === 'proprietario' 
      ? !ficha.proprietario_nome || ficha.proprietario_autopreenchimento
      : !ficha.comprador_nome || ficha.comprador_autopreenchimento;

    // Update ficha with confirmation timestamp and data if autopreenchimento
    const updateField = otp.tipo === 'proprietario' 
      ? { 
          proprietario_confirmado_em: new Date().toISOString(),
          ...(isAutopreenchimento && {
            proprietario_nome: aceite_nome.trim(),
            proprietario_cpf: aceite_cpf.replace(/\D/g, '')
          })
        }
      : { 
          comprador_confirmado_em: new Date().toISOString(),
          ...(isAutopreenchimento && {
            comprador_nome: aceite_nome.trim(),
            comprador_cpf: aceite_cpf.replace(/\D/g, '')
          })
        };

    console.log('Updating ficha with:', { isAutopreenchimento, updateField: { ...updateField, aceite_cpf: '***' } });

    await supabase
      .from('fichas_visita')
      .update(updateField)
      .eq('id', otp.ficha_id);

    // Check if both parties confirmed
    const { data: updatedFicha } = await supabase
      .from('fichas_visita')
      .select('*')
      .eq('id', otp.ficha_id)
      .single();

    let newStatus = 'pendente';
    if (updatedFicha?.proprietario_confirmado_em && updatedFicha?.comprador_confirmado_em) {
      newStatus = 'completo';
    } else if (updatedFicha?.proprietario_confirmado_em) {
      newStatus = 'aguardando_comprador';
    } else if (updatedFicha?.comprador_confirmado_em) {
      newStatus = 'aguardando_proprietario';
    }

    await supabase
      .from('fichas_visita')
      .update({ status: newStatus })
      .eq('id', otp.ficha_id);

    // Gerar backup do PDF automaticamente quando ficha estiver completa ou finalizada parcialmente
    if (newStatus === 'completo' || newStatus === 'finalizado_parcial') {
      console.log('[verify-otp] Ficha completa - gerando backup PDF...');
      try {
        // Executar de forma síncrona para garantir que o backup seja gerado
        const pdfBytes = await generateBackupPDF(supabase, otp.ficha_id, false);
        console.log('[verify-otp] ✅ Backup gerado com sucesso após confirmação completa');
        
        // Enviar emails com PDF anexado quando ficha está completa ou finalizada parcialmente
        if ((newStatus === 'completo' || newStatus === 'finalizado_parcial') && pdfBytes) {
          console.log(`[verify-otp] Enviando emails com PDF para os corretores (status: ${newStatus})...`);
          await sendCompletionEmails(supabase, updatedFicha, pdfBytes);
        }
      } catch (err) {
        console.error('[verify-otp] ❌ Erro ao gerar backup após confirmação:', err);
      }
    }

    // Enviar pesquisa pós-visita via WhatsApp para o comprador
    if (otp.tipo === 'comprador') {
      try {
        await sendSurveyWhatsApp(supabase, updatedFicha);
      } catch (err) {
        console.error('[verify-otp] ❌ Erro ao enviar pesquisa pós-visita:', err);
      }
    }

    // Cadastrar cliente automaticamente após confirmação
    try {
      const clienteNome = aceite_nome.trim();
      const clienteCpf = aceite_cpf.replace(/\D/g, '');
      const clienteTelefone = otp.telefone;
      const clienteTipo = otp.tipo; // 'proprietario' ou 'comprador'
      const imobiliariaId = ficha.imobiliaria_id;
      const corretorId = ficha.user_id;

      // Verificar se já existe cliente com mesmo CPF ou telefone para este corretor/imobiliária
      const { data: clienteExistente } = await supabase
        .from('clientes')
        .select('id')
        .eq('user_id', corretorId)
        .or(`cpf.eq.${clienteCpf},telefone.eq.${clienteTelefone}`)
        .maybeSingle();

      if (!clienteExistente) {
        const { error: insertError } = await supabase
          .from('clientes')
          .insert({
            user_id: corretorId,
            imobiliaria_id: imobiliariaId,
            nome: clienteNome,
            cpf: clienteCpf,
            telefone: clienteTelefone,
            tipo: clienteTipo,
            notas: `Cadastrado automaticamente via confirmação de visita - Protocolo: ${updatedFicha?.protocolo}`
          });

        if (insertError) {
          console.error('Erro ao cadastrar cliente automaticamente:', insertError);
        } else {
          console.log('Cliente cadastrado automaticamente:', { nome: clienteNome, tipo: clienteTipo, protocolo: updatedFicha?.protocolo });
        }
      } else {
        console.log('Cliente já existe, não será duplicado:', { cpf: '***', telefone: clienteTelefone });
      }

      // Cadastrar imóvel automaticamente se for proprietário
      if (clienteTipo === 'proprietario') {
        try {
          // Verificar se já existe imóvel com mesmo endereço para este corretor
          const { data: imovelExistente } = await supabase
            .from('imoveis')
            .select('id')
            .eq('user_id', corretorId)
            .eq('endereco', ficha.imovel_endereco)
            .maybeSingle();

          if (!imovelExistente) {
            // Buscar o ID do cliente (recém-cadastrado ou existente)
            const { data: clienteProprietario } = await supabase
              .from('clientes')
              .select('id')
              .eq('user_id', corretorId)
              .or(`cpf.eq.${clienteCpf},telefone.eq.${clienteTelefone}`)
              .maybeSingle();

            const { error: insertImovelError } = await supabase
              .from('imoveis')
              .insert({
                user_id: corretorId,
                imobiliaria_id: imobiliariaId,
                endereco: ficha.imovel_endereco,
                tipo: ficha.imovel_tipo,
                proprietario_id: clienteProprietario?.id || null,
                notas: `Cadastrado automaticamente via confirmação de visita - Protocolo: ${updatedFicha?.protocolo}`
              });

            if (insertImovelError) {
              console.error('Erro ao cadastrar imóvel automaticamente:', insertImovelError);
            } else {
              console.log('Imóvel cadastrado automaticamente:', { 
                endereco: ficha.imovel_endereco, 
                tipo: ficha.imovel_tipo,
                proprietario_id: clienteProprietario?.id,
                protocolo: updatedFicha?.protocolo 
              });
            }
          } else {
            console.log('Imóvel já existe, não será duplicado:', { endereco: ficha.imovel_endereco });
          }
        } catch (imovelError) {
          console.error('Erro ao tentar cadastrar imóvel automaticamente:', imovelError);
        }
      }
    } catch (clienteError) {
      // Não bloquear a confirmação se o cadastro automático falhar
      console.error('Erro ao tentar cadastrar cliente automaticamente:', clienteError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Visita confirmada com sucesso!',
        ficha: {
          protocolo: updatedFicha?.protocolo,
          imovel_endereco: updatedFicha?.imovel_endereco,
          data_visita: updatedFicha?.data_visita,
          status: newStatus,
          confirmado_por: otp.tipo,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in verify-otp function:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});