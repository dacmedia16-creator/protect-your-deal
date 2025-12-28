import { Download, Shield, FileText, CheckCircle2 } from 'lucide-react';

const PDFComprovanteMockup = () => {
  return (
    <div className="bg-background rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-red-500/10 px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
          <span className="font-medium text-sm">Comprovante PDF</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Download className="h-3.5 w-3.5" />
          <span>Download</span>
        </div>
      </div>
      
      <div className="p-4">
        {/* PDF Preview */}
        <div className="bg-white dark:bg-gray-100 rounded-lg shadow-md p-4 space-y-4 text-gray-900">
          {/* PDF Header */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <p className="font-bold text-sm">VisitaSegura</p>
                <p className="text-[10px] text-gray-500">Comprovante de Visita</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500">Protocolo</p>
              <p className="font-mono text-xs font-bold">VS-2024-001234</p>
            </div>
          </div>

          {/* Property Info */}
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-gray-500 uppercase">Imóvel Visitado</p>
            <p className="text-xs">Rua das Flores, 123 - Apt 45</p>
            <p className="text-[10px] text-gray-500">Centro, São Paulo - SP</p>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-amber-50 rounded p-2">
              <p className="text-[10px] font-medium text-amber-700">Proprietário</p>
              <p className="text-xs">João Silva</p>
              <div className="flex items-center gap-1 mt-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                <span className="text-[9px] text-emerald-600">Confirmado</span>
              </div>
            </div>
            <div className="bg-blue-50 rounded p-2">
              <p className="text-[10px] font-medium text-blue-700">Comprador</p>
              <p className="text-xs">Maria Santos</p>
              <div className="flex items-center gap-1 mt-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                <span className="text-[9px] text-emerald-600">Confirmado</span>
              </div>
            </div>
          </div>

          {/* Date and Corretor */}
          <div className="flex justify-between text-xs border-t border-gray-200 pt-3">
            <div>
              <p className="text-[10px] text-gray-500">Data da Visita</p>
              <p>28/12/2024 às 14:00</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500">Corretor</p>
              <p>Carlos Oliveira</p>
            </div>
          </div>

          {/* QR Code Mini */}
          <div className="flex items-center justify-center pt-2">
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
              <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
                <div className="grid grid-cols-4 gap-[1px] w-5 h-5">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`aspect-square ${Math.random() > 0.5 ? 'bg-gray-700' : 'bg-transparent'}`}
                    />
                  ))}
                </div>
              </div>
              <span>Escaneie para verificar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFComprovanteMockup;
