/**
 * Helper centralizado para lógica de status de fichas
 * Garante consistência entre Dashboard, ListaFichas e outras páginas
 */

export const STATUS_CONFIRMADO = ['completo', 'finalizado_parcial'] as const;

/**
 * Verifica se uma ficha está confirmada (completo ou finalizado_parcial)
 */
export function isFichaConfirmada(status: string): boolean {
  return STATUS_CONFIRMADO.includes(status as typeof STATUS_CONFIRMADO[number]);
}

/**
 * Verifica se uma ficha está pendente (qualquer status que não seja confirmado)
 */
export function isFichaPendente(status: string): boolean {
  return !isFichaConfirmada(status);
}
