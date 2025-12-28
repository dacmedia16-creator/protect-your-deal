import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { 
  Smartphone, 
  Download, 
  Share2, 
  PlusSquare, 
  CheckCircle2, 
  Monitor,
  ArrowLeft,
  Shield
} from "lucide-react";
import { Link } from "react-router-dom";

export default function InstalarApp() {
  const { isInstallable, isInstalled, isIOS, isAndroid, isDesktop, install } = usePWAInstall();

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      // Installation successful
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">App Instalado!</CardTitle>
            <CardDescription>
              O VisitaSegura já está instalado no seu dispositivo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Você pode acessar o app diretamente da sua tela inicial.
            </p>
            <Link to="/dashboard">
              <Button className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Voltar</span>
          </Link>
        </div>
      </header>

      <main className="container max-w-2xl py-8 px-4">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Instalar VisitaSegura</h1>
          <p className="text-muted-foreground">
            Tenha acesso rápido ao app direto da sua tela inicial
          </p>
        </div>

        {/* Benefits */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Vantagens do App</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Acesso rápido sem abrir o navegador</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Funciona offline para páginas já visitadas</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Experiência de app nativo (tela cheia)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Atualizações automáticas</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Installation Instructions */}
        {isInstallable && (
          <Card className="mb-6 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Instalação Automática
              </CardTitle>
              <CardDescription>
                Clique no botão abaixo para instalar o app
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleInstall} size="lg" className="w-full">
                <Download className="mr-2 h-5 w-5" />
                Instalar VisitaSegura
              </Button>
            </CardContent>
          </Card>
        )}

        {isIOS && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Instalar no iPhone/iPad
              </CardTitle>
              <CardDescription>
                Siga os passos abaixo no Safari
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                <li className="flex items-start gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
                    1
                  </span>
                  <div>
                    <p className="font-medium">Toque no ícone de Compartilhar</p>
                    <p className="text-sm text-muted-foreground">
                      Na barra inferior do Safari, toque no ícone <Share2 className="inline h-4 w-4" />
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
                    2
                  </span>
                  <div>
                    <p className="font-medium">Adicionar à Tela de Início</p>
                    <p className="text-sm text-muted-foreground">
                      Role para baixo e toque em "Adicionar à Tela de Início" <PlusSquare className="inline h-4 w-4" />
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
                    3
                  </span>
                  <div>
                    <p className="font-medium">Confirme a instalação</p>
                    <p className="text-sm text-muted-foreground">
                      Toque em "Adicionar" no canto superior direito
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>
        )}

        {isAndroid && !isInstallable && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Instalar no Android
              </CardTitle>
              <CardDescription>
                Siga os passos abaixo no Chrome
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                <li className="flex items-start gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
                    1
                  </span>
                  <div>
                    <p className="font-medium">Abra o menu do Chrome</p>
                    <p className="text-sm text-muted-foreground">
                      Toque nos três pontos no canto superior direito
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
                    2
                  </span>
                  <div>
                    <p className="font-medium">Adicionar à tela inicial</p>
                    <p className="text-sm text-muted-foreground">
                      Toque em "Adicionar à tela inicial" ou "Instalar app"
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
                    3
                  </span>
                  <div>
                    <p className="font-medium">Confirme a instalação</p>
                    <p className="text-sm text-muted-foreground">
                      Toque em "Instalar" na janela de confirmação
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>
        )}

        {isDesktop && !isInstallable && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Instalar no Computador
              </CardTitle>
              <CardDescription>
                Siga os passos abaixo no Chrome ou Edge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                <li className="flex items-start gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
                    1
                  </span>
                  <div>
                    <p className="font-medium">Procure o ícone de instalação</p>
                    <p className="text-sm text-muted-foreground">
                      Na barra de endereços, clique no ícone <Download className="inline h-4 w-4" /> ou <PlusSquare className="inline h-4 w-4" />
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
                    2
                  </span>
                  <div>
                    <p className="font-medium">Clique em Instalar</p>
                    <p className="text-sm text-muted-foreground">
                      Confirme a instalação na janela que aparecer
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Back to dashboard */}
        <div className="text-center">
          <Link to="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
