import { Users, Search, Filter, Phone, Building2 } from 'lucide-react';

const CRMMockup = () => {
  const clients = [
    { name: 'João Silva', type: 'proprietario', phone: '(11) 99999-0001', tags: ['Ativo', 'Premium'] },
    { name: 'Maria Santos', type: 'comprador', phone: '(11) 99999-0002', tags: ['Novo'] },
    { name: 'Carlos Oliveira', type: 'proprietario', phone: '(11) 99999-0003', tags: ['Ativo'] },
  ];

  return (
    <div className="bg-background rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-primary/10 px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <span className="font-medium text-sm">Clientes</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">128</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-muted/50 flex items-center justify-center">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <div className="h-9 bg-muted/50 rounded-md border border-border pl-9 flex items-center text-sm text-muted-foreground">
            Buscar clientes...
          </div>
        </div>

        {/* Client Cards */}
        <div className="space-y-2">
          {clients.map((client, i) => (
            <div 
              key={i} 
              className="bg-card rounded-lg border border-border p-3 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    client.type === 'proprietario' 
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  }`}>
                    {client.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{client.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {client.type === 'proprietario' ? 'Proprietário' : 'Comprador'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {client.tags.map((tag, j) => (
                    <span 
                      key={j} 
                      className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {client.phone}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Properties Mini Section */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Building2 className="h-3.5 w-3.5" />
            <span>3 imóveis vinculados</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CRMMockup;
