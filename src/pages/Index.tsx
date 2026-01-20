import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { getRedirectPathByRole } from '@/lib/roleRedirect';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogoIcon } from '@/components/LogoIcon';
import {
  FileCheck, 
  MessageSquare, 
  QrCode, 
  Users, 
  CheckCircle2,
  ArrowRight,
  ClipboardCheck,
  Send,
  Download,
  Check,
  Sparkles,
  HelpCircle,
  Smartphone,
  Menu,
  MapPin,
  Phone,
  Building2,
  Star,
  Wand2,
} from 'lucide-react';

interface Plano {
  id: string;
  nome: string;
  descricao: string | null;
  max_corretores: number;
  max_fichas_mes: number;
  max_clientes: number;
  max_imoveis: number;
  valor_mensal: number;
  tipo_cadastro: string | null;
}

const Index = () => {
  const { user, loading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loadingPlanos, setLoadingPlanos] = useState(true);

  useEffect(() => {
    const fetchPlanos = async () => {
      const { data } = await supabase
        .from('planos')
        .select('*')
        .eq('ativo', true)
        .order('valor_mensal', { ascending: true });
      
      if (data) {
        setPlanos(data);
      }
      setLoadingPlanos(false);
    };
    
    fetchPlanos();
  }, []);

  if (loading || (user && roleLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const features = [
    {
      icon: FileCheck,
      title: 'Registros Digitais',
      description: 'Crie registros de visita completos com todos os dados do imóvel, comprador e proprietário.'
    },
    {
      icon: MessageSquare,
      title: 'Confirmação via OTP',
      description: 'Envie códigos de confirmação via WhatsApp para ambas as partes com segurança.'
    },
    {
      icon: QrCode,
      title: 'QR Code de Verificação',
      description: 'Cada comprovante possui um QR Code único para verificação de autenticidade.'
    },
    {
      icon: Users,
      title: 'Trabalho em Parceria',
      description: 'Convide outros corretores para trabalhar juntos em um mesmo registro de visita.'
    },
    {
      icon: FileCheck,
      title: 'Protocolo Único',
      description: 'Cada visita recebe um protocolo exclusivo para rastreabilidade completa.'
    },
    {
      icon: Download,
      title: 'Comprovante PDF',
      description: 'Gere comprovantes profissionais em PDF após a confirmação de ambas as partes.'
    },
    {
      icon: Smartphone,
      title: 'App para Celular',
      description: 'Instale o app no seu celular e acesse seus registros rapidamente, de qualquer lugar.'
    },
    {
      icon: Star,
      title: 'Pesquisas Pós-Visita',
      description: 'Receba feedback automático dos compradores após cada visita confirmada, direto no WhatsApp.'
    },
    {
      icon: Wand2,
      title: 'Assistente Sofia',
      description: 'Nossa IA te ajuda a usar o sistema, responde dúvidas e sugere ações em tempo real.'
    }
  ];

  const steps = [
    {
      icon: ClipboardCheck,
      number: '01',
      title: 'Crie o Registro',
      description: 'Preencha os dados do imóvel, proprietário e comprador interessado.'
    },
    {
      icon: Send,
      number: '02',
      title: 'Envie o OTP',
      description: 'Dispare códigos de confirmação via WhatsApp para proprietário e comprador.'
    },
    {
      icon: CheckCircle2,
      number: '03',
      title: 'Aguarde Confirmação',
      description: 'Ambas as partes confirmam a visita inserindo o código recebido.'
    },
    {
      icon: Download,
      number: '04',
      title: 'Baixe o Comprovante',
      description: 'Com a confirmação completa, baixe o PDF com QR Code de verificação.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoIcon size={28} />
            <span className="font-heading text-xl font-bold">VisitaProva</span>
          </div>
          
          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/funcionalidades" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Funcionalidades
            </Link>
            <Link 
              to="/como-funciona" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Como Funciona
            </Link>
            <Link 
              to="/instalar" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Smartphone className="h-4 w-4" />
              Baixar App
            </Link>
            <a 
              href="#planos" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver Planos
            </a>
          </nav>
          
          <div className="flex items-center gap-3">
            {/* Desktop buttons */}
            {user ? (
              <Button asChild className="hidden sm:inline-flex">
                <Link to={getRedirectPathByRole(role)}>Meu Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link to="/auth">Entrar</Link>
                </Button>
                <Button variant="outline" asChild className="hidden sm:inline-flex">
                  <Link to="/registro-autonomo?plano=gratuito">Teste Grátis</Link>
                </Button>
                <Button asChild className="hidden sm:inline-flex">
                  <Link to="/registro">Cadastrar</Link>
                </Button>
              </>
            )}

            {/* Mobile menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <div className="flex flex-col gap-6 mt-6">
                  <div className="flex items-center gap-2 pb-4 border-b">
                    <LogoIcon size={24} />
                    <span className="font-heading text-lg font-bold">VisitaProva</span>
                  </div>
                  
                  <nav className="flex flex-col gap-4">
                    <Link 
                      to="/funcionalidades" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-base font-medium text-foreground hover:text-primary transition-colors"
                    >
                      Funcionalidades
                    </Link>
                    <Link 
                      to="/como-funciona" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-base font-medium text-foreground hover:text-primary transition-colors"
                    >
                      Como Funciona
                    </Link>
                    <Link 
                      to="/instalar" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-base font-medium text-foreground hover:text-primary transition-colors flex items-center gap-2"
                    >
                      <Smartphone className="h-4 w-4" />
                      Baixar App
                    </Link>
                    <a 
                      href="#planos" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-base font-medium text-foreground hover:text-primary transition-colors"
                    >
                      Ver Planos
                    </a>
                  </nav>
                  
                  <div className="flex flex-col gap-3 pt-4 border-t">
                    {user ? (
                      <Button asChild className="w-full">
                        <Link to={getRedirectPathByRole(role)} onClick={() => setMobileMenuOpen(false)}>
                          Meu Dashboard
                        </Link>
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" asChild className="w-full">
                          <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Entrar</Link>
                        </Button>
                        <Button variant="outline" asChild className="w-full">
                          <Link to="/registro-autonomo?plano=gratuito" onClick={() => setMobileMenuOpen(false)}>
                            Teste Grátis
                          </Link>
                        </Button>
                        <Button asChild className="w-full">
                          <Link to="/registro" onClick={() => setMobileMenuOpen(false)}>Cadastrar</Link>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <LogoIcon size={16} />
                Segurança e praticidade para corretores
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                <Smartphone className="h-4 w-4" />
                Disponível como App
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold tracking-tight mb-6">
              Fichas de Visita Digitais com{' '}
              <span className="text-primary">Confirmação Segura</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Elimine papéis e ganhe segurança jurídica. Confirme visitas via WhatsApp, 
              gere comprovantes PDF com QR Code e acesse tudo pelo app no seu celular.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
              <Button size="lg" className="text-base bg-emerald-500 hover:bg-emerald-600 text-white animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] shadow-lg shadow-emerald-500/30" asChild>
                <Link to="/registro-autonomo?plano=gratuito">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Teste Grátis
                </Link>
              </Button>
              <Button size="lg" className="text-base" asChild>
                <Link to="/registro">
                  Começar Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base" asChild>
                <Link to="/como-funciona">Como Funciona</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base" asChild>
                <Link to="/funcionalidades">Funcionalidades</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Funcionalidades pensadas para facilitar o dia a dia do corretor de imóveis.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-6 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="como-funciona" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Como Funciona
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Em 4 passos simples, você garante a segurança jurídica das suas visitas.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-heading font-bold text-primary/10 absolute -top-4 -left-2">
                  {step.number}
                </div>
                <div className="relative pt-8">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <step.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Planos e Preços
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Escolha o plano ideal para você ou sua imobiliária.
            </p>
          </div>

          {loadingPlanos ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-center">
              {planos.map((plano) => (
                <Card key={plano.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                  {plano.valor_mensal === 0 && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="success">Grátis</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{plano.nome}</CardTitle>
                    <CardDescription>{plano.descricao}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold">
                      {plano.valor_mensal === 0 ? (
                        'Grátis'
                      ) : plano.valor_mensal === -1 ? (
                        <span className="text-lg">Sob consulta</span>
                      ) : (
                        <>
                          R$ {plano.valor_mensal.toFixed(2).replace('.', ',')}
                          <span className="text-sm font-normal text-muted-foreground">/mês</span>
                        </>
                      )}
                    </div>
                    
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        {plano.max_fichas_mes === -1 ? 'Fichas ilimitadas' : `${plano.max_fichas_mes} fichas/mês`}
                      </li>
                      {plano.max_corretores > 1 && (
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          {plano.max_corretores === -1 ? 'Corretores ilimitados' : `${plano.max_corretores} corretor(es)`}
                        </li>
                      )}
                    </ul>

                    <Button className="w-full" asChild>
                      <Link to={plano.tipo_cadastro === 'cpf' ? `/registro-autonomo?plano=${plano.nome.toLowerCase().replace(/\s+/g, '-')}` : '/registro'}>
                        {plano.valor_mensal === 0 ? 'Começar Grátis' : 'Escolher Plano'}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <HelpCircle className="h-4 w-4" />
              Tire suas dúvidas
            </div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Encontre respostas para as dúvidas mais comuns sobre o VisitaProva.
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="item-1" className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  O que é o VisitaProva?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  O VisitaProva é uma plataforma digital para corretores de imóveis criarem registros de visita 
                  com confirmação via WhatsApp. Proprietários e compradores confirmam a visita através de um 
                  código OTP, gerando um comprovante PDF com QR Code para verificação de autenticidade.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2" className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  Como funciona a confirmação via OTP?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Após criar o registro de visita, você envia códigos de confirmação para o proprietário e o 
                  comprador via WhatsApp. Cada um recebe um código único que deve ser inserido na plataforma 
                  para confirmar a visita. Isso garante que ambas as partes concordaram com os termos.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3" className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  O plano gratuito tem alguma limitação?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  O plano gratuito é ideal para corretores autônomos que estão começando. Ele oferece 
                  recursos básicos para gerenciar suas visitas. Para recursos avançados, mais registros por mês 
                  ou gestão de equipe, você pode fazer upgrade para um plano pago a qualquer momento.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4" className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  Posso cancelar minha assinatura a qualquer momento?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Sim! Você pode cancelar sua assinatura a qualquer momento sem taxas ou multas. Após o 
                  cancelamento, você ainda terá acesso ao plano pago até o final do período já pago, 
                  e depois será automaticamente migrado para o plano gratuito.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5" className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  O comprovante PDF tem validade jurídica?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  O comprovante serve como prova de que a visita foi agendada e confirmada por ambas as partes, 
                  com registro de data, hora, CPF e aceite legal. O QR Code permite verificar a autenticidade 
                  do documento. Recomendamos consultar um advogado para casos específicos.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-6" className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  Como faço para adicionar corretores à minha imobiliária?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Se você tem um plano de imobiliária, pode convidar corretores pelo painel de administração. 
                  Basta enviar um convite por e-mail e o corretor poderá criar sua conta vinculada à sua 
                  imobiliária. Você terá acesso às fichas e relatórios de toda a equipe.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  O VisitaProva tem aplicativo para celular?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Sim! O VisitaProva pode ser instalado no seu celular como um app. Basta acessar pelo 
                  navegador e seguir as instruções para adicionar à tela inicial. Funciona em Android, 
                  iPhone e também no computador, com acesso rápido às suas fichas de visita.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* App Section */}
      <section className="py-16 bg-gradient-to-r from-emerald-500/10 via-primary/5 to-emerald-500/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-primary flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Smartphone className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">
              Leve o VisitaProva no seu bolso
            </h2>
            <p className="text-muted-foreground text-lg mb-6 max-w-xl mx-auto">
              Instale nosso app e tenha acesso instantâneo às suas fichas de visita. 
              Funciona em Android, iPhone e computador.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-emerald-500" />
                Acesso rápido
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-emerald-500" />
                Funciona offline
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-emerald-500" />
                Notificações
              </div>
            </div>
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white" asChild>
              <Link to="/instalar">
                <Smartphone className="h-5 w-5 mr-2" />
                Instalar App
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-foreground mb-4">
            Pronto para modernizar suas visitas?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de corretores que já utilizam o VisitaProva para 
            garantir segurança e profissionalismo em cada visita.
          </p>
          <Button size="lg" variant="secondary" className="text-base" asChild>
            <Link to="/registro-autonomo?plano=gratuito">
              Criar Conta Gratuita
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Logo e nome */}
            <div className="flex flex-col items-center md:items-start gap-2">
              <div className="flex items-center gap-2">
                <LogoIcon size={24} />
                <span className="font-heading font-bold">VisitaProva</span>
              </div>
              <p className="text-sm text-muted-foreground text-center md:text-left">
                Segurança e praticidade para corretores de imóveis
              </p>
            </div>
            
            {/* Contato */}
            <div className="flex flex-col items-center md:items-start gap-3">
              <h3 className="font-semibold text-sm">Contato</h3>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span className="text-center md:text-left">
                  Rua Horacio Cenci, 9 - Parque Campolim<br/>
                  Sorocaba - SP, 18047-800
                </span>
              </div>
              <a 
                href="tel:+5515981788214" 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Phone className="h-4 w-4 text-primary" />
                (15) 98178-8214
              </a>
              <a 
                href="https://wa.me/5515981788214" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-green-500 transition-colors"
              >
                <MessageSquare className="h-4 w-4 text-green-500" />
                WhatsApp
              </a>
            </div>
            
            {/* Links */}
            <div className="flex flex-col items-center md:items-start gap-3">
              <h3 className="font-semibold text-sm">Links</h3>
              <Link to="/termos-de-uso" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Termos de Uso
              </Link>
              <Link to="/politica-privacidade" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Política de Privacidade
              </Link>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="pt-8 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} VisitaProva. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Index;
