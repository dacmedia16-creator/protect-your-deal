/**
 * Valida formato de CRECI Jurídico
 * Aceita formatos: J-12345, J 12345, 12345-J, CRECI/SP J-12345
 */
export function isValidCreciJuridico(value: string): boolean {
  if (!value || value.trim() === '') return true; // Campo opcional
  
  const cleaned = value.toUpperCase().trim();
  
  // Padrões aceitos para CRECI Jurídico
  const patterns = [
    /^J[-\s]?\d{3,6}$/,           // J-12345, J 12345, J12345
    /^\d{3,6}[-\s]?J$/,           // 12345-J, 12345 J, 12345J
    /^CRECI\/[A-Z]{2}\s*J[-\s]?\d{3,6}$/, // CRECI/SP J-12345
  ];
  
  return patterns.some(pattern => pattern.test(cleaned));
}

/**
 * Formata CRECI Jurídico para padrão J-XXXXX
 */
export function formatCreciJuridico(value: string): string {
  if (!value) return '';
  
  const upper = value.toUpperCase().trim();
  
  // Extrai apenas J e números
  const hasJ = upper.includes('J');
  const numbers = upper.replace(/\D/g, '');
  
  if (!numbers) return upper; // Retorna como está se não tem números
  
  // Limita a 6 dígitos
  const limitedNumbers = numbers.slice(0, 6);
  
  if (hasJ) {
    return `J-${limitedNumbers}`;
  }
  
  return upper; // Retorna original se não identificar padrão
}
