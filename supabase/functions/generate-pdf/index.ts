import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1';
import qrcode from 'https://esm.sh/qrcode-generator@1.4.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { ficha_id, app_url, force_partial } = await req.json();

    console.log('[generate-pdf] Requisição recebida:', { ficha_id, force_partial });

    if (!ficha_id) {
      console.log('[generate-pdf] Erro: ficha_id não fornecido');
      return new Response(
        JSON.stringify({ error: 'ID da ficha é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch ficha data
    const { data: ficha, error: fichaError } = await supabase
      .from('fichas_visita')
      .select('*')
      .eq('id', ficha_id)
      .single();

    if (fichaError || !ficha) {
      console.error('[generate-pdf] Ficha não encontrada:', fichaError);
      return new Response(
        JSON.stringify({ error: 'Ficha não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[generate-pdf] Ficha encontrada:', { protocolo: ficha.protocolo, status: ficha.status });

    // Validar status da ficha para chamadas internas (sem JWT)
    // Apenas fichas completas ou finalizadas parcialmente podem gerar PDF
    const statusPermitidos = ['completo', 'finalizado_parcial'];
    const isStatusValido = statusPermitidos.includes(ficha.status);
    
    // Se force_partial está ativo, permitir também fichas parcialmente confirmadas
    const temConfirmacaoParcial = ficha.proprietario_confirmado_em || ficha.comprador_confirmado_em;
    
    if (!isStatusValido && !force_partial) {
      console.log('[generate-pdf] Status não permitido para geração automática:', ficha.status);
    }

    // Check confirmations
    const proprietarioConfirmado = !!ficha.proprietario_confirmado_em;
    const compradorConfirmado = !!ficha.comprador_confirmado_em;
    const isPartial = force_partial === true;

    // If not forcing partial, require both confirmations
    if (!isPartial && (!proprietarioConfirmado || !compradorConfirmado)) {
      return new Response(
        JSON.stringify({ error: 'Ambas as partes precisam confirmar antes de gerar o comprovante' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For partial, require at least one confirmation
    if (isPartial && !proprietarioConfirmado && !compradorConfirmado) {
      return new Response(
        JSON.stringify({ error: 'Pelo menos uma parte precisa confirmar para gerar o comprovante parcial' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get legal acceptance data from OTP confirmations
    const { data: confirmacoes } = await supabase
      .from('confirmacoes_otp')
      .select('*')
      .eq('ficha_id', ficha_id)
      .eq('confirmado', true);

    const confirmacaoProprietario = confirmacoes?.find(c => c.tipo === 'proprietario');
    const confirmacaoComprador = confirmacoes?.find(c => c.tipo === 'comprador');

    // Get broker profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', ficha.user_id)
      .single();

    // Get partner broker profile if exists
    let partnerProfile = null;
    if (ficha.corretor_parceiro_id) {
      const { data: partnerData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', ficha.corretor_parceiro_id)
        .single();
      partnerProfile = partnerData;
      console.log('Partner broker found:', partnerProfile?.nome);
    }

    // Get imobiliaria data if exists
    let imobiliaria = null;
    if (ficha.imobiliaria_id) {
      const { data: imobData } = await supabase
        .from('imobiliarias')
        .select('nome, logo_url')
        .eq('id', ficha.imobiliaria_id)
        .single();
      imobiliaria = imobData;
      console.log('Imobiliaria data:', imobiliaria);
    }

    // Generate verification URL using app_url from frontend or fallback
    const baseUrl = app_url || Deno.env.get('APP_URL') || 'https://visitasegura.lovable.app';
    const verificationUrl = `${baseUrl}/verificar/${ficha.protocolo}`;
    console.log('Generated verification URL:', verificationUrl);
    console.log('Generating PDF - isPartial:', isPartial, 'proprietarioConfirmado:', proprietarioConfirmado, 'compradorConfirmado:', compradorConfirmado);

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();

    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const courierFont = await pdfDoc.embedFont(StandardFonts.Courier); // Fonte monoespaçada para hash

    const primaryColor = rgb(0.118, 0.227, 0.373); // #1e3a5f
    const textColor = rgb(0.2, 0.2, 0.2);
    const lightGray = rgb(0.6, 0.6, 0.6);
    const darkGray = rgb(0.3, 0.3, 0.3); // Cinza escuro para texto técnico
    const mediumGray = rgb(0.4, 0.4, 0.4); // Cinza médio para hash
    const warningColor = rgb(0.8, 0.4, 0.0); // Orange for warnings

    let yPosition = height - 50;
    let logoHeight = 0;
    let headerTextX = 50;

    // Try to embed imobiliaria logo if exists
    if (imobiliaria?.logo_url) {
      try {
        console.log('Fetching logo from:', imobiliaria.logo_url);
        const logoResponse = await fetch(imobiliaria.logo_url);
        
        if (logoResponse.ok) {
          const logoBytes = await logoResponse.arrayBuffer();
          const logoContentType = logoResponse.headers.get('content-type') || '';
          
          let logoImage;
          if (logoContentType.includes('png')) {
            logoImage = await pdfDoc.embedPng(logoBytes);
          } else {
            logoImage = await pdfDoc.embedJpg(logoBytes);
          }
          
          // Calculate proportional dimensions (max 80 width, 50 height)
          const maxLogoWidth = 80;
          const maxLogoHeight = 50;
          const aspectRatio = logoImage.width / logoImage.height;
          
          let finalWidth = maxLogoWidth;
          let finalHeight = maxLogoWidth / aspectRatio;
          
          if (finalHeight > maxLogoHeight) {
            finalHeight = maxLogoHeight;
            finalWidth = maxLogoHeight * aspectRatio;
          }
          
          logoHeight = finalHeight;
          
          // Draw logo at top left
          page.drawImage(logoImage, {
            x: 50,
            y: height - 30 - finalHeight,
            width: finalWidth,
            height: finalHeight,
          });
          
          headerTextX = 50 + finalWidth + 15; // Offset text after logo
          console.log('Logo embedded successfully');
        }
      } catch (error) {
        console.log('Error loading logo, continuing without it:', error);
      }
    }

    // Header - with imobiliaria name if exists
    if (imobiliaria?.nome) {
      page.drawText(imobiliaria.nome, {
        x: headerTextX,
        y: yPosition,
        size: 14,
        font: helveticaBold,
        color: primaryColor,
      });
      yPosition -= 20;
    }

    // Document title - always use standard title
    page.drawText('COMPROVANTE DE VISITA IMOBILIÁRIA', {
      x: headerTextX,
      y: yPosition,
      size: 16,
      font: helveticaBold,
      color: primaryColor,
    });

    yPosition -= 22;
    page.drawText(`Protocolo: ${ficha.protocolo}`, {
      x: headerTextX,
      y: yPosition,
      size: 12,
      font: helveticaBold,
      color: primaryColor,
    });

    // Partial warning banner removed per user request

    // Draw line
    yPosition -= 15;
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 1,
      color: primaryColor,
    });

    // Generate QR Code using qrcode-generator (works without canvas/DOM)
    const qr = qrcode(0, 'M'); // 0 = auto type number, 'M' = medium error correction
    qr.addData(verificationUrl);
    qr.make();

    const moduleCount = qr.getModuleCount();
    const cellSize = 3; // Size of each QR module in PDF points
    const qrSize = moduleCount * cellSize;
    const qrX = width - 150;
    const qrY = height - 80 - qrSize;

    // Draw white background for QR code
    page.drawRectangle({
      x: qrX - 5,
      y: qrY - 5,
      width: qrSize + 10,
      height: qrSize + 10,
      color: rgb(1, 1, 1),
    });

    // Draw QR code pixel by pixel
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qr.isDark(row, col)) {
          page.drawRectangle({
            x: qrX + col * cellSize,
            y: qrY + (moduleCount - row - 1) * cellSize,
            width: cellSize,
            height: cellSize,
            color: primaryColor,
          });
        }
      }
    }

    page.drawText('Escaneie para verificar', {
      x: qrX - 5,
      y: qrY - 15,
      size: 8,
      font: helvetica,
      color: lightGray,
    });

    // Helper function to draw section
    const drawSection = (title: string, startY: number): number => {
      page.drawText(title, {
        x: 50,
        y: startY,
        size: 12,
        font: helveticaBold,
        color: primaryColor,
      });
      return startY - 20;
    };

    // Helper function to draw field
    const drawField = (label: string, value: string, startY: number): number => {
      page.drawText(`${label}:`, {
        x: 50,
        y: startY,
        size: 10,
        font: helveticaBold,
        color: textColor,
      });
      page.drawText(value || '-', {
        x: 160,
        y: startY,
        size: 10,
        font: helvetica,
        color: textColor,
      });
      return startY - 18;
    };

    // Helper function to draw field with word wrap for long texts
    const drawFieldWithWrap = (label: string, value: string, startY: number, maxWidth: number): number => {
      page.drawText(`${label}:`, {
        x: 50,
        y: startY,
        size: 10,
        font: helveticaBold,
        color: textColor,
      });
      
      const valueText = value || '-';
      const valueX = 160;
      const availableWidth = maxWidth - valueX;
      
      const textWidth = helvetica.widthOfTextAtSize(valueText, 10);
      
      if (textWidth <= availableWidth) {
        page.drawText(valueText, {
          x: valueX,
          y: startY,
          size: 10,
          font: helvetica,
          color: textColor,
        });
        return startY - 18;
      }
      
      // Text needs wrapping
      const words = valueText.split(' ');
      let line = '';
      let currentY = startY;
      
      for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        const testWidth = helvetica.widthOfTextAtSize(testLine, 10);
        
        if (testWidth > availableWidth && line) {
          page.drawText(line, {
            x: valueX,
            y: currentY,
            size: 10,
            font: helvetica,
            color: textColor,
          });
          currentY -= 14;
          line = word;
        } else {
          line = testLine;
        }
      }
      
      if (line) {
        page.drawText(line, {
          x: valueX,
          y: currentY,
          size: 10,
          font: helvetica,
          color: textColor,
        });
        currentY -= 18;
      }
      
      return currentY;
    };

    // Format functions
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const formatPhone = (phone: string | null) => {
      if (!phone) return '-';
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 11) {
        return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,7)}-${cleaned.slice(7)}`;
      }
      return phone;
    };

    const formatCPF = (cpf: string | null) => {
      if (!cpf) return '-';
      const cleaned = cpf.replace(/\D/g, '');
      if (cleaned.length === 11) {
        return `${cleaned.slice(0,3)}.${cleaned.slice(3,6)}.${cleaned.slice(6,9)}-${cleaned.slice(9)}`;
      }
      return cpf;
    };

    // Helper to format coordinates with location type
    const formatCoords = (lat: number | null, lng: number | null, tipo: string | null): string => {
      if (lat === null || lng === null) return 'Não capturada';
      const tipoLabel = tipo === 'gps' ? '(GPS preciso)' : tipo === 'ip' ? '(Aprox. por IP)' : '';
      return `${lat.toFixed(6)}, ${lng.toFixed(6)} ${tipoLabel}`.trim();
    };

    // Property Section
    yPosition -= 40;
    yPosition = drawSection('DADOS DO IMÓVEL', yPosition);
    // Use wrap function for address with max width to avoid QR code overlap
    const maxTextWidth = qrX - 20; // Leave margin before QR code
    yPosition = drawFieldWithWrap('Endereço', ficha.imovel_endereco, yPosition, maxTextWidth);
    yPosition = drawField('Tipo', ficha.imovel_tipo, yPosition);

    // Owner Section with Legal Data
    yPosition -= 15;
    if (proprietarioConfirmado) {
      yPosition = drawSection('PROPRIETÁRIO - DADOS E ACEITE JURÍDICO', yPosition);
      yPosition = drawField('Nome', ficha.proprietario_nome || confirmacaoProprietario?.aceite_nome || '-', yPosition);
      yPosition = drawField('CPF', formatCPF(ficha.proprietario_cpf || confirmacaoProprietario?.aceite_cpf), yPosition);
      yPosition = drawField('Telefone', formatPhone(ficha.proprietario_telefone), yPosition);
      yPosition = drawField('Confirmado em', formatDate(ficha.proprietario_confirmado_em), yPosition);
      
      if (confirmacaoProprietario) {
        yPosition -= 5;
        page.drawText('Dados da Assinatura Digital:', {
          x: 50,
          y: yPosition,
          size: 9,
          font: helveticaBold,
          color: lightGray,
        });
        yPosition -= 15;
        yPosition = drawField('Assinatura', confirmacaoProprietario.aceite_nome || '-', yPosition);
        yPosition = drawField('CPF Assinatura', formatCPF(confirmacaoProprietario.aceite_cpf), yPosition);
        yPosition = drawField('IP', confirmacaoProprietario.aceite_ip || 'Não capturado', yPosition);
        yPosition = drawField('Geolocalização', formatCoords(confirmacaoProprietario.aceite_latitude, confirmacaoProprietario.aceite_longitude, confirmacaoProprietario.aceite_localizacao_tipo), yPosition);
        yPosition = drawField('Aceite em', confirmacaoProprietario.aceite_em ? formatDate(confirmacaoProprietario.aceite_em) : '-', yPosition);
      }
    } else {
      // Owner did not confirm - show basic info only
      yPosition = drawSection('PROPRIETÁRIO', yPosition);
      if (ficha.proprietario_nome) {
        yPosition = drawField('Nome', ficha.proprietario_nome, yPosition);
      }
      if (ficha.proprietario_telefone) {
        yPosition = drawField('Telefone', formatPhone(ficha.proprietario_telefone), yPosition);
      }
      if (ficha.proprietario_cpf) {
        yPosition = drawField('CPF', formatCPF(ficha.proprietario_cpf), yPosition);
      }
    }

    // Buyer Section with Legal Data
    yPosition -= 15;
    if (compradorConfirmado) {
      yPosition = drawSection('COMPRADOR/INTERESSADO - DADOS E ACEITE JURÍDICO', yPosition);
      yPosition = drawField('Nome', ficha.comprador_nome || confirmacaoComprador?.aceite_nome || '-', yPosition);
      yPosition = drawField('CPF', formatCPF(ficha.comprador_cpf || confirmacaoComprador?.aceite_cpf), yPosition);
      yPosition = drawField('Telefone', formatPhone(ficha.comprador_telefone), yPosition);
      yPosition = drawField('Confirmado em', formatDate(ficha.comprador_confirmado_em), yPosition);
      
      if (confirmacaoComprador) {
        yPosition -= 5;
        page.drawText('Dados da Assinatura Digital:', {
          x: 50,
          y: yPosition,
          size: 9,
          font: helveticaBold,
          color: lightGray,
        });
        yPosition -= 15;
        yPosition = drawField('Assinatura', confirmacaoComprador.aceite_nome || '-', yPosition);
        yPosition = drawField('CPF Assinatura', formatCPF(confirmacaoComprador.aceite_cpf), yPosition);
        yPosition = drawField('IP', confirmacaoComprador.aceite_ip || 'Não capturado', yPosition);
        yPosition = drawField('Geolocalização', formatCoords(confirmacaoComprador.aceite_latitude, confirmacaoComprador.aceite_longitude, confirmacaoComprador.aceite_localizacao_tipo), yPosition);
        yPosition = drawField('Aceite em', confirmacaoComprador.aceite_em ? formatDate(confirmacaoComprador.aceite_em) : '-', yPosition);
      }
    } else {
      // Buyer did not confirm - show basic info only
      yPosition = drawSection('COMPRADOR/INTERESSADO', yPosition);
      if (ficha.comprador_nome) {
        yPosition = drawField('Nome', ficha.comprador_nome, yPosition);
      }
      if (ficha.comprador_telefone) {
        yPosition = drawField('Telefone', formatPhone(ficha.comprador_telefone), yPosition);
      }
      if (ficha.comprador_cpf) {
        yPosition = drawField('CPF', formatCPF(ficha.comprador_cpf), yPosition);
      }
    }

    // Visit Section
    yPosition -= 15;
    yPosition = drawSection('DADOS DA VISITA', yPosition);
    yPosition = drawField('Data da Visita', formatDate(ficha.data_visita), yPosition);
    yPosition = drawField('Criado em', formatDate(ficha.created_at), yPosition);
    
    if (ficha.observacoes) {
      yPosition -= 5;
      page.drawText('Observações:', {
        x: 50,
        y: yPosition,
        size: 10,
        font: helveticaBold,
        color: textColor,
      });
      yPosition -= 15;
      
      // Word wrap for observations
      const maxWidth = width - 100;
      const words = ficha.observacoes.split(' ');
      let line = '';
      
      for (const word of words) {
        const testLine = line + word + ' ';
        const testWidth = helvetica.widthOfTextAtSize(testLine, 10);
        
        if (testWidth > maxWidth) {
          page.drawText(line.trim(), {
            x: 50,
            y: yPosition,
            size: 10,
            font: helvetica,
            color: textColor,
          });
          yPosition -= 15;
          line = word + ' ';
        } else {
          line = testLine;
        }
      }
      
      if (line.trim()) {
        page.drawText(line.trim(), {
          x: 50,
          y: yPosition,
          size: 10,
          font: helvetica,
          color: textColor,
        });
        yPosition -= 15;
      }
    }

    // Check if we need a second page for broker info
    if (yPosition < 180) {
      // Add second page
      const page2 = pdfDoc.addPage([595, 842]);
      yPosition = height - 50;
      
      // Broker Section on page 2
      if (profile) {
        const hasPartner = !!partnerProfile;
        yPosition = drawSectionOnPage(page2, hasPartner ? 'CORRETORES RESPONSÁVEIS' : 'CORRETOR RESPONSÁVEL', yPosition, helveticaBold, primaryColor);
        
        // Original broker
        if (hasPartner) {
          page2.drawText('Corretor Principal:', {
            x: 50,
            y: yPosition,
            size: 9,
            font: helveticaBold,
            color: lightGray,
          });
          yPosition -= 15;
        }
        yPosition = drawFieldOnPage(page2, 'Nome', profile.nome, yPosition, helveticaBold, helvetica, textColor);
        if (profile.creci) {
          yPosition = drawFieldOnPage(page2, 'CRECI', profile.creci, yPosition, helveticaBold, helvetica, textColor);
        }
        if (profile.imobiliaria) {
          yPosition = drawFieldOnPage(page2, 'Imobiliária', profile.imobiliaria, yPosition, helveticaBold, helvetica, textColor);
        }
        if (profile.telefone) {
          yPosition = drawFieldOnPage(page2, 'Telefone', formatPhone(profile.telefone), yPosition, helveticaBold, helvetica, textColor);
        }

        // Partner broker on page 2
        if (partnerProfile) {
          yPosition -= 10;
          page2.drawText('Corretor Parceiro:', {
            x: 50,
            y: yPosition,
            size: 9,
            font: helveticaBold,
            color: lightGray,
          });
          yPosition -= 15;
          yPosition = drawFieldOnPage(page2, 'Nome', partnerProfile.nome, yPosition, helveticaBold, helvetica, textColor);
          if (partnerProfile.creci) {
            yPosition = drawFieldOnPage(page2, 'CRECI', partnerProfile.creci, yPosition, helveticaBold, helvetica, textColor);
          }
          if (partnerProfile.imobiliaria) {
            yPosition = drawFieldOnPage(page2, 'Imobiliária', partnerProfile.imobiliaria, yPosition, helveticaBold, helvetica, textColor);
          }
          if (partnerProfile.telefone) {
            yPosition = drawFieldOnPage(page2, 'Telefone', formatPhone(partnerProfile.telefone), yPosition, helveticaBold, helvetica, textColor);
          }
          if (ficha.parte_preenchida_parceiro) {
            const parteLabel = ficha.parte_preenchida_parceiro === 'proprietario' ? 'Proprietário' : 'Comprador';
            yPosition = drawFieldOnPage(page2, 'Responsável por', `Dados do ${parteLabel}`, yPosition, helveticaBold, helvetica, textColor);
          }
        }
      }

      // Footer on page 2 - será preenchido após calcular o hash
    } else {
      // Broker Section on same page
      if (profile) {
        yPosition -= 15;
        const hasPartner = !!partnerProfile;
        yPosition = drawSection(hasPartner ? 'CORRETORES RESPONSÁVEIS' : 'CORRETOR RESPONSÁVEL', yPosition);
        
        // Original broker
        if (hasPartner) {
          page.drawText('Corretor Principal:', {
            x: 50,
            y: yPosition,
            size: 9,
            font: helveticaBold,
            color: lightGray,
          });
          yPosition -= 15;
        }
        yPosition = drawField('Nome', profile.nome, yPosition);
        if (profile.creci) {
          yPosition = drawField('CRECI', profile.creci, yPosition);
        }
        if (profile.imobiliaria) {
          yPosition = drawField('Imobiliária', profile.imobiliaria, yPosition);
        }
        if (profile.telefone) {
          yPosition = drawField('Telefone', formatPhone(profile.telefone), yPosition);
        }

        // Partner broker
        if (partnerProfile) {
          yPosition -= 10;
          page.drawText('Corretor Parceiro:', {
            x: 50,
            y: yPosition,
            size: 9,
            font: helveticaBold,
            color: lightGray,
          });
          yPosition -= 15;
          yPosition = drawField('Nome', partnerProfile.nome, yPosition);
          if (partnerProfile.creci) {
            yPosition = drawField('CRECI', partnerProfile.creci, yPosition);
          }
          if (partnerProfile.imobiliaria) {
            yPosition = drawField('Imobiliária', partnerProfile.imobiliaria, yPosition);
          }
          if (partnerProfile.telefone) {
            yPosition = drawField('Telefone', formatPhone(partnerProfile.telefone), yPosition);
          }
          // Show which part the partner filled
          if (ficha.parte_preenchida_parceiro) {
            const parteLabel = ficha.parte_preenchida_parceiro === 'proprietario' ? 'Proprietário' : 'Comprador';
            yPosition = drawField('Responsável por', `Dados do ${parteLabel}`, yPosition);
          }
        }
      }

      // Footer será preenchido após calcular o hash
    }

    // Helper functions for second page
    function drawSectionOnPage(p: typeof page, title: string, startY: number, boldFont: typeof helveticaBold, color: typeof primaryColor): number {
      p.drawText(title, {
        x: 50,
        y: startY,
        size: 12,
        font: boldFont,
        color: color,
      });
      return startY - 20;
    }

    function drawFieldOnPage(p: typeof page, label: string, value: string, startY: number, boldFont: typeof helveticaBold, regularFont: typeof helvetica, color: typeof textColor): number {
      p.drawText(`${label}:`, {
        x: 50,
        y: startY,
        size: 10,
        font: boldFont,
        color: color,
      });
      p.drawText(value || '-', {
        x: 160,
        y: startY,
        size: 10,
        font: regularFont,
        color: color,
      });
      return startY - 18;
    }

    // Gerar PDF intermediário para calcular o hash
    const pdfBytesForHash = await pdfDoc.save();

    // Calcular SHA-256 hash para integridade do documento
    const hashBuffer = await crypto.subtle.digest('SHA-256', new Uint8Array(pdfBytesForHash).buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const documentoHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const documentoGeradoEm = new Date().toISOString();

    console.log('Generated document hash:', documentoHash);

    // Função para desenhar rodapé técnico (formato original da imagem + hash completa)
    const drawTechnicalFooter = (targetPage: typeof page, hash: string) => {
      const pageWidth = targetPage.getWidth();
      
      // Linha separadora
      targetPage.drawLine({
        start: { x: 50, y: 100 },
        end: { x: pageWidth - 50, y: 100 },
        thickness: 1,
        color: lightGray,
      });

      // Linha 1: Verificação (formato original da imagem)
      const verificationLabel = 'Verifique a autenticidade deste documento:';
      const verificationUrlFooter = `visitasegura.com.br/verificar/${ficha.protocolo}`;
      const labelWidth = helveticaBold.widthOfTextAtSize(verificationLabel, 8);
      
      targetPage.drawText(verificationLabel, {
        x: 50,
        y: 85,
        size: 8,
        font: helveticaBold,
        color: darkGray,
      });
      targetPage.drawText(verificationUrlFooter, {
        x: 50 + labelWidth + 6,
        y: 85,
        size: 8,
        font: helvetica,
        color: primaryColor,
      });

      // Linha 2: Validade jurídica (formato original)
      targetPage.drawText('As assinaturas digitais acima possuem validade jurídica conforme Lei 14.063/2020.', {
        x: 50,
        y: 70,
        size: 8,
        font: helvetica,
        color: lightGray,
      });

      // Linha 3: Gerado em + Protegido com hash (formato original)
      const dataGeracao = new Date().toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      targetPage.drawText(`Gerado em: ${dataGeracao} | Protegido com hash SHA-256 - A integridade pode ser verificada online`, {
        x: 50,
        y: 55,
        size: 8,
        font: helvetica,
        color: lightGray,
      });

      // Linha 4: Hash completa (discreta, monoespaçada)
      targetPage.drawText(`Hash: ${hash}`, {
        x: 50,
        y: 40,
        size: 7,
        font: courierFont,
        color: mediumGray,
      });

      // Linha 5: Nome do sistema (formato original)
      targetPage.drawText('VisitaSegura - Sistema de Comprovação de Visitas Imobiliárias', {
        x: 50,
        y: 25,
        size: 8,
        font: helveticaBold,
        color: primaryColor,
      });
    };

    // Determinar qual é a última página e adicionar o rodapé técnico
    const pageCount = pdfDoc.getPageCount();
    const lastPage = pdfDoc.getPage(pageCount - 1);
    drawTechnicalFooter(lastPage, documentoHash);

    // Serializar PDF final com o hash no rodapé
    const pdfBytesFinal = await pdfDoc.save();

    // Salvar hash no banco de dados
    const { error: updateError } = await supabase
      .from('fichas_visita')
      .update({
        documento_hash: documentoHash,
        documento_gerado_em: documentoGeradoEm,
      })
      .eq('id', ficha_id);

    if (updateError) {
      console.error('Error saving document hash:', updateError);
      // Continue anyway - PDF was generated successfully
    } else {
      console.log('Document hash saved successfully');
    }

    return new Response(new Uint8Array(pdfBytesFinal).buffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="comprovante-${ficha.protocolo}.pdf"`,
      },
    });

  } catch (error: unknown) {
    console.error('Error generating PDF:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
