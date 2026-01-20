import { useState } from 'react';
import { SuperAdminLayout } from '@/components/layouts/SuperAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Image as ImageIcon, 
  Download, 
  RefreshCw, 
  Sparkles,
  Lightbulb,
  ArrowLeftRight,
  BarChart3,
  Quote,
  Layers,
  Copy,
  Check
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

const templates = [
  { value: 'feature', label: 'Destaque de Funcionalidade', icon: Sparkles },
  { value: 'dica', label: 'Dica do Corretor', icon: Lightbulb },
  { value: 'antes-depois', label: 'Antes vs Depois', icon: ArrowLeftRight },
  { value: 'estatistica', label: 'Estatística de Impacto', icon: BarChart3 },
  { value: 'depoimento', label: 'Depoimento/Citação', icon: Quote },
  { value: 'carrossel', label: 'Slide de Carrossel', icon: Layers },
];

const funcionalidades = [
  { value: 'otp-whatsapp', label: 'Confirmação OTP WhatsApp' },
  { value: 'qr-code', label: 'Verificação por QR Code' },
  { value: 'pdf', label: 'Comprovante em PDF' },
  { value: 'crm', label: 'CRM de Clientes' },
  { value: 'mobile', label: 'App Mobile/PWA' },
  { value: 'parcerias', label: 'Sistema de Parcerias' },
  { value: 'dashboard', label: 'Dashboard e Métricas' },
  { value: 'geral', label: 'Visão Geral do App' },
];

const sugestoesTitulos: Record<string, { titulo: string; subtitulo: string }> = {
  'otp-whatsapp': { titulo: 'Confirmação Segura', subtitulo: 'Código via WhatsApp em segundos' },
  'qr-code': { titulo: 'Verificação Instantânea', subtitulo: 'Escaneie e comprove a visita' },
  'pdf': { titulo: 'Comprovante Profissional', subtitulo: 'Baixe com um clique' },
  'crm': { titulo: 'Clientes Organizados', subtitulo: 'Tudo em um só lugar' },
  'mobile': { titulo: 'Na Palma da Mão', subtitulo: 'Acesse de qualquer lugar' },
  'parcerias': { titulo: 'Parcerias que Funcionam', subtitulo: 'Divida comissões sem complicação' },
  'dashboard': { titulo: 'Dados em Tempo Real', subtitulo: 'Tome decisões inteligentes' },
  'geral': { titulo: 'VisitaProva', subtitulo: 'A evolução da gestão imobiliária' },
};

export default function AdminMarketingImages() {
  const [template, setTemplate] = useState('feature');
  const [titulo, setTitulo] = useState('');
  const [subtitulo, setSubtitulo] = useState('');
  const [funcionalidade, setFuncionalidade] = useState('geral');
  const [formato, setFormato] = useState<'quadrado' | 'vertical'>('quadrado');
  const [estilo, setEstilo] = useState<'claro' | 'escuro'>('escuro');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
const [legenda, setLegenda] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isRegeneratingDesc, setIsRegeneratingDesc] = useState(false);

  const handleFuncionalidadeChange = (value: string) => {
    setFuncionalidade(value);
    const sugestao = sugestoesTitulos[value];
    if (sugestao) {
      setTitulo(sugestao.titulo);
      setSubtitulo(sugestao.subtitulo);
    }
  };

  const handleGenerate = async () => {
    if (!titulo.trim()) {
      toast.error('Digite um título para a imagem');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setLegenda('');
    setCopied(false);

    try {
      const { data, error } = await supabase.functions.invoke('generate-marketing-image', {
        body: {
          template,
          titulo,
          subtitulo,
          funcionalidade,
          formato,
          estilo,
        },
      });

      if (error) {
        console.error('Error:', error);
        throw new Error(error.message || 'Erro ao gerar imagem');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.image) {
        // Se a imagem vier como base64
        if (data.image.startsWith('data:')) {
          setGeneratedImage(data.image);
        } else {
          // Assumir que é base64 sem prefixo
          setGeneratedImage(`data:image/png;base64,${data.image}`);
        }
        
        // Definir legenda pronta para copiar
        if (data.legenda) {
          setLegenda(data.legenda);
        }
        
        toast.success('Imagem gerada com sucesso!');
      } else {
        throw new Error('Nenhuma imagem retornada');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar imagem');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `visitaprova-${template}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Imagem baixada!');
  };

  const handleCopyLegenda = async () => {
    if (!legenda) return;
    
    try {
      await navigator.clipboard.writeText(legenda);
      setCopied(true);
      toast.success('Legenda copiada!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar legenda');
    }
  };

  const handleRegenerateDescription = async () => {
    if (!titulo.trim()) {
      toast.error('Digite um título primeiro');
      return;
    }

    setIsRegeneratingDesc(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-marketing-image', {
        body: {
          template,
          titulo,
          subtitulo,
          funcionalidade,
          formato,
          estilo,
          onlyDescription: true,
        },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      if (data.legenda) {
        setLegenda(data.legenda);
        toast.success('Nova descrição gerada!');
      }
    } catch (error) {
      console.error('Error regenerating description:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao regenerar descrição');
    } finally {
      setIsRegeneratingDesc(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ImageIcon className="h-6 w-6" />
            Gerador de Imagens para Instagram
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie imagens profissionais para divulgar o VisitaProva nas redes sociais
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Formulário */}
          <Card>
            <CardHeader>
              <CardTitle>Configurar Imagem</CardTitle>
              <CardDescription>
                Escolha o template e personalize o conteúdo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Template */}
              <div className="space-y-2">
                <Label>Tipo de Post</Label>
                <Select value={template} onValueChange={setTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <t.icon className="h-4 w-4" />
                          {t.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Funcionalidade */}
              <div className="space-y-2">
                <Label>Funcionalidade em Destaque</Label>
                <Select value={funcionalidade} onValueChange={handleFuncionalidadeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a funcionalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {funcionalidades.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="titulo">Título Principal</Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Confirmação Segura"
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">{titulo.length}/50 caracteres</p>
              </div>

              {/* Subtítulo */}
              <div className="space-y-2">
                <Label htmlFor="subtitulo">Subtítulo</Label>
                <Input
                  id="subtitulo"
                  value={subtitulo}
                  onChange={(e) => setSubtitulo(e.target.value)}
                  placeholder="Ex: Código via WhatsApp em segundos"
                  maxLength={80}
                />
                <p className="text-xs text-muted-foreground">{subtitulo.length}/80 caracteres</p>
              </div>

              {/* Formato */}
              <div className="space-y-3">
                <Label>Formato</Label>
                <RadioGroup 
                  value={formato} 
                  onValueChange={(v) => setFormato(v as 'quadrado' | 'vertical')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="quadrado" id="quadrado" />
                    <Label htmlFor="quadrado" className="cursor-pointer">
                      Quadrado (1:1)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="vertical" id="vertical" />
                    <Label htmlFor="vertical" className="cursor-pointer">
                      Vertical (4:5)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Estilo */}
              <div className="space-y-3">
                <Label>Estilo Visual</Label>
                <RadioGroup 
                  value={estilo} 
                  onValueChange={(v) => setEstilo(v as 'claro' | 'escuro')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="claro" id="claro" />
                    <Label htmlFor="claro" className="cursor-pointer">
                      Modo Claro
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="escuro" id="escuro" />
                    <Label htmlFor="escuro" className="cursor-pointer">
                      Modo Escuro
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Botão Gerar */}
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Gerando imagem...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gerar Imagem
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                Visualize a imagem gerada pela IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className={`relative bg-muted rounded-lg overflow-hidden flex items-center justify-center ${
                  formato === 'quadrado' ? 'aspect-square' : 'aspect-[4/5]'
                }`}
              >
                {isGenerating ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <Skeleton className="w-full h-full absolute inset-0" />
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Gerando sua imagem...</p>
                      <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos</p>
                    </div>
                  </div>
                ) : generatedImage ? (
                  <img 
                    src={generatedImage} 
                    alt="Imagem gerada" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-muted-foreground p-8 text-center">
                    <ImageIcon className="h-16 w-16 opacity-50" />
                    <div>
                      <p className="font-medium">Nenhuma imagem gerada</p>
                      <p className="text-sm">Configure os parâmetros e clique em "Gerar Imagem"</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Ações */}
              {generatedImage && (
                <div className="space-y-4 mt-4">
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleDownload}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Imagem
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Descrição profissional para copiar */}
                  {legenda && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          📝 Descrição profissional para Instagram
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          {legenda.length}/2200 caracteres
                        </span>
                      </div>
                      <Textarea 
                        value={legenda}
                        onChange={(e) => setLegenda(e.target.value)}
                        className="min-h-[200px] text-sm leading-relaxed"
                        placeholder="Descrição será gerada automaticamente..."
                      />
                      <div className="flex gap-2">
                        <Button 
                          variant="secondary"
                          onClick={handleCopyLegenda}
                          className="flex-1"
                        >
                          {copied ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copiar Descrição
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={handleRegenerateDescription}
                          disabled={isRegeneratingDesc}
                        >
                          {isRegeneratingDesc ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        💡 Descrição gerada por IA com estrutura otimizada para engajamento. Edite à vontade antes de copiar!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Dicas para Posts no Instagram
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <h4 className="font-medium">📐 Formatos</h4>
                <p className="text-sm text-muted-foreground">
                  Use quadrado (1:1) para o feed e vertical (4:5) para maior impacto visual
                </p>
              </div>
              <div className="space-y-1">
                <h4 className="font-medium">🎨 Consistência</h4>
                <p className="text-sm text-muted-foreground">
                  Mantenha o mesmo estilo (claro ou escuro) em toda a série de posts
                </p>
              </div>
              <div className="space-y-1">
                <h4 className="font-medium">✍️ Textos Curtos</h4>
                <p className="text-sm text-muted-foreground">
                  Títulos de 2-4 palavras e subtítulos de até 8 palavras funcionam melhor
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}
