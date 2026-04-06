import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import html2pdf from 'html2pdf.js';

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
  corretor_nome?: string | null;
  fichas_visita: {
    id: string;
    imovel_endereco: string;
    imovel_tipo?: string;
    data_visita?: string;
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

// Color palette
const COLORS = {
  primary: '#1e293b',
  accent: '#2563eb',
  accentLight: '#dbeafe',
  green: '#059669',
  greenBg: '#ecfdf5',
  greenBorder: '#a7f3d0',
  red: '#dc2626',
  redBg: '#fef2f2',
  redBorder: '#fecaca',
  amber: '#d97706',
  amberBg: '#fffbeb',
  cardBg: '#f8fafc',
  border: '#e2e8f0',
  textMuted: '#64748b',
  textLight: '#94a3b8',
};

function getRatingColor(value: number): string {
  if (value >= 4) return COLORS.green;
  if (value >= 3) return COLORS.amber;
  return COLORS.red;
}

function getRatingBarBg(value: number): string {
  if (value >= 4) return COLORS.greenBg;
  if (value >= 3) return COLORS.amberBg;
  return COLORS.redBg;
}

function formatImovelTipo(tipo: string | undefined): string {
  if (!tipo) return '';
  const map: Record<string, string> = {
    apartamento: 'Apartamento',
    casa: 'Casa',
    terreno: 'Terreno',
    comercial: 'Comercial',
    rural: 'Rural',
    sala_comercial: 'Sala Comercial',
    galpao: 'Galpão',
    lote: 'Lote',
    cobertura: 'Cobertura',
    flat: 'Flat',
    kitnet: 'Kitnet',
    sobrado: 'Sobrado',
    chacara: 'Chácara',
    fazenda: 'Fazenda',
    sitio: 'Sítio',
  };
  return map[tipo] || tipo.charAt(0).toUpperCase() + tipo.slice(1);
}

function emptyValue(val: string): string {
  if (!val || val === '—' || val === '-') return `<span style="color: ${COLORS.textLight}; font-style: italic; font-weight: 400;">Não informado</span>`;
  return val;
}

function calcAvg(response: SurveyResponse): number {
  return (
    response.rating_location +
    response.rating_size +
    response.rating_layout +
    response.rating_finishes +
    response.rating_conservation +
    response.rating_common_areas +
    response.rating_price
  ) / 7;
}

function getConclusion(avg: number, wouldBuy: boolean, response: SurveyResponse): string {
  const ratings: { label: string; value: number }[] = Object.entries(ratingLabels).map(([key, label]) => ({
    label,
    value: response[key as keyof SurveyResponse] as number,
  }));
  const best = ratings.reduce((a, b) => (b.value > a.value ? b : a));
  const worst = ratings.reduce((a, b) => (b.value < a.value ? b : a));

  let text = '';
  if (avg >= 4 && wouldBuy) {
    text = 'Avaliação altamente positiva. Cliente demonstrou interesse real de compra.';
  } else if (avg >= 3 && wouldBuy) {
    text = 'Avaliação satisfatória com interesse de compra declarado.';
  } else if (avg >= 3 && !wouldBuy) {
    text = 'Avaliação satisfatória, porém sem intenção de compra neste momento.';
  } else {
    text = 'Avaliação abaixo da média. Recomenda-se atenção aos pontos negativos indicados.';
  }

  text += ` Destaque positivo: <strong>${best.label}</strong> (${best.value}/5).`;
  text += ` Ponto de atenção: <strong>${worst.label}</strong> (${worst.value}/5).`;

  return text;
}

// Shared CSS styles for professional PDF
function getBaseStyles(): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; color: #334155; background: #fff; }
    
    .header {
      background: ${COLORS.primary};
      color: white;
      padding: 28px 32px 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .header-left h1 { font-size: 20px; font-weight: 700; letter-spacing: -0.3px; margin-bottom: 4px; }
    .header-left .subtitle { font-size: 12px; opacity: 0.65; font-weight: 400; }
    .header-right { text-align: right; }
    .header-right .protocol { 
      font-size: 15px; font-weight: 700; letter-spacing: 0.8px; 
      font-family: 'Courier New', Courier, monospace; 
      margin-bottom: 8px; 
      padding-bottom: 8px; 
      border-bottom: 1px solid rgba(255,255,255,0.2); 
    }
    .header-right .header-meta { font-size: 11px; opacity: 0.75; line-height: 1.7; }
    .header-right .header-meta strong { opacity: 1; font-weight: 600; }
    
    .content { padding: 28px 32px; }
    
    .summary-cards {
      display: flex;
      gap: 14px;
      margin-bottom: 28px;
    }
    .summary-card {
      flex: 1;
      border: 1px solid ${COLORS.border};
      border-radius: 10px;
      padding: 16px;
      text-align: center;
    }
    .summary-card .card-value { font-size: 28px; font-weight: 800; letter-spacing: -1px; }
    .summary-card .card-label { font-size: 10px; color: ${COLORS.textMuted}; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 2px; font-weight: 600; }
    .summary-card .card-sub { font-size: 10px; color: ${COLORS.textLight}; margin-top: 4px; }
    
    .section-title {
      font-size: 11px;
      font-weight: 700;
      color: ${COLORS.textMuted};
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 2px solid ${COLORS.primary};
      display: inline-block;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 28px;
    }
    .info-box {
      background: ${COLORS.cardBg};
      border-radius: 8px;
      padding: 16px;
      border: 1px solid ${COLORS.border};
    }
    .info-box .box-title {
      font-size: 10px;
      font-weight: 700;
      color: ${COLORS.textMuted};
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 10px;
    }
    .info-row { display: flex; margin-bottom: 6px; }
    .info-row .info-label { font-size: 11px; color: ${COLORS.textMuted}; width: 85px; flex-shrink: 0; }
    .info-row .info-value { font-size: 12px; font-weight: 500; color: #1e293b; word-break: break-word; line-height: 1.5; }
    
    .ratings-section { margin-bottom: 28px; }
    .rating-bar-row {
      display: flex;
      align-items: center;
      padding: 11px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .rating-bar-row:last-child { border-bottom: none; }
    .rating-bar-label { font-size: 12px; color: #475569; width: 110px; flex-shrink: 0; font-weight: 500; }
    .rating-bar-container {
      flex: 1;
      height: 12px;
      background: #e9edf2;
      border-radius: 6px;
      margin: 0 14px;
      overflow: hidden;
    }
    .rating-bar-fill {
      height: 100%;
      border-radius: 6px;
    }
    .rating-bar-value {
      font-size: 13px;
      font-weight: 700;
      width: 36px;
      text-align: right;
    }
    
    .feedback-section { margin-bottom: 28px; }
    .feedback-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .feedback-card {
      border-radius: 8px;
      padding: 14px 16px;
      border: 1px solid;
    }
    .feedback-card.positive { background: ${COLORS.greenBg}; border-color: ${COLORS.greenBorder}; }
    .feedback-card.negative { background: ${COLORS.redBg}; border-color: ${COLORS.redBorder}; }
    .feedback-card .fb-icon { font-size: 14px; margin-bottom: 4px; }
    .feedback-card .fb-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .feedback-card.positive .fb-title { color: ${COLORS.green}; }
    .feedback-card.negative .fb-title { color: ${COLORS.red}; }
    .feedback-card .fb-text { font-size: 12px; line-height: 1.5; color: #334155; font-style: italic; }
    .feedback-single { grid-column: 1 / -1; }

    .conclusion-section { margin-bottom: 12px; }
    .conclusion-card {
      background: ${COLORS.cardBg};
      border: 1px solid ${COLORS.border};
      border-left: 4px solid ${COLORS.accent};
      border-radius: 0 8px 8px 0;
      padding: 16px 20px;
    }
    .conclusion-card .conclusion-text {
      font-size: 12px;
      line-height: 1.6;
      color: #334155;
    }
    
    .footer {
      margin-top: 16px;
      padding: 16px 32px;
      border-top: 2px solid ${COLORS.primary};
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: ${COLORS.textLight};
    }
    .footer-brand { font-weight: 700; color: ${COLORS.textMuted}; letter-spacing: 0.5px; }
    .footer-center { text-align: center; }
    .footer-right { text-align: right; }
  `;
}

export function useSurveyExport() {
  const exportToExcel = (surveys: Survey[], imobiliariaName: string) => {
    const respondedSurveys = surveys.filter(s => s.status === 'responded' && s.survey_responses.length > 0);
    if (respondedSurveys.length === 0) throw new Error('Nenhuma pesquisa respondida para exportar');

    const headers = [
      'Cliente', 'Telefone', 'Imóvel', 'Tipo', 'Protocolo', 'Data Visita', 'Data Resposta', 'Corretor',
      'Localização', 'Tamanho', 'Planta', 'Acabamentos', 'Conservação', 'Áreas Comuns', 'Preço',
      'Média Geral', 'Compraria?', 'O que mais gostou', 'O que menos gostou',
    ];

    const rows = respondedSurveys.map(survey => {
      const response = survey.survey_responses[0];
      const avg = calcAvg(response);
      return [
        survey.client_name || survey.fichas_visita?.comprador_nome || '-',
        survey.client_phone || '-',
        survey.fichas_visita?.imovel_endereco || '-',
        formatImovelTipo(survey.fichas_visita?.imovel_tipo) || '-',
        survey.fichas_visita?.protocolo || '-',
        survey.fichas_visita?.data_visita ? format(new Date(survey.fichas_visita.data_visita), 'dd/MM/yyyy', { locale: ptBR }) : '-',
        response.created_at ? format(new Date(response.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-',
        survey.corretor_nome || '-',
        response.rating_location, response.rating_size, response.rating_layout,
        response.rating_finishes, response.rating_conservation, response.rating_common_areas, response.rating_price,
        avg.toFixed(1),
        response.would_buy ? 'Sim' : 'Não',
        (response.liked_most || '-').replace(/[\n\r]/g, ' '),
        (response.liked_least || '-').replace(/[\n\r]/g, ' '),
      ];
    });

    const BOM = '\uFEFF';
    const csvContent = BOM + [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

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
    const respondedSurveys = surveys.filter(s => s.status === 'responded' && s.survey_responses.length > 0);
    if (respondedSurveys.length === 0) throw new Error('Nenhuma pesquisa respondida para exportar');

    const totalResponses = respondedSurveys.length;
    const wouldBuyCount = respondedSurveys.filter(s => s.survey_responses[0]?.would_buy).length;

    const avgRatings: Record<string, number> = {};
    Object.keys(ratingLabels).forEach(key => { avgRatings[key] = 0; });
    respondedSurveys.forEach(survey => {
      const response = survey.survey_responses[0];
      if (response) {
        Object.keys(avgRatings).forEach(key => {
          avgRatings[key] += response[key as keyof SurveyResponse] as number;
        });
      }
    });
    Object.keys(avgRatings).forEach(key => { avgRatings[key] /= totalResponses; });
    const overallAvg = Object.values(avgRatings).reduce((a, b) => a + b, 0) / 7;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          ${getBaseStyles()}
          .survey-item { 
            background: ${COLORS.cardBg}; 
            border: 1px solid ${COLORS.border}; 
            border-radius: 10px; 
            padding: 18px 20px; 
            margin-bottom: 14px; 
            page-break-inside: avoid; 
          }
          .survey-item-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start;
            margin-bottom: 12px; 
            padding-bottom: 10px; 
            border-bottom: 1px solid ${COLORS.border}; 
          }
          .survey-item-client { font-weight: 600; font-size: 13px; color: ${COLORS.primary}; }
          .survey-item-address { font-size: 11px; color: ${COLORS.textMuted}; margin-top: 2px; }
          .survey-item-date { font-size: 10px; color: ${COLORS.textLight}; }
          .survey-mini-ratings { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
          .mini-rating { 
            background: white; 
            border: 1px solid ${COLORS.border}; 
            border-radius: 6px; 
            padding: 6px 10px; 
            text-align: center; 
            min-width: 70px;
          }
          .mini-rating .mr-value { font-size: 16px; font-weight: 700; }
          .mini-rating .mr-label { font-size: 8px; color: ${COLORS.textMuted}; text-transform: uppercase; letter-spacing: 0.3px; }
          .survey-item-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
          .buy-tag { 
            font-size: 11px; 
            font-weight: 700; 
            padding: 4px 12px; 
            border-radius: 20px; 
          }
          .buy-tag.yes { background: ${COLORS.greenBg}; color: ${COLORS.green}; }
          .buy-tag.no { background: ${COLORS.redBg}; color: ${COLORS.red}; }
          .survey-comment { font-size: 10px; color: ${COLORS.textMuted}; font-style: italic; margin-top: 6px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <h1>Relatório Consolidado de Pesquisas</h1>
            <div class="subtitle">Pesquisas Pós-Visita</div>
          </div>
          <div class="header-right">
            <div class="protocol">${imobiliariaName}</div>
            <div class="header-meta">${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
          </div>
        </div>

        <div class="content">
          <div class="summary-cards">
            <div class="summary-card">
              <div class="card-value" style="color: ${COLORS.accent};">${totalResponses}</div>
              <div class="card-label">Pesquisas Respondidas</div>
            </div>
            <div class="summary-card">
              <div class="card-value" style="color: ${getRatingColor(overallAvg)};">${overallAvg.toFixed(1)}</div>
              <div class="card-label">Média Geral</div>
              <div class="card-sub">de 5.0</div>
            </div>
            <div class="summary-card">
              <div class="card-value" style="color: ${COLORS.green};">${((wouldBuyCount / totalResponses) * 100).toFixed(0)}%</div>
              <div class="card-label">Comprariam</div>
              <div class="card-sub">${wouldBuyCount} de ${totalResponses}</div>
            </div>
          </div>

          <div class="ratings-section">
            <div class="section-title">Médias por Critério</div>
            ${Object.entries(ratingLabels).map(([key, label]) => {
              const val = avgRatings[key];
              return `
                <div class="rating-bar-row">
                  <div class="rating-bar-label">${label}</div>
                  <div class="rating-bar-container">
                    <div class="rating-bar-fill" style="width: ${(val / 5) * 100}%; background: ${getRatingColor(val)};"></div>
                  </div>
                  <div class="rating-bar-value" style="color: ${getRatingColor(val)};">${val.toFixed(1)}</div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="section-title">Detalhamento das Respostas</div>
          ${respondedSurveys.map(survey => {
            const r = survey.survey_responses[0];
            const avg = calcAvg(r);
            return `
              <div class="survey-item">
                <div class="survey-item-header">
                  <div>
                    <div class="survey-item-client">${survey.client_name || survey.fichas_visita?.comprador_nome || 'Cliente'}</div>
                    <div class="survey-item-address">${survey.fichas_visita?.imovel_endereco || '-'}</div>
                  </div>
                  <div class="survey-item-date">${format(new Date(r.created_at), 'dd/MM/yyyy', { locale: ptBR })}</div>
                </div>
                <div class="survey-mini-ratings">
                  ${Object.entries(ratingLabels).map(([key, label]) => {
                    const v = r[key as keyof SurveyResponse] as number;
                    return `
                      <div class="mini-rating">
                        <div class="mr-value" style="color: ${getRatingColor(v)};">${v}</div>
                        <div class="mr-label">${label}</div>
                      </div>
                    `;
                  }).join('')}
                  <div class="mini-rating" style="background: ${COLORS.accentLight}; border-color: ${COLORS.accent};">
                    <div class="mr-value" style="color: ${COLORS.accent};">${avg.toFixed(1)}</div>
                    <div class="mr-label">Média</div>
                  </div>
                </div>
                <div class="survey-item-footer">
                  <span class="buy-tag ${r.would_buy ? 'yes' : 'no'}">${r.would_buy ? '✓ Compraria' : '✗ Não compraria'}</span>
                  ${survey.corretor_nome ? `<span style="font-size: 10px; color: ${COLORS.textMuted};">Corretor: ${survey.corretor_nome}</span>` : ''}
                </div>
                ${r.liked_most ? `<div class="survey-comment">👍 ${r.liked_most}</div>` : ''}
                ${r.liked_least ? `<div class="survey-comment">👎 ${r.liked_least}</div>` : ''}
              </div>
            `;
          }).join('')}
        </div>

        <div class="footer">
          <span class="footer-brand">VisitaProva</span>
          <span class="footer-center">${imobiliariaName}</span>
          <span class="footer-right">Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
        </div>
      </body>
      </html>
    `;

    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    html2pdf().from(container).set({
      margin: 0,
      filename: `pesquisas_${imobiliariaName}_${format(new Date(), 'dd-MM-yyyy')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    }).save().then(() => {
      document.body.removeChild(container);
    });
  };

  const exportSingleToPDF = (survey: Survey, imobiliariaName: string) => {
    if (survey.status !== 'responded' || survey.survey_responses.length === 0) {
      throw new Error('Esta pesquisa ainda não foi respondida');
    }

    const response = survey.survey_responses[0];
    const avg = calcAvg(response);
    const clientName = survey.client_name || survey.fichas_visita?.comprador_nome || 'Cliente';
    const propertyAddress = survey.fichas_visita?.imovel_endereco || '';
    const protocol = survey.fichas_visita?.protocolo || '';
    const imovelTipo = formatImovelTipo(survey.fichas_visita?.imovel_tipo);
    const dataVisita = survey.fichas_visita?.data_visita
      ? format(new Date(survey.fichas_visita.data_visita), 'dd/MM/yyyy', { locale: ptBR })
      : '';
    const dataResposta = format(new Date(response.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    const corretorNome = survey.corretor_nome || '';

    const hasFeedback = response.liked_most || response.liked_least;
    const hasBothFeedback = response.liked_most && response.liked_least;

    const conclusionText = getConclusion(avg, response.would_buy, response);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>${getBaseStyles()}</style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <h1>Relatório Pós-Visita</h1>
            <div class="subtitle">Pesquisa de Satisfação • ${dataVisita || 'Data não informada'}</div>
          </div>
          <div class="header-right">
            <div class="protocol">${protocol || 'S/N'}</div>
            <div class="header-meta">
              <strong>${imobiliariaName}</strong><br/>
              ${corretorNome ? `Corretor: ${corretorNome}` : ''}
            </div>
          </div>
        </div>

        <div class="content">
          <!-- Summary Cards -->
          <div class="summary-cards">
            <div class="summary-card" style="background: ${getRatingBarBg(avg)};">
              <div class="card-value" style="color: ${getRatingColor(avg)};">${avg.toFixed(1)}</div>
              <div class="card-label">Média Geral</div>
              <div class="card-sub">de 5.0 pontos</div>
            </div>
            <div class="summary-card" style="background: ${response.would_buy ? COLORS.greenBg : COLORS.redBg};">
              <div class="card-value" style="color: ${response.would_buy ? COLORS.green : COLORS.red}; font-size: 22px;">
                ${response.would_buy ? '✓ Sim' : '✗ Não'}
              </div>
              <div class="card-label">Intenção de Compra</div>
            </div>
            <div class="summary-card">
              <div class="card-value" style="color: ${COLORS.accent}; font-size: 14px; font-weight: 600;">${dataResposta}</div>
              <div class="card-label">Data da Resposta</div>
            </div>
          </div>

          <!-- Client & Property Info -->
          <div class="info-grid">
            <div class="info-box">
              <div class="box-title">Dados do Cliente</div>
              <div class="info-row">
                <span class="info-label">Nome</span>
                <span class="info-value">${clientName}</span>
              </div>
              ${survey.client_phone ? `
                <div class="info-row">
                  <span class="info-label">Telefone</span>
                  <span class="info-value">${survey.client_phone}</span>
                </div>
              ` : ''}
            </div>
            <div class="info-box">
              <div class="box-title">Imóvel Visitado</div>
              <div class="info-row">
                <span class="info-label">Endereço</span>
                <span class="info-value">${emptyValue(propertyAddress)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Tipo</span>
                <span class="info-value">${emptyValue(imovelTipo)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Protocolo</span>
                <span class="info-value" style="font-family: 'Courier New', monospace; letter-spacing: 0.3px;">${emptyValue(protocol)}</span>
              </div>
            </div>
          </div>

          <!-- Ratings -->
          <div class="ratings-section">
            <div class="section-title">Avaliações por Critério</div>
            ${Object.entries(ratingLabels).map(([key, label]) => {
              const value = response[key as keyof SurveyResponse] as number;
              return `
                <div class="rating-bar-row">
                  <div class="rating-bar-label">${label}</div>
                  <div class="rating-bar-container">
                    <div class="rating-bar-fill" style="width: ${(value / 5) * 100}%; background: ${getRatingColor(value)};"></div>
                  </div>
                  <div class="rating-bar-value" style="color: ${getRatingColor(value)};">${value}/5</div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Feedback -->
          ${hasFeedback ? `
            <div class="feedback-section">
              <div class="section-title">Feedback do Cliente</div>
              <div class="feedback-grid">
                ${response.liked_most ? `
                  <div class="feedback-card positive ${!hasBothFeedback ? 'feedback-single' : ''}">
                    <div class="fb-icon">👍</div>
                    <div class="fb-title">O que mais gostou</div>
                    <div class="fb-text">"${response.liked_most}"</div>
                  </div>
                ` : ''}
                ${response.liked_least ? `
                  <div class="feedback-card negative ${!hasBothFeedback ? 'feedback-single' : ''}">
                    <div class="fb-icon">👎</div>
                    <div class="fb-title">O que menos gostou</div>
                    <div class="fb-text">"${response.liked_least}"</div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Conclusion -->
          <div class="conclusion-section">
            <div class="section-title">Parecer Resumido</div>
            <div class="conclusion-card">
              <div class="conclusion-text">${conclusionText}</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <span class="footer-brand">VisitaProva</span>
          <span class="footer-center">Protocolo ${protocol || 'S/N'}</span>
          <span class="footer-right">Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
        </div>
      </body>
      </html>
    `;

    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    html2pdf().from(container).set({
      margin: 0,
      filename: `pesquisa_${clientName.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'dd-MM-yyyy')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    }).save().then(() => {
      document.body.removeChild(container);
    });
  };

  return { exportToExcel, exportToPDF, exportSingleToPDF };
}
