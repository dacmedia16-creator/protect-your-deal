import { QrCode, CreditCard, Receipt, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BillingType = 'UNDEFINED' | 'PIX' | 'CREDIT_CARD' | 'BOLETO';

interface PaymentMethodSelectorProps {
  value: BillingType;
  onChange: (value: BillingType) => void;
}

const methods = [
  { value: 'UNDEFINED' as BillingType, label: 'Todas', desc: 'Escolher na hora', icon: Wallet },
  { value: 'PIX' as BillingType, label: 'PIX', desc: 'Confirmação instantânea', icon: QrCode },
  { value: 'CREDIT_CARD' as BillingType, label: 'Cartão', desc: 'Recorrência automática', icon: CreditCard },
  { value: 'BOLETO' as BillingType, label: 'Boleto', desc: 'Até 3 dias úteis', icon: Receipt },
];

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  return (
    <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
      <p className="font-medium mb-3">Selecione a forma de pagamento:</p>
      <div className="flex flex-wrap gap-3">
        {methods.map((m) => {
          const Icon = m.icon;
          const isSelected = value === m.value;
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => onChange(m.value)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 border-2 transition-all cursor-pointer text-left',
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border bg-background hover:border-primary/40'
              )}
            >
              <Icon className={cn('h-5 w-5', isSelected ? 'text-primary' : 'text-muted-foreground')} />
              <div>
                <span className={cn('font-medium', isSelected ? 'text-primary' : 'text-foreground')}>
                  {m.label}
                </span>
                <p className="text-xs">{m.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
