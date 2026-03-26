import { useUserRole } from '@/hooks/useUserRole';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ConstutoraLayout } from '@/components/layouts/ConstutoraLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { subscriptionStatusColors, getStatusColor } from '@/lib/statusColors';
import { cn } from '@/lib/utils';

export default function ConstutoraAssinatura() {
  useDocumentTitle('Assinatura | Construtora');
  const { assinatura } = useUserRole();

  return (
    <ConstutoraLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Assinatura</h1>
          <p className="text-muted-foreground">Gerencie o plano da construtora</p>
        </div>

        {assinatura ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Plano Atual</CardTitle>
                <Badge className={cn("text-xs", getStatusColor(subscriptionStatusColors, assinatura.status))}>
                  {assinatura.status === 'ativa' ? 'Ativa' : assinatura.status === 'trial' ? 'Período de Teste' : assinatura.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Plano</p>
                  <p className="font-medium">{assinatura.plano?.nome || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Mensal</p>
                  <p className="font-medium">R$ {assinatura.plano?.valor_mensal?.toFixed(2) || '0,00'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Início</p>
                  <p className="font-medium">{assinatura.data_inicio || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Próxima Cobrança</p>
                  <p className="font-medium">{assinatura.proxima_cobranca || '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card><CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhuma assinatura encontrada</p>
          </CardContent></Card>
        )}
      </div>
    </ConstutoraLayout>
  );
}
