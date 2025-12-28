import { MessageSquare, CheckCircle2, Shield } from 'lucide-react';

const WhatsAppOTPMockup = () => {
  return (
    <div className="bg-background rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-emerald-500/10 px-4 py-3 border-b border-border flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        <span className="font-medium text-sm">Confirmação via WhatsApp</span>
      </div>
      
      <div className="p-4 space-y-4">
        {/* WhatsApp Message Preview */}
        <div className="bg-[#DCF8C6] dark:bg-emerald-900/30 rounded-lg p-3 space-y-2 max-w-[85%]">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">VisitaSegura</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Verificado ✓</p>
            </div>
          </div>
          <div className="text-xs text-emerald-900 dark:text-emerald-100 space-y-1">
            <p>Olá João! 👋</p>
            <p>Seu código de confirmação para a visita ao imóvel é:</p>
            <p className="text-2xl font-bold tracking-widest text-center py-2">847 293</p>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-300">Válido por 15 minutos</p>
          </div>
        </div>

        {/* OTP Input */}
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground text-center">
            Digite o código recebido no WhatsApp
          </p>
          <div className="flex justify-center gap-2">
            {['8', '4', '7', '2', '9', '3'].map((digit, i) => (
              <div 
                key={i} 
                className="h-12 w-10 bg-muted/50 rounded-md border-2 border-primary flex items-center justify-center text-lg font-bold"
              >
                {digit}
              </div>
            ))}
          </div>
        </div>

        {/* Success State */}
        <div className="bg-emerald-500/10 rounded-lg p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Código verificado!</p>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">Confirmação registrada com sucesso</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppOTPMockup;
