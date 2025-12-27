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

    const { ficha_id, app_url } = await req.json();

    if (!ficha_id) {
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
      console.error('Error fetching ficha:', fichaError);
      return new Response(
        JSON.stringify({ error: 'Ficha não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if both parties confirmed
    if (!ficha.proprietario_confirmado_em || !ficha.comprador_confirmado_em) {
      return new Response(
        JSON.stringify({ error: 'Ambas as partes precisam confirmar antes de gerar o comprovante' }),
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

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();

    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const primaryColor = rgb(0.118, 0.227, 0.373); // #1e3a5f
    const textColor = rgb(0.2, 0.2, 0.2);
    const lightGray = rgb(0.6, 0.6, 0.6);

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

    const formatPhone = (phone: string) => {
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

    // Helper to format coordinates
    const formatCoords = (lat: number | null, lng: number | null): string => {
      if (lat === null || lng === null) return 'Não capturada';
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    };

    // Property Section
    yPosition -= 40;
    yPosition = drawSection('DADOS DO IMÓVEL', yPosition);
    yPosition = drawField('Tipo', ficha.imovel_tipo, yPosition);
    yPosition = drawField('Endereço', ficha.imovel_endereco, yPosition);

    // Owner Section with Legal Data
    yPosition -= 15;
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
      yPosition = drawField('Geolocalização', formatCoords(confirmacaoProprietario.aceite_latitude, confirmacaoProprietario.aceite_longitude), yPosition);
      yPosition = drawField('Aceite em', confirmacaoProprietario.aceite_em ? formatDate(confirmacaoProprietario.aceite_em) : '-', yPosition);
    }

    // Buyer Section with Legal Data
    yPosition -= 15;
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
      yPosition = drawField('Geolocalização', formatCoords(confirmacaoComprador.aceite_latitude, confirmacaoComprador.aceite_longitude), yPosition);
      yPosition = drawField('Aceite em', confirmacaoComprador.aceite_em ? formatDate(confirmacaoComprador.aceite_em) : '-', yPosition);
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
        yPosition = drawSectionOnPage(page2, 'CORRETOR RESPONSÁVEL', yPosition, helveticaBold, primaryColor);
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
      }

      // Footer on page 2
      page2.drawLine({
        start: { x: 50, y: 80 },
        end: { x: width - 50, y: 80 },
        thickness: 1,
        color: lightGray,
      });

      page2.drawText('Este documento comprova a intermediação do corretor na visita ao imóvel.', {
        x: 50,
        y: 60,
        size: 9,
        font: helvetica,
        color: lightGray,
      });

      page2.drawText('As assinaturas digitais acima possuem validade jurídica conforme Lei 14.063/2020.', {
        x: 50,
        y: 48,
        size: 8,
        font: helvetica,
        color: lightGray,
      });

      page2.drawText(`Gerado em: ${new Date().toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, {
        x: 50,
        y: 35,
        size: 8,
        font: helvetica,
        color: lightGray,
      });

      page2.drawText('VisitaSegura - Sistema de Comprovação de Visitas Imobiliárias', {
        x: 50,
        y: 22,
        size: 8,
        font: helveticaBold,
        color: primaryColor,
      });
    } else {
      // Broker Section on same page
      if (profile) {
        yPosition -= 15;
        yPosition = drawSection('CORRETOR RESPONSÁVEL', yPosition);
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
      }

      // Footer
      page.drawLine({
        start: { x: 50, y: 80 },
        end: { x: width - 50, y: 80 },
        thickness: 1,
        color: lightGray,
      });

      page.drawText('Este documento comprova a intermediação do corretor na visita ao imóvel.', {
        x: 50,
        y: 60,
        size: 9,
        font: helvetica,
        color: lightGray,
      });

      page.drawText('As assinaturas digitais acima possuem validade jurídica conforme Lei 14.063/2020.', {
        x: 50,
        y: 48,
        size: 8,
        font: helvetica,
        color: lightGray,
      });

      page.drawText(`Gerado em: ${new Date().toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, {
        x: 50,
        y: 35,
        size: 8,
        font: helvetica,
        color: lightGray,
      });

      page.drawText('VisitaSegura - Sistema de Comprovação de Visitas Imobiliárias', {
        x: 50,
        y: 22,
        size: 8,
        font: helveticaBold,
        color: primaryColor,
      });
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

    // Serialize PDF
    const pdfBytes = await pdfDoc.save();

    return new Response(new Uint8Array(pdfBytes).buffer, {
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
