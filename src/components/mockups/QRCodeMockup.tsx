import { QrCode, Shield, CheckCircle2, ExternalLink } from 'lucide-react';

const QRCodeMockup = () => {
  return (
    <div className="bg-background rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-primary/10 px-4 py-3 border-b border-border flex items-center gap-2">
        <QrCode className="h-5 w-5 text-primary" />
        <span className="font-medium text-sm">Verificação de Autenticidade</span>
      </div>
      
      <div className="p-4 space-y-4">
        {/* QR Code */}
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-border">
            <div className="grid grid-cols-8 gap-0.5 w-32 h-32">
              {/* Simulated QR Code Pattern */}
              {Array.from({ length: 64 }).map((_, i) => {
                const isCorner = 
                  (i < 8 && (i % 8 < 3)) || 
                  (i < 24 && (i % 8 < 3 && Math.floor(i / 8) < 3)) ||
                  (i % 8 >= 5 && Math.floor(i / 8) < 3) ||
                  (i % 8 < 3 && Math.floor(i / 8) >= 5);
                const isRandom = Math.random() > 0.5;
                return (
                  <div 
                    key={i} 
                    className={`aspect-square rounded-[1px] ${
                      isCorner || isRandom ? 'bg-gray-900' : 'bg-transparent'
                    }`}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex items-center justify-center gap-1">
              <Shield className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-medium text-muted-foreground">VisitaSegura</span>
            </div>
          </div>
        </div>

        {/* Verification Info */}
        <div className="text-center space-y-1">
          <p className="text-sm font-medium">Protocolo: VS-2024-001234</p>
          <p className="text-xs text-muted-foreground">Escaneie para verificar autenticidade</p>
        </div>

        {/* Verification Link */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="truncate">visitaseguras.com.br/verificar/VS-2024-001234</span>
          </div>
        </div>

        {/* Verified Badge */}
        <div className="flex items-center justify-center gap-2 py-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Documento Autêntico
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeMockup;
