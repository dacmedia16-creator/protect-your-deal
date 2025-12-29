import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Shield,
  FileCheck,
  MessageSquare,
  QrCode,
  Download,
  Users,
  Smartphone,
  Check,
  ArrowRight,
  Volume2,
  VolumeX,
  Loader2
} from 'lucide-react';

// Demo steps with timing, content and narration text
const DEMO_STEPS = [
  {
    id: 'intro',
    title: 'Bem-vindo ao VisitaSegura',
    subtitle: 'Segurança jurídica em cada visita imobiliária',
    duration: 4000,
    icon: Shield,
    content: 'intro',
    narration: 'Bem-vindo ao VisitaSegura! A plataforma que revoluciona a segurança nas visitas imobiliárias.',
  },
  {
    id: 'criar-ficha',
    title: 'Criando uma Ficha de Visita',
    subtitle: 'Preencha os dados do imóvel e das partes envolvidas',
    duration: 4500,
    icon: FileCheck,
    content: 'form',
    narration: 'Criar uma ficha de visita é simples e rápido. Basta preencher os dados do imóvel e das partes envolvidas.',
  },
  {
    id: 'dados-imovel',
    title: 'Dados do Imóvel',
    subtitle: 'Informe endereço, tipo e data da visita',
    duration: 5000,
    icon: FileCheck,
    content: 'form-imovel',
    narration: 'Informe o endereço completo, o tipo de imóvel e a data da visita. Tudo é preenchido de forma intuitiva.',
  },
  {
    id: 'dados-partes',
    title: 'Proprietário e Comprador',
    subtitle: 'Cadastre os dados das partes envolvidas',
    duration: 5000,
    icon: Users,
    content: 'form-partes',
    narration: 'Cadastre os dados do proprietário e do comprador. Nome, telefone e CPF para garantir a identificação de todos.',
  },
  {
    id: 'enviar-otp',
    title: 'Enviando Confirmação via WhatsApp',
    subtitle: 'Código OTP enviado para ambas as partes',
    duration: 5500,
    icon: MessageSquare,
    content: 'whatsapp',
    narration: 'Enviamos um código de confirmação via WhatsApp para ambas as partes. Segurança e praticidade na palma da mão.',
  },
  {
    id: 'confirmar-otp',
    title: 'Confirmação Recebida',
    subtitle: 'Ambas as partes confirmaram via código OTP',
    duration: 4000,
    icon: Check,
    content: 'confirmado',
    narration: 'Pronto! Ambas as partes confirmaram sua participação. A visita agora está validada.',
  },
  {
    id: 'qrcode',
    title: 'QR Code de Verificação',
    subtitle: 'Documento verificável a qualquer momento',
    duration: 4500,
    icon: QrCode,
    content: 'qrcode',
    narration: 'Cada ficha possui um QR Code exclusivo para verificação de autenticidade. Proteção contra fraudes.',
  },
  {
    id: 'pdf',
    title: 'Comprovante em PDF',
    subtitle: 'Baixe o comprovante com validade jurídica',
    duration: 4500,
    icon: Download,
    content: 'pdf',
    narration: 'Gere comprovantes profissionais em PDF, prontos para download. Documentação com validade jurídica.',
  },
  {
    id: 'crm',
    title: 'Gestão de Clientes',
    subtitle: 'Todos os seus clientes organizados em um só lugar',
    duration: 4500,
    icon: Users,
    content: 'crm',
    narration: 'Organize todos os seus clientes em um só lugar. Proprietários, compradores, histórico completo de cada relacionamento.',
  },
  {
    id: 'pwa',
    title: 'App no seu Celular',
    subtitle: 'Instale como aplicativo e use offline',
    duration: 4500,
    icon: Smartphone,
    content: 'pwa',
    narration: 'Instale o VisitaSegura como aplicativo no seu celular. Funciona offline e envia notificações.',
  },
  {
    id: 'fim',
    title: 'Comece Agora Gratuitamente',
    subtitle: 'Proteja suas visitas imobiliárias',
    duration: 4000,
    icon: Shield,
    content: 'cta',
    narration: 'Comece agora gratuitamente e descubra como transformar sua rotina imobiliária. VisitaSegura, segurança em cada visita.',
  },
];

// Simulated form data for animations
const FORM_FIELDS = {
  imovel: [
    { label: 'Endereço', value: 'Rua das Palmeiras, 123 - Centro' },
    { label: 'Tipo', value: 'Apartamento' },
    { label: 'Data da Visita', value: '15/01/2025 às 14:00' },
  ],
  proprietario: [
    { label: 'Nome', value: 'Maria Silva Santos' },
    { label: 'Telefone', value: '(15) 99999-1234' },
    { label: 'CPF', value: '***.***.***-45' },
  ],
  comprador: [
    { label: 'Nome', value: 'João Pedro Oliveira' },
    { label: 'Telefone', value: '(15) 98888-5678' },
    { label: 'CPF', value: '***.***.***-67' },
  ],
};

export default function DemoAnimado() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [typingIndex, setTypingIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  
  // Audio states
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioCache, setAudioCache] = useState<Record<string, string>>({});
  const [audioReady, setAudioReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentStep = DEMO_STEPS[currentStepIndex];
  const totalDuration = DEMO_STEPS.reduce((acc, step) => acc + step.duration, 0);
  const elapsedDuration = DEMO_STEPS.slice(0, currentStepIndex).reduce((acc, step) => acc + step.duration, 0) + 
    (stepProgress / 100) * currentStep.duration;
  const overallProgress = (elapsedDuration / totalDuration) * 100;

  // Cursor blink effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Generate all audio on mount or when requested
  const generateAllAudio = useCallback(async () => {
    setIsGeneratingAudio(true);
    const cache: Record<string, string> = {};
    
    try {
      for (const step of DEMO_STEPS) {
        toast.info(`Gerando áudio: ${step.title}...`);
        
        const { data, error } = await supabase.functions.invoke('text-to-speech', {
          body: { text: step.narration, voice: 'nova' }
        });

        if (error) throw error;

        if (data?.audioContent) {
          cache[step.id] = `data:audio/mpeg;base64,${data.audioContent}`;
        }
      }
      
      setAudioCache(cache);
      setAudioReady(true);
      toast.success('Áudios gerados com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar áudios:', error);
      toast.error('Erro ao gerar áudios. O demo funcionará sem narração.');
      setAudioEnabled(false);
    } finally {
      setIsGeneratingAudio(false);
    }
  }, []);

  // Play audio for current step
  useEffect(() => {
    if (!isPlaying || !audioEnabled || !audioReady) return;
    
    const audioUrl = audioCache[currentStep.id];
    if (!audioUrl) return;

    // Stop previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Play new audio
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.play().catch(console.error);

    return () => {
      audio.pause();
    };
  }, [currentStepIndex, isPlaying, audioEnabled, audioReady, audioCache, currentStep.id]);

  // Pause/resume audio with demo
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.play().catch(console.error);
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Main animation loop
  useEffect(() => {
    if (!isPlaying) return;

    const stepDuration = currentStep.duration;
    const interval = 50; // Update every 50ms
    const increment = (interval / stepDuration) * 100;

    const timer = setInterval(() => {
      setStepProgress(prev => {
        if (prev >= 100) {
          // Move to next step
          if (currentStepIndex < DEMO_STEPS.length - 1) {
            setCurrentStepIndex(i => i + 1);
            setTypingIndex(0);
            return 0;
          } else {
            // Demo finished
            setIsPlaying(false);
            return 100;
          }
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, currentStepIndex, currentStep.duration]);

  // Typing animation for form fields
  useEffect(() => {
    if (!isPlaying) return;
    if (!['form-imovel', 'form-partes'].includes(currentStep.content)) return;

    const timer = setInterval(() => {
      setTypingIndex(prev => prev + 1);
    }, 80);

    return () => clearInterval(timer);
  }, [isPlaying, currentStep.content]);

  const togglePlay = useCallback(() => {
    if (!audioReady && audioEnabled && !isGeneratingAudio) {
      // First time playing - generate audio first
      generateAllAudio().then(() => {
        setIsPlaying(true);
      });
    } else {
      setIsPlaying(prev => !prev);
    }
  }, [audioReady, audioEnabled, isGeneratingAudio, generateAllAudio]);

  const restart = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setCurrentStepIndex(0);
    setStepProgress(0);
    setTypingIndex(0);
    setIsPlaying(true);
  }, []);

  const toggleAudio = useCallback(() => {
    if (audioRef.current && audioEnabled) {
      audioRef.current.pause();
    }
    setAudioEnabled(prev => !prev);
  }, [audioEnabled]);

  const renderContent = () => {
    switch (currentStep.content) {
      case 'intro':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
            <Shield className="h-24 w-24 text-primary mb-6 animate-pulse" />
            <h2 className="text-3xl font-bold mb-4">VisitaSegura</h2>
            <p className="text-xl text-muted-foreground">
              A plataforma que protege suas visitas imobiliárias
            </p>
          </div>
        );

      case 'form':
        return (
          <div className="p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <FileCheck className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold">Nova Ficha de Visita</h3>
            </div>
            <div className="space-y-4">
              <div className="h-10 bg-muted rounded-md animate-pulse" />
              <div className="h-10 bg-muted rounded-md animate-pulse delay-100" />
              <div className="h-10 bg-muted rounded-md animate-pulse delay-200" />
            </div>
          </div>
        );

      case 'form-imovel':
        return (
          <div className="p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <FileCheck className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold">Dados do Imóvel</h3>
            </div>
            <div className="space-y-4">
              {FORM_FIELDS.imovel.map((field, index) => {
                const charCount = Math.min(typingIndex - (index * 15), field.value.length);
                const displayValue = field.value.slice(0, Math.max(0, charCount));
                return (
                  <div key={field.label} className="space-y-1">
                    <label className="text-sm text-muted-foreground">{field.label}</label>
                    <div className="h-10 bg-background border rounded-md px-3 flex items-center">
                      <span>{displayValue}</span>
                      {charCount >= 0 && charCount < field.value.length && showCursor && (
                        <span className="w-0.5 h-5 bg-primary ml-0.5" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'form-partes':
        return (
          <div className="p-6 animate-fade-in">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-primary" />
                  <h4 className="font-medium">Proprietário</h4>
                </div>
                <div className="space-y-3">
                  {FORM_FIELDS.proprietario.map((field, index) => {
                    const charCount = Math.min(typingIndex - (index * 12), field.value.length);
                    const displayValue = field.value.slice(0, Math.max(0, charCount));
                    return (
                      <div key={field.label} className="space-y-1">
                        <label className="text-xs text-muted-foreground">{field.label}</label>
                        <div className="h-8 bg-background border rounded-md px-2 flex items-center text-sm">
                          <span>{displayValue}</span>
                          {charCount >= 0 && charCount < field.value.length && showCursor && (
                            <span className="w-0.5 h-4 bg-primary ml-0.5" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-orange-500" />
                  <h4 className="font-medium">Comprador</h4>
                </div>
                <div className="space-y-3">
                  {FORM_FIELDS.comprador.map((field, index) => {
                    const delay = 36; // Start after proprietario
                    const charCount = Math.min(typingIndex - delay - (index * 12), field.value.length);
                    const displayValue = field.value.slice(0, Math.max(0, charCount));
                    return (
                      <div key={field.label} className="space-y-1">
                        <label className="text-xs text-muted-foreground">{field.label}</label>
                        <div className="h-8 bg-background border rounded-md px-2 flex items-center text-sm">
                          <span>{displayValue}</span>
                          {charCount >= 0 && charCount < field.value.length && showCursor && (
                            <span className="w-0.5 h-4 bg-primary ml-0.5" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      case 'whatsapp':
        return (
          <div className="p-6 animate-fade-in">
            <div className="max-w-sm mx-auto">
              <div className="bg-[#075E54] text-white p-3 rounded-t-xl flex items-center gap-3">
                <MessageSquare className="h-5 w-5" />
                <span className="font-medium">WhatsApp</span>
              </div>
              <div className="bg-[#E5DDD5] dark:bg-[#0B141A] p-4 rounded-b-xl space-y-3 min-h-[200px]">
                <div className={`bg-white dark:bg-[#1F2C34] p-3 rounded-lg shadow-sm max-w-[80%] transition-all duration-500 ${stepProgress > 20 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <p className="text-sm text-foreground">
                    🔐 <strong>VisitaSegura</strong>
                  </p>
                  <p className="text-sm text-foreground mt-1">
                    Seu código de confirmação: <strong>847291</strong>
                  </p>
                </div>
                <div className={`bg-[#DCF8C6] dark:bg-[#005C4B] p-3 rounded-lg shadow-sm max-w-[60%] ml-auto transition-all duration-500 ${stepProgress > 50 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <p className="text-sm text-foreground">847291 ✓</p>
                </div>
                <div className={`flex items-center justify-center transition-all duration-500 ${stepProgress > 80 ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="bg-white dark:bg-[#1F2C34] px-4 py-2 rounded-full shadow-sm flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-muted-foreground">Código verificado</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'confirmado':
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
              <div className="relative bg-green-500 text-white p-6 rounded-full">
                <Check className="h-12 w-12" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mt-6">Visita Confirmada!</h3>
            <div className="flex items-center gap-8 mt-6">
              <div className="text-center">
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full inline-block mb-2">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground">Proprietário</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full inline-block mb-2">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground">Comprador</p>
              </div>
            </div>
          </div>
        );

      case 'qrcode':
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 animate-fade-in">
            <div className="bg-white p-4 rounded-xl shadow-lg">
              <div className="w-40 h-40 grid grid-cols-8 gap-0.5">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`}
                    style={{ animationDelay: `${i * 10}ms` }}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">VS25A3B4C5</p>
            <div className={`flex items-center gap-2 mt-4 transition-all duration-500 ${stepProgress > 60 ? 'opacity-100' : 'opacity-0'}`}>
              <QrCode className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Verificação instantânea</span>
            </div>
          </div>
        );

      case 'pdf':
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 animate-fade-in">
            <div className="bg-white dark:bg-muted border rounded-lg shadow-lg p-6 w-64 transform transition-transform hover:scale-105">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-semibold text-sm">VisitaSegura</span>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p><strong>Protocolo:</strong> VS25A3B4C5</p>
                <p><strong>Data:</strong> 15/01/2025</p>
                <p><strong>Status:</strong> <span className="text-green-600">Confirmada</span></p>
              </div>
              <div className={`mt-4 pt-4 border-t flex justify-center transition-all duration-500 ${stepProgress > 50 ? 'opacity-100' : 'opacity-0'}`}>
                <Button size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Baixar PDF
                </Button>
              </div>
            </div>
          </div>
        );

      case 'crm':
        return (
          <div className="p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Meus Clientes
              </h3>
              <span className="text-sm text-muted-foreground">23 clientes</span>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Maria Silva', tipo: 'Proprietário', tags: ['VIP', 'Ativo'] },
                { name: 'João Pedro', tipo: 'Comprador', tags: ['Novo'] },
                { name: 'Ana Costa', tipo: 'Proprietário', tags: ['Ativo'] },
              ].map((cliente, index) => (
                <div 
                  key={cliente.name}
                  className={`p-3 bg-muted/50 rounded-lg flex items-center justify-between transition-all duration-500`}
                  style={{ 
                    opacity: stepProgress > (index * 25) ? 1 : 0,
                    transform: stepProgress > (index * 25) ? 'translateX(0)' : 'translateX(-20px)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {cliente.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{cliente.name}</p>
                      <p className="text-xs text-muted-foreground">{cliente.tipo}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {cliente.tags.map(tag => (
                      <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'pwa':
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 animate-fade-in">
            <div className="relative">
              <Smartphone className="h-24 w-24 text-muted-foreground" />
              <div className={`absolute -top-2 -right-2 bg-primary text-primary-foreground p-2 rounded-full transition-all duration-500 ${stepProgress > 30 ? 'scale-100' : 'scale-0'}`}>
                <Shield className="h-4 w-4" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mt-6">Instale no seu celular</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {[
                'Funciona offline',
                'Receba notificações',
                'Acesso rápido',
              ].map((item, index) => (
                <li 
                  key={item}
                  className={`flex items-center gap-2 transition-all duration-300`}
                  style={{ 
                    opacity: stepProgress > (30 + index * 20) ? 1 : 0,
                    transform: stepProgress > (30 + index * 20) ? 'translateX(0)' : 'translateX(-10px)'
                  }}
                >
                  <Check className="h-4 w-4 text-green-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        );

      case 'cta':
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 animate-fade-in text-center">
            <Shield className="h-16 w-16 text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">Comece Agora</h2>
            <p className="text-muted-foreground mb-6">
              Proteja suas visitas imobiliárias gratuitamente
            </p>
            <Button size="lg" className="gap-2 animate-pulse" asChild>
              <Link to="/registro">
                Criar Conta Grátis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary flex items-center gap-2">
            <Shield className="h-6 w-6" />
            VisitaSegura
          </Link>
          <Link to="/">
            <Button variant="outline" size="sm">
              Voltar ao início
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Demo Animado com Narração
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Veja como o VisitaSegura funciona na prática com narração em áudio sincronizada.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span className="flex items-center gap-2">
              {audioEnabled && audioReady && <Volume2 className="h-4 w-4 text-primary" />}
              {currentStep.title}
            </span>
            <span>{currentStepIndex + 1}/{DEMO_STEPS.length}</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Demo Screen */}
        <Card className="overflow-hidden mb-6">
          <div className="bg-muted/50 px-4 py-3 border-b flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-xs text-muted-foreground">app.visitasegura.com.br</span>
            </div>
          </div>
          <CardContent className="p-0 min-h-[400px] relative overflow-hidden">
            {/* Step Info Overlay */}
            <div className="absolute top-4 left-4 right-4 z-10">
              <div className="bg-background/90 backdrop-blur border rounded-lg p-3 flex items-center gap-3 shadow-lg">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <currentStep.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{currentStep.title}</h3>
                  <p className="text-xs text-muted-foreground">{currentStep.subtitle}</p>
                </div>
                <div className="w-12">
                  <Progress value={stepProgress} className="h-1" />
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="pt-20 min-h-[400px]">
              {renderContent()}
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={restart}
            disabled={isGeneratingAudio}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={toggleAudio}
          >
            {audioEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            size="lg"
            className="h-14 w-14 rounded-full"
            onClick={togglePlay}
            disabled={isGeneratingAudio}
          >
            {isGeneratingAudio ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </Button>
        </div>

        {/* Audio status */}
        {isGeneratingAudio && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando narrações... Aguarde.
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Dica:</strong> Use um gravador de tela como{' '}
            <a href="https://www.loom.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Loom
            </a>
            {' '}ou{' '}
            <a href="https://obsproject.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              OBS
            </a>
            {' '}para capturar esta demonstração com áudio.
          </p>
        </div>

        {/* Step Navigation */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {DEMO_STEPS.map((step, index) => (
            <button
              key={step.id}
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.pause();
                }
                setCurrentStepIndex(index);
                setStepProgress(0);
                setTypingIndex(0);
              }}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentStepIndex 
                  ? 'bg-primary w-8' 
                  : index < currentStepIndex
                    ? 'bg-primary/50'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Ir para ${step.title}`}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
