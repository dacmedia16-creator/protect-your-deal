/**
 * Helper centralizado para lógica de status de registros
 * Garante consistência entre Dashboard, ListaFichas e outras páginas
 */

export const STATUS_CONFIRMADO = ['completo', 'finalizado_parcial'] as const;

/**
 * Verifica se um registro está confirmado (completo ou finalizado_parcial)
 */
export function isFichaConfirmada(status: string): boolean {
  return STATUS_CONFIRMADO.includes(status as typeof STATUS_CONFIRMADO[number]);
}

/**
 * Verifica se um registro está pendente (qualquer status que não seja confirmado)
 */
export function isFichaPendente(status: string): boolean {
  return !isFichaConfirmada(status);
}
