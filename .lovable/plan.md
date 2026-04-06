

# Compactar PDF Individual para 1 Página A4

## Problema
O PDF do relatório individual (`exportSingleToPDF`) está ocupando 2 páginas A4 devido a espaçamentos generosos, paddings altos e fontes grandes.

## Refinamentos para caber em 1 página

### 1. Cabeçalho — reduzir padding
- `padding: 28px 32px 24px` → `padding: 18px 28px 14px`
- Título h1: `20px` → `16px`

### 2. Content — reduzir padding e margins
- `.content padding: 28px 32px` → `padding: 16px 28px`
- `.summary-cards margin-bottom: 28px` → `16px`, gap `14px` → `10px`
- `.summary-card padding: 16px` → `10px 12px`
- Card value: `28px` → `22px`

### 3. Info grid — compactar
- `.info-grid margin-bottom: 28px` → `14px`, gap `16px` → `10px`
- `.info-box padding: 16px` → `10px 12px`
- `.info-row margin-bottom: 6px` → `4px`

### 4. Ratings — compactar
- `.ratings-section margin-bottom: 28px` → `14px`
- `.rating-bar-row padding: 11px 0` → `7px 0`
- Barra height: `12px` → `10px`

### 5. Feedback — compactar
- `.feedback-section margin-bottom: 28px` → `14px`
- `.feedback-card padding: 14px 16px` → `8px 12px`
- Texto feedback: `12px` → `11px`

### 6. Conclusão — compactar
- `.conclusion-card padding: 16px 20px` → `10px 14px`
- `.conclusion-section margin-bottom: 12px` → `8px`

### 7. Rodapé — compactar
- `.footer padding: 16px 32px` → `10px 28px`
- `.footer margin-top: 16px` → `8px`

### 8. Section titles — compactar
- `margin-bottom: 12px` → `8px`, `padding-bottom: 6px` → `4px`

## Arquivo alterado

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useSurveyExport.ts` | Reduzir paddings, margins e font-sizes no CSS para caber em 1 página |

Apenas ajustes de espaçamento — sem mudança estrutural.

