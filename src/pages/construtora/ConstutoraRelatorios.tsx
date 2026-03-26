import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ConstutoraLayout } from '@/components/layouts/ConstutoraLayout';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function ConstutoraRelatorios() {
  useDocumentTitle('Relatórios | Construtora');

  return (
    <ConstutoraLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Relatórios e análises dos empreendimentos</p>
        </div>
        <Card><CardContent className="py-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Relatórios em desenvolvimento</p>
          <p className="text-sm text-muted-foreground mt-2">Em breve você terá acesso a relatórios detalhados por empreendimento e imobiliária parceira.</p>
        </CardContent></Card>
      </div>
    </ConstutoraLayout>
  );
}
