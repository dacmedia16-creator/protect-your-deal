import { FileCheck, Home, User, Calendar } from 'lucide-react';

const FichaDigitalMockup = () => {
  return (
    <div className="bg-background rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-primary/10 px-4 py-3 border-b border-border flex items-center gap-2">
        <FileCheck className="h-5 w-5 text-primary" />
        <span className="font-medium text-sm">Nova Ficha de Visita</span>
      </div>
      
      {/* Form Content */}
      <div className="p-4 space-y-4">
        {/* Imóvel Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Home className="h-3.5 w-3.5" />
            <span>Dados do Imóvel</span>
          </div>
          <div className="bg-muted/50 rounded-md p-3 space-y-2">
            <div className="h-8 bg-background rounded border border-border flex items-center px-3 text-xs text-muted-foreground">
              Rua das Flores, 123 - Centro
            </div>
            <div className="flex gap-2">
              <div className="h-8 flex-1 bg-background rounded border border-border flex items-center px-3 text-xs text-muted-foreground">
                Apartamento
              </div>
              <div className="h-8 w-24 bg-background rounded border border-border flex items-center px-3 text-xs text-muted-foreground">
                SP
              </div>
            </div>
          </div>
        </div>

        {/* Date Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Data da Visita</span>
          </div>
          <div className="h-8 bg-background rounded border border-border flex items-center px-3 text-xs text-muted-foreground">
            28/12/2024 às 14:00
          </div>
        </div>

        {/* Parties Section */}
        <div className="grid grid-cols-2 gap-3">
          {/* Proprietário */}
          <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 mb-2">
              <User className="h-3.5 w-3.5" />
              <span className="font-medium">Proprietário</span>
            </div>
            <div className="space-y-1.5">
              <div className="h-6 bg-background/80 rounded text-xs flex items-center px-2 text-muted-foreground truncate">
                João Silva
              </div>
              <div className="h-6 bg-background/80 rounded text-xs flex items-center px-2 text-muted-foreground">
                (11) 99999-0001
              </div>
            </div>
          </div>
          
          {/* Comprador */}
          <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
            <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 mb-2">
              <User className="h-3.5 w-3.5" />
              <span className="font-medium">Comprador</span>
            </div>
            <div className="space-y-1.5">
              <div className="h-6 bg-background/80 rounded text-xs flex items-center px-2 text-muted-foreground truncate">
                Maria Santos
              </div>
              <div className="h-6 bg-background/80 rounded text-xs flex items-center px-2 text-muted-foreground">
                (11) 99999-0002
              </div>
            </div>
          </div>
        </div>

        {/* Button */}
        <div className="pt-2">
          <div className="h-10 bg-primary rounded-md flex items-center justify-center text-primary-foreground text-sm font-medium">
            Criar Ficha de Visita
          </div>
        </div>
      </div>
    </div>
  );
};

export default FichaDigitalMockup;
