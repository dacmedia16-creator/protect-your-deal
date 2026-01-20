import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, RotateCcw, Volume2, Loader2, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import FichaDigitalMockup from '@/components/mockups/FichaDigitalMockup';
import WhatsAppOTPMockup from '@/components/mockups/WhatsAppOTPMockup';
import QRCodeMockup from '@/components/mockups/QRCodeMockup';
import PDFComprovanteMockup from '@/components/mockups/PDFComprovanteMockup';
import CRMMockup from '@/components/mockups/CRMMockup';
import MobileAppMockup from '@/components/mockups/MobileAppMockup';

const SCRIPT_SECTIONS = [
  {
    id: 'intro',
    title: 'Introdução',
    text: 'Olá! Bem-vindo ao VisitaProva, a plataforma que revoluciona a segurança nas visitas imobiliárias. Vou te mostrar como nossa solução protege corretores, proprietários e compradores em cada etapa do processo.',
    mockup: null,
  },
  {
    id: 'ficha',
    title: 'Ficha Digital de Visita',
    text: 'Com nossa Ficha Digital, você cria registros completos de cada visita em poucos segundos, diretamente do seu celular. Inclua dados do imóvel, proprietário e comprador, com toda a segurança jurídica que você precisa.',
    mockup: FichaDigitalMockup,
  },
  {
    id: 'whatsapp',
    title: 'Confirmação via WhatsApp',
    text: 'A confirmação via WhatsApp garante que todos os envolvidos validem sua participação com um código único enviado diretamente para o celular. Sem complicações, sem falsificações.',
    mockup: WhatsAppOTPMockup,
  },
  {
    id: 'qrcode',
    title: 'QR Code de Verificação',
    text: 'Cada ficha possui um QR Code exclusivo que pode ser escaneado para verificar a autenticidade do documento. Proteção contra fraudes na palma da sua mão.',
    mockup: QRCodeMockup,
  },
  {
    id: 'pdf',
    title: 'Comprovante em PDF',
    text: 'Gere comprovantes profissionais em PDF prontos para download e compartilhamento. Documentação completa com validade jurídica para sua segurança.',
    mockup: PDFComprovanteMockup,
  },
  {
    id: 'crm',
    title: 'CRM de Clientes',
    text: 'Organize todos os seus clientes em um só lugar. Cadastre proprietários e compradores, adicione tags, notas e tenha o histórico completo de cada relacionamento.',
    mockup: CRMMockup,
  },
  {
    id: 'pwa',
    title: 'App Mobile',
    text: 'Instale o VisitaProva como um aplicativo no seu celular. Funciona offline, envia notificações e está sempre disponível quando você precisar. Tudo isso sem precisar baixar nada da loja de aplicativos.',
    mockup: MobileAppMockup,
  },
  {
    id: 'conclusao',
    title: 'Conclusão',
    text: 'Com o VisitaProva, você tem segurança jurídica, praticidade e profissionalismo em cada visita. Comece gratuitamente e descubra como transformar sua rotina imobiliária.',
    mockup: null,
  },
];

const FULL_SCRIPT = SCRIPT_SECTIONS.map(s => s.text).join(' ');

export default function TourAudio() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentSection = SCRIPT_SECTIONS[currentSectionIndex];
  const CurrentMockup = currentSection.mockup;

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const generateAudio = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: FULL_SCRIPT, voice: 'nova' }
      });

      if (error) throw error;

      if (data?.audioContent) {
        // Convert base64 to blob
        const byteCharacters = atob(data.audioContent);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        
        setAudioUrl(url);
        toast.success('Áudio gerado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao gerar áudio:', error);
      toast.error('Erro ao gerar áudio. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const restart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentSectionIndex(0);
    if (!isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    
    // Estimate which section we're in based on time
    const progress = audioRef.current.currentTime / audioRef.current.duration;
    const estimatedSection = Math.floor(progress * SCRIPT_SECTIONS.length);
    if (estimatedSection !== currentSectionIndex && estimatedSection < SCRIPT_SECTIONS.length) {
      setCurrentSectionIndex(estimatedSection);
    }
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentSectionIndex(0);
  };

  const nextSection = () => {
    if (currentSectionIndex < SCRIPT_SECTIONS.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  };

  const prevSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = 'visitasegura-tour.mp3';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary">
            VisitaSegura
          </Link>
          <Link to="/">
            <Button variant="outline" size="sm">
              Voltar ao início
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Title */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Tour em Áudio
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ouça uma apresentação completa sobre todas as funcionalidades do VisitaSegura
            enquanto acompanha os mockups interativos.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Audio Player Section */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                {!audioUrl ? (
                  <div className="text-center py-8">
                    <Volume2 className="h-16 w-16 text-primary/50 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Gerar Narração em Áudio
                    </h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      Clique no botão abaixo para gerar uma narração profissional
                      sobre todas as funcionalidades do VisitaSegura.
                    </p>
                    <Button 
                      onClick={generateAudio} 
                      disabled={isLoading}
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando áudio...
                        </>
                      ) : (
                        <>
                          <Volume2 className="mr-2 h-4 w-4" />
                          Gerar Áudio
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onEnded={handleEnded}
                    />

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div 
                        className="h-2 bg-muted rounded-full cursor-pointer overflow-hidden"
                        onClick={(e) => {
                          if (!audioRef.current) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const percentage = x / rect.width;
                          audioRef.current.currentTime = percentage * duration;
                        }}
                      >
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${(currentTime / duration) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={restart}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        size="lg"
                        className="h-14 w-14 rounded-full"
                        onClick={togglePlay}
                      >
                        {isPlaying ? (
                          <Pause className="h-6 w-6" />
                        ) : (
                          <Play className="h-6 w-6 ml-1" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={downloadAudio}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section Navigation */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={prevSection}
                    disabled={currentSectionIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentSectionIndex + 1} / {SCRIPT_SECTIONS.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextSection}
                    disabled={currentSectionIndex === SCRIPT_SECTIONS.length - 1}
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                <h3 className="font-semibold text-lg mb-2">
                  {currentSection.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {currentSection.text}
                </p>
              </CardContent>
            </Card>

            {/* Section Dots */}
            <div className="flex justify-center gap-2">
              {SCRIPT_SECTIONS.map((section, index) => (
                <button
                  key={section.id}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSectionIndex 
                      ? 'bg-primary w-6' 
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                  onClick={() => setCurrentSectionIndex(index)}
                  aria-label={`Ir para ${section.title}`}
                />
              ))}
            </div>
          </div>

          {/* Mockup Display */}
          <div className="lg:sticky lg:top-24">
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted rounded-lg overflow-hidden">
                  {CurrentMockup ? (
                    <div className="transform scale-75 md:scale-90 origin-center animate-fade-in">
                      <CurrentMockup />
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <div className="text-6xl mb-4">🏠</div>
                      <h3 className="text-xl font-semibold text-primary">
                        VisitaSegura
                      </h3>
                      <p className="text-muted-foreground text-sm mt-2">
                        {currentSectionIndex === 0 
                          ? 'Segurança em cada visita'
                          : 'Comece agora gratuitamente!'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link to="/registro">
            <Button size="lg" className="text-lg px-8">
              Começar Gratuitamente
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
