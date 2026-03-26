/**
 * Global status color constants for consistent badge styling across admin pages.
 * All colors use semantic tokens from the design system.
 */

// Badge variants for shadcn Badge component
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

// ============================================
// ENTITY STATUS COLORS (Imobiliárias, Users)
// ============================================

export const entityStatusColors: Record<string, string> = {
  ativo: 'bg-success text-success-foreground',
  ativa: 'bg-success text-success-foreground',
  suspenso: 'bg-destructive text-destructive-foreground',
  suspensa: 'bg-destructive text-destructive-foreground',
  inativo: 'bg-muted text-muted-foreground',
  inativa: 'bg-muted text-muted-foreground',
};

// ============================================
// SUBSCRIPTION STATUS COLORS
// ============================================

export const subscriptionStatusColors: Record<string, string> = {
  ativa: 'bg-success/20 text-success border border-success/30',
  trial: 'bg-primary/20 text-primary border border-primary/30',
  gratuito: 'bg-primary/20 text-primary border border-primary/30',
  pendente: 'bg-warning/20 text-warning border border-warning/30',
  suspensa: 'bg-destructive/20 text-destructive border border-destructive/30',
  cancelada: 'bg-muted text-muted-foreground border border-border',
  desativada: 'bg-muted text-muted-foreground border border-border',
};

export const getSubscriptionBadgeVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'ativa':
      return 'default';
    case 'trial':
    case 'gratuito':
      return 'secondary';
    case 'suspensa':
    case 'pendente':
      return 'destructive';
    case 'cancelada':
    case 'desativada':
      return 'outline';
    default:
      return 'secondary';
  }
};

// ============================================
// FICHA (VISIT RECORD) STATUS COLORS
// ============================================

export const fichaStatusColors: Record<string, string> = {
  pendente: 'bg-warning/20 text-warning border border-warning/30',
  aguardando_proprietario: 'bg-warning/20 text-warning border border-warning/30',
  aguardando_comprador: 'bg-warning/20 text-warning border border-warning/30',
  completo: 'bg-success/20 text-success border border-success/30',
  confirmado: 'bg-success/20 text-success border border-success/30',
  finalizado_parcial: 'bg-success/20 text-success border border-success/30',
  cancelado: 'bg-muted text-muted-foreground border border-border',
};

// ============================================
// INVITE STATUS
// ============================================

export const inviteStatusColors: Record<string, string> = {
  pendente: 'bg-warning/20 text-warning border border-warning/30',
  aceito: 'bg-success/20 text-success border border-success/30',
  expirado: 'bg-muted text-muted-foreground border border-border',
  cancelado: 'bg-destructive/20 text-destructive border border-destructive/30',
};

export const getInviteBadgeVariant = (status: string, expiraEm?: string): BadgeVariant => {
  if (status === 'pendente' && expiraEm && new Date(expiraEm) < new Date()) {
    return 'outline'; // expirado
  }
  switch (status) {
    case 'aceito':
      return 'default';
    case 'pendente':
      return 'secondary';
    case 'cancelado':
      return 'destructive';
    default:
      return 'outline';
  }
};

// ============================================
// USER ROLE BADGES
// ============================================

export const getRoleBadgeVariant = (role: string): BadgeVariant => {
  switch (role) {
    case 'super_admin':
      return 'destructive';
    case 'imobiliaria_admin':
      return 'default';
    case 'corretor':
      return 'secondary';
    default:
      return 'secondary';
  }
};

export const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  imobiliaria_admin: 'Admin Imobiliária',
  construtora_admin: 'Admin Construtora',
  corretor: 'Corretor',
};

// ============================================
// COMMISSION STATUS
// ============================================

export const commissionStatusColors: Record<string, string> = {
  pendente: 'bg-warning/20 text-warning border border-warning/30',
  pago: 'bg-success/20 text-success border border-success/30',
};

export const getCommissionBadgeVariant = (isPaid: boolean): BadgeVariant => {
  return isPaid ? 'default' : 'secondary';
};

// ============================================
// AFFILIATE/COUPON STATUS
// ============================================

export const getActiveBadgeVariant = (isActive: boolean): BadgeVariant => {
  return isActive ? 'default' : 'secondary';
};

export const getCouponStatusVariant = (
  isActive: boolean,
  isExpired: boolean,
  isLimitReached: boolean
): BadgeVariant => {
  if (!isActive) return 'secondary';
  if (isExpired) return 'destructive';
  if (isLimitReached) return 'secondary';
  return 'default';
};

export const getCouponStatusLabel = (
  isActive: boolean,
  isExpired: boolean,
  isLimitReached: boolean
): string => {
  if (!isActive) return 'Inativo';
  if (isExpired) return 'Expirado';
  if (isLimitReached) return 'Limite';
  return 'Ativo';
};

// ============================================
// HELPER: Get color with fallback
// ============================================

export const getStatusColor = (
  colorMap: Record<string, string>,
  status: string,
  fallback = 'bg-muted text-muted-foreground'
): string => {
  return colorMap[status] || fallback;
};
