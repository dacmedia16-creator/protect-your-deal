import { QrCode, CreditCard, Receipt, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type BillingType = 'PIX' | 'CREDIT_CARD' | 'BOLETO';

interface PaymentButtonsProps {
  onSelect: (billingType: BillingType) => void;
  disabled?: boolean;
  loading?: boolean;
  loadingType?: BillingType | null;
}

const methods: { value: BillingType; label: string; icon: typeof QrCode }[] = [
  { value: 'PIX', label: 'PIX', icon: QrCode },
  { value: 'CREDIT_CARD', label: 'Cartão', icon: CreditCard },
  { value: 'BOLETO', label: 'Boleto', icon: Receipt },
];

export function PaymentButtons({ onSelect, disabled, loading, loadingType }: PaymentButtonsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {methods.map((m) => {
        const Icon = m.icon;
        const isLoading = loading && loadingType === m.value;
        return (
          <Button
            key={m.value}
            variant="outline"
            size="sm"
            disabled={disabled || loading}
            onClick={() => onSelect(m.value)}
            className="flex items-center gap-1.5 text-xs"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Icon className="h-3.5 w-3.5" />
            )}
            {isLoading ? 'Abrindo...' : m.label}
          </Button>
        );
      })}
    </div>
  );
}
