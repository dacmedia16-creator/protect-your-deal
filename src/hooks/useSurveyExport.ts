import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SurveyResponse {
  id: string;
  rating_location: number;
  rating_size: number;
  rating_layout: number;
  rating_finishes: number;
  rating_conservation: number;
  rating_common_areas: number;
  rating_price: number;
  liked_most: string | null;
  liked_least: string | null;
  would_buy: boolean;
  created_at: string;
}

interface Survey {
  id: string;
  status: string;
  sent_at: string | null;
  responded_at: string | null;
  client_name: string | null;
  client_phone: string | null;
  fichas_visita: {
    id: string;
    imovel_endereco: string;
    comprador_nome: string | null;
    protocolo: string;
  } | null;
  survey_responses: SurveyResponse[];
}

const ratingLabels: Record<string, string> = {
  rating_location: 'Localização',
  rating_size: 'Tamanho',
  rating_layout: 'Planta',
  rating_finishes: 'Acabamentos',
  rating_conservation: 'Conservação',
  rating_common_areas: 'Áreas Comuns',
  rating_price: 'Preço',
};

export function useSurveyExport() {
  const exportToExcel = (surveys: Survey[], imobiliariaName: string) => {
    // Filter only responded surveys
    const respondedSurveys = surveys.filter(s => s.status === 'responded' && s.survey_responses.length > 0);
    
    if (respondedSurveys.length === 0) {
      throw new Error('Nenhuma pesquisa respondida para exportar');
    }

    // Create CSV content (Excel compatible)
    const headers = [
      'Cliente',
      'Telefone',
      'Imóvel',
      'Protocolo',
      'Data Resposta',
      'Localização',
      'Tamanho',
      'Planta',
      'Acabamentos',
      'Conservação',
      'Áreas Comuns',
      'Preço',
      'Média Geral',
      'Compraria?',
      'O que mais gostou',
      'O que menos gostou',
    ];

    const rows = respondedSurveys.map(survey => {
      const response = survey.survey_responses[0];
      const avgRating = (
        response.rating_location +
        response.rating_size +
        response.rating_layout +
        response.rating_finishes +
        response.rating_conservation +
        response.rating_common_areas +
        response.rating_price
      ) / 7;

      return [
        survey.client_name || survey.fichas_visita?.comprador_nome || '-',
        survey.client_phone || '-',
        survey.fichas_visita?.imovel_endereco || '-',
        survey.fichas_visita?.protocolo || '-',
        response.created_at ? format(new Date(response.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-',
        response.rating_location,
        response.rating_size,
        response.rating_layout,
        response.rating_finishes,
        response.rating_conservation,
        response.rating_common_areas,
        response.rating_price,
        avgRating.toFixed(1),
        response.would_buy ? 'Sim' : 'Não',
        (response.liked_most || '-').replace(/[\n\r]/g, ' '),
        (response.liked_least || '-').replace(/[\n\r]/g, ' '),
      ];
    });

    // Convert to CSV with BOM for Excel UTF-8 support
    const BOM = '\uFEFF';
    const csvContent = BOM + [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pesquisas_${imobiliariaName}_${format(new Date(), 'dd-MM-yyyy')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = (surveys: Survey[], imobiliariaName: string) => {
    // Filter only responded surveys
    const respondedSurveys = surveys.filter(s => s.status === 'responded' && s.survey_responses.length > 0);
    
    if (respondedSurveys.length === 0) {
      throw new Error('Nenhuma pesquisa respondida para exportar');
    }

    // Calculate overall statistics
    const totalResponses = respondedSurveys.length;
    const wouldBuyCount = respondedSurveys.filter(s => s.survey_responses[0]?.would_buy).length;
    
    const avgRatings: Record<string, number> = {
      rating_location: 0,
      rating_size: 0,
      rating_layout: 0,
      rating_finishes: 0,
      rating_conservation: 0,
      rating_common_areas: 0,
      rating_price: 0,
    };

    respondedSurveys.forEach(survey => {
      const response = survey.survey_responses[0];
      if (response) {
        Object.keys(avgRatings).forEach(key => {
          avgRatings[key] += response[key as keyof SurveyResponse] as number;
        });
      }
    });

    Object.keys(avgRatings).forEach(key => {
      avgRatings[key] = avgRatings[key] / totalResponses;
    });

    const overallAvg = Object.values(avgRatings).reduce((a, b) => a + b, 0) / 7;

    // Create HTML for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Pesquisas - ${imobiliariaName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; color: #333; padding: 40px; background: #fff; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #6366f1; padding-bottom: 20px; }
          .header h1 { color: #6366f1; font-size: 24px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 14px; }
          .summary { display: flex; gap: 20px; margin-bottom: 30px; }
          .summary-card { flex: 1; background: #f8fafc; border-radius: 8px; padding: 20px; text-align: center; }
          .summary-card h3 { font-size: 28px; color: #6366f1; }
          .summary-card p { color: #666; font-size: 12px; margin-top: 5px; }
          .ratings-summary { background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
          .ratings-summary h2 { font-size: 16px; margin-bottom: 15px; color: #333; }
          .rating-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
          .rating-row:last-child { border-bottom: none; }
          .rating-row span { font-size: 14px; }
          .rating-value { font-weight: bold; color: #6366f1; }
          .surveys-list h2 { font-size: 16px; margin-bottom: 15px; color: #333; }
          .survey-item { background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 15px; page-break-inside: avoid; }
          .survey-header { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
          .survey-header .client { font-weight: bold; }
          .survey-header .date { color: #666; font-size: 12px; }
          .survey-ratings { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 15px; }
          .survey-rating { text-align: center; }
          .survey-rating .value { font-size: 20px; font-weight: bold; color: #6366f1; }
          .survey-rating .label { font-size: 10px; color: #666; }
          .would-buy { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .would-buy.yes { background: #dcfce7; color: #16a34a; }
          .would-buy.no { background: #fef2f2; color: #dc2626; }
          .comments { margin-top: 15px; }
          .comment { background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 10px; }
          .comment-label { font-size: 11px; color: #666; margin-bottom: 5px; }
          .comment-text { font-size: 13px; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #999; font-size: 11px; }
          @media print { body { padding: 20px; } .survey-item { page-break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Relatório de Pesquisas Pós-Visita</h1>
          <p>${imobiliariaName} • Gerado em ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
        </div>

        <div class="summary">
          <div class="summary-card">
            <h3>${totalResponses}</h3>
            <p>Pesquisas Respondidas</p>
          </div>
          <div class="summary-card">
            <h3>${overallAvg.toFixed(1)}</h3>
            <p>Média Geral</p>
          </div>
          <div class="summary-card">
            <h3>${((wouldBuyCount / totalResponses) * 100).toFixed(0)}%</h3>
            <p>Comprariam o Imóvel</p>
          </div>
        </div>

        <div class="ratings-summary">
          <h2>Médias por Categoria</h2>
          ${Object.entries(ratingLabels).map(([key, label]) => `
            <div class="rating-row">
              <span>${label}</span>
              <span class="rating-value">${avgRatings[key].toFixed(1)} / 5</span>
            </div>
          `).join('')}
        </div>

        <div class="surveys-list">
          <h2>Detalhamento das Respostas</h2>
          ${respondedSurveys.map(survey => {
            const response = survey.survey_responses[0];
            const avg = (
              response.rating_location +
              response.rating_size +
              response.rating_layout +
              response.rating_finishes +
              response.rating_conservation +
              response.rating_common_areas +
              response.rating_price
            ) / 7;
            
            return `
              <div class="survey-item">
                <div class="survey-header">
                  <div>
                    <div class="client">${survey.client_name || survey.fichas_visita?.comprador_nome || 'Cliente'}</div>
                    <div style="font-size: 12px; color: #666;">${survey.fichas_visita?.imovel_endereco || '-'}</div>
                  </div>
                  <div class="date">${format(new Date(response.created_at), "dd/MM/yyyy", { locale: ptBR })}</div>
                </div>
                
                <div class="survey-ratings">
                  <div class="survey-rating">
                    <div class="value">${response.rating_location}</div>
                    <div class="label">Localização</div>
                  </div>
                  <div class="survey-rating">
                    <div class="value">${response.rating_size}</div>
                    <div class="label">Tamanho</div>
                  </div>
                  <div class="survey-rating">
                    <div class="value">${response.rating_layout}</div>
                    <div class="label">Planta</div>
                  </div>
                  <div class="survey-rating">
                    <div class="value">${response.rating_finishes}</div>
                    <div class="label">Acabamentos</div>
                  </div>
                  <div class="survey-rating">
                    <div class="value">${response.rating_conservation}</div>
                    <div class="label">Conservação</div>
                  </div>
                  <div class="survey-rating">
                    <div class="value">${response.rating_common_areas}</div>
                    <div class="label">Áreas Comuns</div>
                  </div>
                  <div class="survey-rating">
                    <div class="value">${response.rating_price}</div>
                    <div class="label">Preço</div>
                  </div>
                  <div class="survey-rating">
                    <div class="value" style="color: #059669;">${avg.toFixed(1)}</div>
                    <div class="label">Média</div>
                  </div>
                </div>

                <span class="would-buy ${response.would_buy ? 'yes' : 'no'}">
                  ${response.would_buy ? '✓ Compraria' : '✗ Não compraria'}
                </span>

                ${(response.liked_most || response.liked_least) ? `
                  <div class="comments">
                    ${response.liked_most ? `
                      <div class="comment">
                        <div class="comment-label">O que mais gostou:</div>
                        <div class="comment-text">${response.liked_most}</div>
                      </div>
                    ` : ''}
                    ${response.liked_least ? `
                      <div class="comment">
                        <div class="comment-label">O que menos gostou:</div>
                        <div class="comment-text">${response.liked_least}</div>
                      </div>
                    ` : ''}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>

        <div class="footer">
          Gerado automaticamente pelo sistema VisitaSegura
        </div>
      </body>
      </html>
    `;

    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      // Wait for content to load then trigger print
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return { exportToExcel, exportToPDF };
}
