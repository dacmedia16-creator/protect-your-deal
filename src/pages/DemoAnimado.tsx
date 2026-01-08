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
  Loader2,
  BarChart3,
  Bell,
  Handshake,
  MessageCircle,
  CreditCard,
  Home,
  Clock,
  TrendingUp
} from 'lucide-react';

// Demo steps with timing, content and narration text
const DEMO_STEPS = [
  {
    id: 'intro',
    title: 'Bem-vindo ao VisitaSegura',
    subtitle: 'Segurança jurídica em cada visita imobiliária',
    duration: 6000,
    icon: Shield,
    content: 'intro',
    narration: 'Bem-vindo ao VisitaSegura! A plataforma que revoluciona a segurança nas visitas imobiliárias. Acompanhe este demo e descubra como proteger suas transações.',
  },
  {
    id: 'dashboard',
    title: 'Dashboard Inicial',
    subtitle: 'Visão geral das suas atividades',
    duration: 6000,
    icon: Home,
    content: 'dashboard',
    narration: 'No painel inicial você tem uma visão completa das suas atividades. Registros do mês, confirmações pendentes e muito mais em um só lugar.',
  },
  {
    id: 'criar-ficha',
    title: 'Criando um Registro de Visita',
    subtitle: 'Preencha os dados do imóvel e das partes envolvidas',
    duration: 5500,
    icon: FileCheck,
    content: 'form',
    narration: 'Criar um registro de visita é simples e rápido. Basta preencher os dados do imóvel e das partes envolvidas.',
  },
  {
    id: 'dados-imovel',
    title: 'Dados do Imóvel',
    subtitle: 'Informe endereço, tipo e data da visita',
    duration: 6000,
    icon: FileCheck,
    content: 'form-imovel',
    narration: 'Informe o endereço completo, o tipo de imóvel e a data da visita. Tudo é preenchido de forma intuitiva e organizada.',
  },
  {
    id: 'dados-partes',
    title: 'Proprietário e Comprador',
    subtitle: 'Cadastre os dados das partes envolvidas',
    duration: 6000,
    icon: Users,
    content: 'form-partes',
    narration: 'Cadastre os dados do proprietário e do comprador. Nome, telefone e CPF para garantir a identificação segura de todos.',
  },
  {
    id: 'lista-imoveis',
    title: 'Lista de Imóveis',
    subtitle: 'Catálogo de propriedades cadastradas',
    duration: 5500,
    icon: Home,
    content: 'lista-imoveis',
    narration: 'Mantenha todos os seus imóveis organizados em um catálogo. Endereço, tipo e proprietário vinculado para cada propriedade.',
  },
  {
    id: 'enviar-otp',
    title: 'Enviando Confirmação via WhatsApp',
    subtitle: 'Código OTP enviado para ambas as partes',
    duration: 6000,
    icon: MessageSquare,
    content: 'whatsapp',
    narration: 'Enviamos um código de confirmação via WhatsApp para ambas as partes. Segurança e praticidade na palma da mão.',
  },
  {
    id: 'confirmar-otp',
    title: 'Confirmação Recebida',
    subtitle: 'Ambas as partes confirmaram via código OTP',
    duration: 5000,
    icon: Check,
    content: 'confirmado',
    narration: 'Pronto! Ambas as partes confirmaram sua participação. A visita agora está validada juridicamente.',
  },
  {
    id: 'historico',
    title: 'Histórico de Visitas',
    subtitle: 'Timeline completa de todas as visitas',
    duration: 5500,
    icon: Clock,
    content: 'historico',
    narration: 'Acompanhe o histórico completo de todas as visitas realizadas. Status, datas e detalhes de cada registro.',
  },
  {
    id: 'qrcode',
    title: 'QR Code de Verificação',
    subtitle: 'Documento verificável a qualquer momento',
    duration: 5000,
    icon: QrCode,
    content: 'qrcode',
    narration: 'Cada registro possui um QR Code exclusivo para verificação de autenticidade. Proteção contra fraudes.',
  },
  {
    id: 'relatorios',
    title: 'Relatórios e Métricas',
    subtitle: 'Análise de desempenho e estatísticas',
    duration: 6000,
    icon: BarChart3,
    content: 'relatorios',
    narration: 'Acompanhe relatórios detalhados com taxa de confirmação, visitas por período e métricas de desempenho da sua equipe.',
  },
  {
    id: 'notificacoes',
    title: 'Notificações em Tempo Real',
    subtitle: 'Alertas e lembretes automáticos',
    duration: 5500,
    icon: Bell,
    content: 'notificacoes',
    narration: 'Receba notificações em tempo real sobre novas confirmações, lembretes de visitas e alertas importantes.',
  },
  {
    id: 'pdf',
    title: 'Comprovante em PDF',
    subtitle: 'Baixe o comprovante com validade jurídica',
    duration: 5000,
    icon: Download,
    content: 'pdf',
    narration: 'Gere comprovantes profissionais em PDF, prontos para download. Documentação com validade jurídica.',
  },
  {
    id: 'crm',
    title: 'Gestão de Clientes',
    subtitle: 'Todos os seus clientes organizados em um só lugar',
    duration: 5500,
    icon: Users,
    content: 'crm',
    narration: 'Organize todos os seus clientes em um só lugar. Proprietários, compradores, histórico completo de cada relacionamento.',
  },
  {
    id: 'parceiros',
    title: 'Gestão de Parceiros',
    subtitle: 'Compartilhe registros entre imobiliárias',
    duration: 5500,
    icon: Handshake,
    content: 'parceiros',
    narration: 'Trabalhe em parceria com outras imobiliárias. Envie convites e compartilhe registros de forma segura.',
  },
  {
    id: 'templates',
    title: 'Templates de Mensagem',
    subtitle: 'Personalize suas comunicações',
    duration: 5500,
    icon: MessageCircle,
    content: 'templates',
    narration: 'Personalize as mensagens enviadas aos seus clientes. Templates prontos para cada situação.',
  },
  {
    id: 'pwa',
    title: 'App no seu Celular',
    subtitle: 'Instale como aplicativo e use offline',
    duration: 5000,
    icon: Smartphone,
    content: 'pwa',
    narration: 'Instale o VisitaSegura como aplicativo no seu celular. Funciona offline e envia notificações.',
  },
  {
    id: 'planos',
    title: 'Planos e Assinatura',
    subtitle: 'Escolha o plano ideal para você',
    duration: 5500,
    icon: CreditCard,
    content: 'planos',
    narration: 'Escolha entre o plano gratuito ou premium. Funcionalidades para corretores autônomos e imobiliárias de todos os tamanhos.',
  },
  {
    id: 'fim',
    title: 'Comece Agora Gratuitamente',
    subtitle: 'Proteja suas visitas imobiliárias',
    duration: 6000,
    icon: Shield,
    content: 'cta',
    narration: 'Comece agora gratuitamente e descubra como transformar sua rotina imobiliária. VisitaSegura, segurança em cada visita!',
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
    
    // ElevenLabs voice ID - Sarah (feminina, clara, profissional)
    const voiceId = 'EXAVITQu4vr4xnSDxMaL';
    
    try {
      for (const step of DEMO_STEPS) {
        toast.info(`Gerando áudio: ${step.title}...`);
        
        const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
          body: { text: step.narration, voiceId }
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

  // Limpar cache e regenerar áudios
  const clearCacheAndRegenerate = useCallback(async () => {
    // Parar qualquer áudio em execução
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Limpar cache
    setAudioCache({});
    setAudioReady(false);
    setIsPlaying(false);
    setCurrentStepIndex(0);
    setStepProgress(0);
    
    // Gerar novos áudios
    toast.info('Limpando cache e gerando novos áudios...');
    await generateAllAudio();
  }, [generateAllAudio]);


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

      case 'dashboard':
        return (
          <div className="p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                Dashboard
              </h3>
              <span className="text-sm text-muted-foreground">Janeiro 2025</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Registros do Mês', value: '24', icon: FileCheck, color: 'text-primary' },
                { label: 'Pendentes', value: '5', icon: Clock, color: 'text-orange-500' },
                { label: 'Confirmadas', value: '19', icon: Check, color: 'text-green-500' },
              ].map((stat, index) => (
                <div 
                  key={stat.label}
                  className="bg-muted/50 p-4 rounded-lg text-center transition-all duration-500"
                  style={{ 
                    opacity: stepProgress > (index * 20) ? 1 : 0,
                    transform: stepProgress > (index * 20) ? 'translateY(0)' : 'translateY(10px)'
                  }}
                >
                  <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className={`bg-primary/5 border border-primary/20 rounded-lg p-4 transition-all duration-500 ${stepProgress > 70 ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span><strong>+15%</strong> de confirmações este mês</span>
              </div>
            </div>
          </div>
        );

      case 'form':
        return (
          <div className="p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <FileCheck className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold">Novo Registro de Visita</h3>
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

      case 'lista-imoveis':
        return (
          <div className="p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                Meus Imóveis
              </h3>
              <span className="text-sm text-muted-foreground">8 imóveis</span>
            </div>
            <div className="space-y-3">
              {[
                { endereco: 'Rua das Palmeiras, 123', tipo: 'Apartamento', bairro: 'Centro' },
                { endereco: 'Av. Brasil, 456', tipo: 'Casa', bairro: 'Jardim Europa' },
                { endereco: 'Rua São Paulo, 789', tipo: 'Sala Comercial', bairro: 'Centro' },
              ].map((imovel, index) => (
                <div 
                  key={imovel.endereco}
                  className="p-3 bg-muted/50 rounded-lg flex items-center gap-3 transition-all duration-500"
                  style={{ 
                    opacity: stepProgress > (index * 25) ? 1 : 0,
                    transform: stepProgress > (index * 25) ? 'translateX(0)' : 'translateX(-20px)'
                  }}
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Home className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{imovel.endereco}</p>
                    <p className="text-xs text-muted-foreground">{imovel.tipo} • {imovel.bairro}</p>
                  </div>
                </div>
              ))}
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

      case 'historico':
        return (
          <div className="p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Histórico de Visitas
              </h3>
            </div>
            <div className="space-y-3">
              {[
                { data: '15/01/2025', endereco: 'Rua das Palmeiras, 123', status: 'Confirmada', statusColor: 'text-green-600 bg-green-100' },
                { data: '12/01/2025', endereco: 'Av. Brasil, 456', status: 'Confirmada', statusColor: 'text-green-600 bg-green-100' },
                { data: '10/01/2025', endereco: 'Rua São Paulo, 789', status: 'Pendente', statusColor: 'text-orange-600 bg-orange-100' },
              ].map((visita, index) => (
                <div 
                  key={`${visita.data}-${visita.endereco}`}
                  className="p-3 bg-muted/50 rounded-lg flex items-center justify-between transition-all duration-500"
                  style={{ 
                    opacity: stepProgress > (index * 25) ? 1 : 0,
                    transform: stepProgress > (index * 25) ? 'translateX(0)' : 'translateX(-20px)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">{visita.data}</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{visita.endereco}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${visita.statusColor}`}>
                    {visita.status}
                  </span>
                </div>
              ))}
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

      case 'relatorios':
        return (
          <div className="p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Relatórios
              </h3>
              <span className="text-sm text-muted-foreground">Janeiro 2025</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div 
                className="bg-muted/50 p-4 rounded-lg transition-all duration-500"
                style={{ opacity: stepProgress > 20 ? 1 : 0 }}
              >
                <p className="text-sm text-muted-foreground">Taxa de Confirmação</p>
                <p className="text-2xl font-bold text-green-600">92%</p>
              </div>
              <div 
                className="bg-muted/50 p-4 rounded-lg transition-all duration-500"
                style={{ opacity: stepProgress > 40 ? 1 : 0 }}
              >
                <p className="text-sm text-muted-foreground">Total de Visitas</p>
                <p className="text-2xl font-bold">156</p>
              </div>
            </div>
            <div 
              className="bg-muted/50 p-4 rounded-lg transition-all duration-500"
              style={{ opacity: stepProgress > 60 ? 1 : 0 }}
            >
              <p className="text-sm text-muted-foreground mb-2">Visitas por Semana</p>
              <div className="flex items-end gap-2 h-16">
                {[60, 80, 45, 90, 75].map((height, i) => (
                  <div 
                    key={i}
                    className="flex-1 bg-primary rounded-t transition-all duration-500"
                    style={{ 
                      height: stepProgress > (70 + i * 5) ? `${height}%` : '0%',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 'notificacoes':
        return (
          <div className="p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notificações
              </h3>
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">3 novas</span>
            </div>
            <div className="space-y-3">
              {[
                { icon: Check, text: 'Maria Silva confirmou a visita', tempo: 'Agora', color: 'text-green-500' },
                { icon: Clock, text: 'Lembrete: Visita às 14:00', tempo: '5 min', color: 'text-orange-500' },
                { icon: FileCheck, text: 'Novo registro criado por João', tempo: '1h', color: 'text-primary' },
              ].map((notif, index) => (
                <div 
                  key={notif.text}
                  className="p-3 bg-muted/50 rounded-lg flex items-center gap-3 transition-all duration-500"
                  style={{ 
                    opacity: stepProgress > (index * 25) ? 1 : 0,
                    transform: stepProgress > (index * 25) ? 'translateX(0)' : 'translateX(-20px)'
                  }}
                >
                  <div className={`p-2 rounded-full bg-muted ${notif.color}`}>
                    <notif.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{notif.text}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{notif.tempo}</span>
                </div>
              ))}
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

      case 'parceiros':
        return (
          <div className="p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Handshake className="h-5 w-5 text-primary" />
                Parceiros
              </h3>
              <Button size="sm" variant="outline" className="gap-1 text-xs">
                <Users className="h-3 w-3" />
                Convidar
              </Button>
            </div>
            <div className="space-y-3">
              {[
                { nome: 'Imobiliária Centro', status: 'Parceiro', fichas: 12 },
                { nome: 'Corretor Carlos', status: 'Pendente', fichas: 0 },
                { nome: 'Imob Prime', status: 'Parceiro', fichas: 8 },
              ].map((parceiro, index) => (
                <div 
                  key={parceiro.nome}
                  className="p-3 bg-muted/50 rounded-lg flex items-center justify-between transition-all duration-500"
                  style={{ 
                    opacity: stepProgress > (index * 25) ? 1 : 0,
                    transform: stepProgress > (index * 25) ? 'translateX(0)' : 'translateX(-20px)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Handshake className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{parceiro.nome}</p>
                      <p className="text-xs text-muted-foreground">{parceiro.fichas} fichas compartilhadas</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    parceiro.status === 'Parceiro' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                  }`}>
                    {parceiro.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'templates':
        return (
          <div className="p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Templates
              </h3>
            </div>
            <div className="space-y-3">
              {[
                { nome: 'Confirmação de Visita', tipo: 'WhatsApp', ativo: true },
                { nome: 'Lembrete 24h', tipo: 'WhatsApp', ativo: true },
                { nome: 'Agradecimento', tipo: 'WhatsApp', ativo: false },
              ].map((template, index) => (
                <div 
                  key={template.nome}
                  className="p-3 bg-muted/50 rounded-lg flex items-center justify-between transition-all duration-500"
                  style={{ 
                    opacity: stepProgress > (index * 25) ? 1 : 0,
                    transform: stepProgress > (index * 25) ? 'translateX(0)' : 'translateX(-20px)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{template.nome}</p>
                      <p className="text-xs text-muted-foreground">{template.tipo}</p>
                    </div>
                  </div>
                  <div className={`w-8 h-5 rounded-full flex items-center px-0.5 ${
                    template.ativo ? 'bg-green-500 justify-end' : 'bg-muted justify-start'
                  }`}>
                    <div className="w-4 h-4 bg-white rounded-full shadow" />
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

      case 'planos':
        return (
          <div className="p-6 animate-fade-in">
            <div className="flex items-center justify-center mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Escolha seu Plano
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div 
                className="p-4 border rounded-lg transition-all duration-500"
                style={{ 
                  opacity: stepProgress > 20 ? 1 : 0,
                  transform: stepProgress > 20 ? 'translateY(0)' : 'translateY(10px)'
                }}
              >
                <h4 className="font-semibold mb-2">Gratuito</h4>
                <p className="text-2xl font-bold mb-2">R$ 0</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>✓ 10 fichas/mês</li>
                  <li>✓ 50 clientes</li>
                  <li>✓ 1 corretor</li>
                </ul>
              </div>
              <div 
                className="p-4 border-2 border-primary rounded-lg relative transition-all duration-500"
                style={{ 
                  opacity: stepProgress > 40 ? 1 : 0,
                  transform: stepProgress > 40 ? 'translateY(0)' : 'translateY(10px)'
                }}
              >
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">Popular</span>
                <h4 className="font-semibold mb-2">Premium</h4>
                <p className="text-2xl font-bold mb-2">R$ 49<span className="text-sm font-normal">/mês</span></p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>✓ Fichas ilimitadas</li>
                  <li>✓ Clientes ilimitados</li>
                  <li>✓ Equipe completa</li>
                </ul>
              </div>
            </div>
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

  // Calculate total duration in seconds for display
  const totalDurationSeconds = Math.round(totalDuration / 1000);
  const totalMinutes = Math.floor(totalDurationSeconds / 60);
  const totalSeconds = totalDurationSeconds % 60;

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
          <CardContent className="p-0 relative overflow-hidden min-h-[400px]">
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
            title="Reiniciar demo"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={toggleAudio}
            title={audioEnabled ? 'Desativar áudio' : 'Ativar áudio'}
          >
            {audioEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={clearCacheAndRegenerate}
            disabled={isGeneratingAudio}
            title="Limpar cache e regenerar áudios"
            className="text-xs"
          >
            {isGeneratingAudio ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Volume2 className="h-4 w-4 mr-1" />
            )}
            Regenerar Áudio
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

        {/* Duration info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Duração total: <strong>{totalMinutes}:{totalSeconds.toString().padStart(2, '0')}</strong>
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
