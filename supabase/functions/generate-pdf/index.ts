import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1';
import QRCode from 'https://esm.sh/qrcode@1.5.3';

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

    const { ficha_id } = await req.json();

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

    // Get broker profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', ficha.user_id)
      .single();

    // Generate verification URL
    const verificationUrl = `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/confirmar/${ficha.protocolo}`;
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 120,
      margin: 1,
      color: { dark: '#1e3a5f', light: '#ffffff' }
    });

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

    // Header
    page.drawText('COMPROVANTE DE VISITA IMOBILIÁRIA', {
      x: 50,
      y: yPosition,
      size: 18,
      font: helveticaBold,
      color: primaryColor,
    });

    yPosition -= 25;
    page.drawText(`Protocolo: ${ficha.protocolo}`, {
      x: 50,
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

    // QR Code
    const qrImageBytes = await fetch(qrCodeDataUrl).then(res => res.arrayBuffer());
    const qrImage = await pdfDoc.embedPng(qrImageBytes);
    page.drawImage(qrImage, {
      x: width - 170,
      y: height - 180,
      width: 100,
      height: 100,
    });

    page.drawText('Escaneie para verificar', {
      x: width - 175,
      y: height - 195,
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

    // Property Section
    yPosition -= 40;
    yPosition = drawSection('DADOS DO IMÓVEL', yPosition);
    yPosition = drawField('Tipo', ficha.imovel_tipo, yPosition);
    yPosition = drawField('Endereço', ficha.imovel_endereco, yPosition);

    // Owner Section
    yPosition -= 15;
    yPosition = drawSection('PROPRIETÁRIO', yPosition);
    yPosition = drawField('Nome', ficha.proprietario_nome, yPosition);
    yPosition = drawField('CPF', formatCPF(ficha.proprietario_cpf), yPosition);
    yPosition = drawField('Telefone', formatPhone(ficha.proprietario_telefone), yPosition);
    yPosition = drawField('Confirmado em', formatDate(ficha.proprietario_confirmado_em), yPosition);

    // Buyer Section
    yPosition -= 15;
    yPosition = drawSection('COMPRADOR/INTERESSADO', yPosition);
    yPosition = drawField('Nome', ficha.comprador_nome, yPosition);
    yPosition = drawField('CPF', formatCPF(ficha.comprador_cpf), yPosition);
    yPosition = drawField('Telefone', formatPhone(ficha.comprador_telefone), yPosition);
    yPosition = drawField('Confirmado em', formatDate(ficha.comprador_confirmado_em), yPosition);

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

    // Broker Section
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

    page.drawText(`Gerado em: ${new Date().toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, {
      x: 50,
      y: 45,
      size: 8,
      font: helvetica,
      color: lightGray,
    });

    page.drawText('VisitaSegura - Sistema de Comprovação de Visitas Imobiliárias', {
      x: 50,
      y: 30,
      size: 8,
      font: helveticaBold,
      color: primaryColor,
    });

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
