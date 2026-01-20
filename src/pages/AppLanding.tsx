import { useNavigate } from "react-router-dom";
import { Rocket, Smartphone, MessageCircle, ExternalLink } from "lucide-react";
import { LogoIcon } from '@/components/LogoIcon';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const AppLanding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isIOS, isAndroid } = usePWAInstall();

  const handleOpenApp = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/inicial");
    }
  };

  const handleWhatsApp = () => {
    window.open("https://wa.me/5511999999999?text=Olá! Gostaria de saber mais sobre o VisitaProva.", "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo e Título */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-2">
              <LogoIcon size={40} />
            </div>
            <h1 className="text-3xl font-bold text-foreground">VisitaProva</h1>
            <p className="text-muted-foreground text-lg">
              Prova de Intermediação Imobiliária com Confirmação Segura via WhatsApp
            </p>
          </div>

          {/* Botão Principal */}
          <Button 
            onClick={handleOpenApp}
            size="lg"
            className="w-full h-14 text-lg font-semibold gap-3 shadow-lg hover:shadow-xl transition-all"
          >
            <Rocket className="h-5 w-5" />
            ABRIR O APP
          </Button>

          {/* Instruções de Instalação */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-center justify-center">
              <Smartphone className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">Instale no seu celular</span>
            </div>

            <div className="space-y-3">
              {/* Android */}
              <div className={`p-4 rounded-xl bg-muted/50 border ${isAndroid ? 'border-primary/30 bg-primary/5' : 'border-transparent'}`}>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#3DDC84]/10 shrink-0">
                    <span className="text-lg">🤖</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Android</p>
                    <ol className="text-sm text-muted-foreground space-y-0.5">
                      <li>1. Toque em <span className="font-mono bg-muted px-1 rounded">⋮</span> (3 pontinhos)</li>
                      <li>2. <span className="font-medium">Adicionar à tela inicial</span></li>
                      <li>3. Toque em <span className="font-medium">"Instalar"</span></li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* iPhone */}
              <div className={`p-4 rounded-xl bg-muted/50 border ${isIOS ? 'border-primary/30 bg-primary/5' : 'border-transparent'}`}>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 shrink-0">
                    <span className="text-lg">🍎</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">iPhone</p>
                    <p className="text-sm text-muted-foreground">
                      Toque em <span className="font-mono bg-muted px-1 rounded">⎋</span> → <span className="font-medium">Adicionar à Tela de Início</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-muted-foreground"
              onClick={() => navigate("/instalar")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver instruções detalhadas
            </Button>
          </div>

          {/* Botão WhatsApp */}
          <Button 
            onClick={handleWhatsApp}
            variant="outline"
            size="lg"
            className="w-full h-12 gap-3 border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10"
          >
            <MessageCircle className="h-5 w-5" />
            Falar no WhatsApp
          </Button>
        </div>
      </div>

      {/* Footer mínimo */}
      <footer className="py-6 px-6 text-center">
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <button onClick={() => navigate("/funcionalidades")} className="hover:text-foreground transition-colors">
            Funcionalidades
          </button>
          <span>•</span>
          <button onClick={() => navigate("/como-funciona")} className="hover:text-foreground transition-colors">
            Como Funciona
          </button>
          <span>•</span>
          <button onClick={() => navigate("/termos")} className="hover:text-foreground transition-colors">
            Termos
          </button>
        </div>
      </footer>
    </div>
  );
};

export default AppLanding;
