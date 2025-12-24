/**
 * Validates a Brazilian CPF (Cadastro de Pessoas Físicas) number
 * using the official digit verification algorithm.
 */
export function validateCPF(cpf: string): boolean {
  // Remove non-numeric characters
  const cleaned = cpf.replace(/\D/g, '');

  // Must have exactly 11 digits
  if (cleaned.length !== 11) {
    return false;
  }

  // Reject known invalid patterns (all same digit)
  if (/^(\d)\1{10}$/.test(cleaned)) {
    return false;
  }

  // Calculate first verification digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  if (remainder !== parseInt(cleaned[9])) {
    return false;
  }

  // Calculate second verification digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  if (remainder !== parseInt(cleaned[10])) {
    return false;
  }

  return true;
}

/**
 * Format CPF as XXX.XXX.XXX-XX
 */
export function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
}
