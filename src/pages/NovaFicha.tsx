import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useImobiliariaFeatureFlag } from '@/hooks/useImobiliariaFeatureFlag';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { OTP_URL } from '@/lib/appConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CepInput } from '@/components/CepInput';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { useToast } from '@/hooks/use-toast';
import { Building2, User, Users, Calendar, FileText, Loader2, MessageCircle, AlertTriangle, Send, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { z } from 'zod';
import { validateCPF, formatCPF } from '@/lib/cpf';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileNav } from '@/components/MobileNav';
import { OnboardingTour } from '@/components/OnboardingTour';

const NOVA_FICHA_TOUR_STEPS = [
  { target: 'ficha-progress', title: 'Progresso', description: 'Acompanhe seu progresso aqui. Cada etapa será marcada quando concluída.' },
  { target: 'ficha-modo', title: 'Modo de Criação', description: 'Escolha como criar: todos os dados de uma vez ou começar pelo proprietário/comprador.' },
  { target: 'ficha-nav-buttons', title: 'Navegação', description: 'Use os botões para navegar entre as etapas. No final, clique em "Criar Registro".' },
];


type ModoCriacao = 'completo' | 'proprietario' | 'comprador';

// Helper para formatar data/hora local (evita conversão UTC do toISOString)
const getLocalDateTime = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${mins}`;
};

// Schema dinâmico baseado no modo de criação
const createFichaSchema = (modo: ModoCriacao) => {
  const baseSchema = z.object({
    imovel_endereco: z.string().min(5, 'Endereço deve ter no mínimo 5 caracteres'),
    imovel_tipo: z.string().min(1, 'Selecione o tipo do imóvel'),
    proprietario_autopreenchimento: z.boolean().default(false),
    proprietario_nome: z.string().optional(),
    proprietario_cpf: z.string().optional(),
    proprietario_telefone: z.string().optional(),
    comprador_autopreenchimento: z.boolean().default(false),
    comprador_nome: z.string().optional(),
    comprador_cpf: z.string().optional(),
    comprador_telefone: z.string().optional(),
    data_visita: z.string().min(1, 'Data da visita é obrigatória'),
    observacoes: z.string().optional(),
  });

  return baseSchema.superRefine((data, ctx) => {
    if (modo === 'completo' || modo === 'proprietario') {
      if (!data.proprietario_telefone || data.proprietario_telefone.replace(/\D/g, '').length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Telefone do proprietário é obrigatório',
          path: ['proprietario_telefone'],
        });
      }
      if (!data.proprietario_autopreenchimento && (!data.proprietario_nome || data.proprietario_nome.length < 2)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Nome do proprietário é obrigatório',
          path: ['proprietario_nome'],
        });
      }
    }

    if (modo === 'completo' || modo === 'comprador') {
      if (!data.comprador_telefone || data.comprador_telefone.replace(/\D/g, '').length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Telefone do comprador é obrigatório',
          path: ['comprador_telefone'],
        });
      }
      if (!data.comprador_autopreenchimento && (!data.comprador_nome || data.comprador_nome.length < 2)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Nome do comprador é obrigatório',
          path: ['comprador_nome'],
        });
      }
    }
  });
};

type FichaFormData = {
  imovel_endereco: string;
  imovel_tipo: string;
  proprietario_autopreenchimento: boolean;
  proprietario_nome: string;
  proprietario_cpf: string;
  proprietario_telefone: string;
  comprador_autopreenchimento: boolean;
  comprador_nome: string;
  comprador_cpf: string;
  comprador_telefone: string;
  data_visita: string;
  observacoes: string;
};

const tiposImovel = [
  'Apartamento',
  'Casa',
  'Sobrado',
  'Terreno',
  'Sala Comercial',
  'Galpão',
  'Fazenda',
  'Chácara',
  'Cobertura',
  'Kitnet',
  'Outro',
];

interface ClienteSelecionado {
  id: string;
  nome: string;
  cpf: string | null;
  telefone: string;
  tipo: string;
}

interface ProprietarioVinculado {
  id: string;
  nome: string;
  cpf: string | null;
  telefone: string;
}

interface ImovelSelecionado {
  id: string;
  endereco: string;
  tipo: string;
  bairro: string | null;
  cidade: string | null;
  proprietario_id: string | null;
  proprietario?: ProprietarioVinculado | null;
}

interface WizardStep {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export default function NovaFicha() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { imobiliariaId, construtoraId, construtora, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isConstrutora = !!construtoraId;
  const { enabled: empreendimentoEnabled, loading: empreendimentoFlagLoading } = useImobiliariaFeatureFlag('empreendimento_visita');
  const modoConstrutoraParceira = !isConstrutora && !!imobiliariaId && searchParams.get('modo') === 'construtora' && empreendimentoEnabled;
  const [modoCriacao, setModoCriacao] = useState<ModoCriacao>('completo');
  const [empreendimentoId, setEmpreendimentoId] = useState<string>('');
  const [selectedConstrutoraId, setSelectedConstrutoraId] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(0);

  // Buscar construtoras parceiras (para corretores de imobiliária)
  const { data: parceriasConstrutoras = [] } = useQuery({
    queryKey: ['parcerias-construtoras', imobiliariaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('construtora_imobiliarias')
        .select('construtora_id, construtoras!construtora_imobiliarias_construtora_id_fkey(id, nome, cnpj, telefone)')
        .eq('imobiliaria_id', imobiliariaId!)
        .eq('status', 'ativa');
      if (error) throw error;
      return data || [];
    },
    enabled: modoConstrutoraParceira,
  });

  // Buscar empreendimentos liberados para a imobiliária da construtora parceira selecionada
  const { data: empreendimentosParceira = [] } = useQuery({
    queryKey: ['empreendimentos-parceira', selectedConstrutoraId, imobiliariaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empreendimentos')
        .select('id, nome, endereco, cidade, estado, tipo')
        .eq('construtora_id', selectedConstrutoraId)
        .eq('status', 'ativo')
        .order('nome');
      if (error) throw error;
      const { data: linkedIds } = await supabase
        .from('empreendimento_imobiliarias')
        .select('empreendimento_id')
        .eq('imobiliaria_id', imobiliariaId!);
      const allowedIds = new Set((linkedIds || []).map(l => l.empreendimento_id));
      return (data || []).filter(e => allowedIds.has(e.id));
    },
    enabled: modoConstrutoraParceira && !!selectedConstrutoraId,
  });

  // Buscar empreendimentos da construtora nativa
  const { data: empreendimentos = [] } = useQuery({
    queryKey: ['empreendimentos-construtora', construtoraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empreendimentos')
        .select('id, nome, endereco, cidade, estado, tipo')
        .eq('construtora_id', construtoraId!)
        .eq('status', 'ativo')
        .order('nome');
      if (error) throw error;
      return data || [];
    },
    enabled: isConstrutora && !!construtoraId,
  });
  
  
  const [enviarWhatsappAutomatico, setEnviarWhatsappAutomatico] = useState(true);
  
  const [formData, setFormData] = useState<FichaFormData>({
    imovel_endereco: '',
    imovel_tipo: '',
    proprietario_autopreenchimento: false,
    proprietario_nome: '',
    proprietario_cpf: '',
    proprietario_telefone: '',
    comprador_autopreenchimento: false,
    comprador_nome: '',
    comprador_cpf: '',
    comprador_telefone: '',
    data_visita: getLocalDateTime(),
    observacoes: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Redirect if user tries ?modo=construtora without the flag enabled
  useEffect(() => {
    if (!roleLoading && !empreendimentoFlagLoading && !isConstrutora && !!imobiliariaId && searchParams.get('modo') === 'construtora' && !empreendimentoEnabled) {
      navigate('/fichas/nova', { replace: true });
    }
  }, [roleLoading, empreendimentoFlagLoading, isConstrutora, imobiliariaId, searchParams, empreendimentoEnabled, navigate]);

  // Forçar modo comprador para corretores de construtora ou modo construtora parceira
  useEffect(() => {
    if (isConstrutora || modoConstrutoraParceira) {
      setModoCriacao('comprador');
    }
  }, [isConstrutora, modoConstrutoraParceira]);


  // Dynamic steps
  const steps: WizardStep[] = useMemo(() => {
    if (isConstrutora || modoConstrutoraParceira) {
      return [
        { id: 'empreendimento', label: 'Empreendimento', icon: <Building2 className="h-4 w-4" /> },
        { id: 'comprador', label: 'Comprador', icon: <Users className="h-4 w-4" /> },
        { id: 'revisao', label: 'Confirmar', icon: <Check className="h-4 w-4" /> },
      ];
    }

    const s: WizardStep[] = [
      { id: 'modo', label: 'Modo', icon: <FileText className="h-4 w-4" /> },
      { id: 'imovel', label: 'Imóvel', icon: <Building2 className="h-4 w-4" /> },
    ];

    if (modoCriacao === 'completo' || modoCriacao === 'proprietario') {
      s.push({ id: 'proprietario', label: 'Proprietário', icon: <User className="h-4 w-4" /> });
    }
    if (modoCriacao === 'completo' || modoCriacao === 'comprador') {
      s.push({ id: 'comprador', label: 'Comprador', icon: <Users className="h-4 w-4" /> });
    }
    s.push({ id: 'revisao', label: 'Confirmar', icon: <Check className="h-4 w-4" /> });

    return s;
  }, [isConstrutora, modoConstrutoraParceira, modoCriacao]);

  // Clamp currentStep if steps changed
  useEffect(() => {
    if (currentStep >= steps.length) {
      setCurrentStep(steps.length - 1);
    }
  }, [steps.length, currentStep]);

  const currentStepId = steps[currentStep]?.id;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (field: 'proprietario_telefone' | 'comprador_telefone', value: string) => {
    setFormData({ ...formData, [field]: formatPhone(value) });
  };

  const handleCPFChange = (field: 'proprietario_cpf' | 'comprador_cpf', value: string) => {
    setFormData({ ...formData, [field]: formatCPF(value) });
  };

  const proprietarioCpfValid = !formData.proprietario_cpf || validateCPF(formData.proprietario_cpf);
  const compradorCpfValid = !formData.comprador_cpf || validateCPF(formData.comprador_cpf);

  // Per-step validation
  const validateCurrentStep = (): string | null => {
    switch (currentStepId) {
      case 'modo':
        return null; // always valid, radio has default
      case 'empreendimento':
        if (modoConstrutoraParceira && !selectedConstrutoraId) return 'Selecione uma construtora parceira';
        if (!empreendimentoId) return 'Selecione um empreendimento';
        // If generic, need address
        {
          const empList = modoConstrutoraParceira ? empreendimentosParceira : empreendimentos;
          const selectedEmp = empList.find(e => e.id === empreendimentoId);
          if (selectedEmp?.nome === 'Outro (Endereço Manual)') {
            if (!formData.imovel_endereco || formData.imovel_endereco.length < 5) return 'Informe o endereço do imóvel';
            if (!formData.imovel_tipo) return 'Selecione o tipo do imóvel';
          }
        }
        return null;
      case 'imovel':
        if (!formData.imovel_endereco || formData.imovel_endereco.length < 5) return 'Endereço deve ter no mínimo 5 caracteres';
        if (!formData.imovel_tipo) return 'Selecione o tipo do imóvel';
        return null;
      case 'proprietario':
        if (!formData.proprietario_telefone || formData.proprietario_telefone.replace(/\D/g, '').length < 10)
          return 'Telefone do proprietário é obrigatório';
        if (!formData.proprietario_autopreenchimento && (!formData.proprietario_nome || formData.proprietario_nome.length < 2))
          return 'Nome do proprietário é obrigatório';
        if (formData.proprietario_cpf && !validateCPF(formData.proprietario_cpf))
          return 'CPF do proprietário é inválido';
        return null;
      case 'comprador':
        if (!formData.comprador_telefone || formData.comprador_telefone.replace(/\D/g, '').length < 10)
          return 'Telefone do comprador é obrigatório';
        if (!formData.comprador_autopreenchimento && (!formData.comprador_nome || formData.comprador_nome.length < 2))
          return 'Nome do comprador é obrigatório';
        if (formData.comprador_cpf && !validateCPF(formData.comprador_cpf))
          return 'CPF do comprador é inválido';
        return null;
      case 'revisao':
        return null;
      default:
        return null;
    }
  };

  const handleNext = () => {
    const error = validateCurrentStep();
    if (error) {
      toast({ variant: 'destructive', title: 'Preencha os campos', description: error });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const generateProtocolo = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_protocolo');
    if (error) {
      const prefix = 'VS';
      const year = new Date().getFullYear().toString().slice(-2);
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `${prefix}${year}${random}`;
    }
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Bloquear submit se não estiver no último passo
    if (!isLastStep) {
      handleNext();
      return;
    }
    
    if ((isConstrutora || modoConstrutoraParceira) && !empreendimentoId) {
      toast({ variant: 'destructive', title: 'Erro de validação', description: 'Selecione um empreendimento' });
      return;
    }

    if (modoConstrutoraParceira && !selectedConstrutoraId) {
      toast({ variant: 'destructive', title: 'Erro de validação', description: 'Selecione uma construtora parceira' });
      return;
    }

    const fichaSchema = createFichaSchema((isConstrutora || modoConstrutoraParceira) ? 'comprador' : modoCriacao);
    const result = fichaSchema.safeParse({
      ...formData,
      imovel_endereco: formData.imovel_endereco || 'auto',
      imovel_tipo: formData.imovel_tipo || 'auto',
    });
    if (!result.success) {
      toast({ variant: 'destructive', title: 'Erro de validação', description: result.error.errors[0].message });
      return;
    }

    if (!user) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado' });
      return;
    }

    setIsSubmitting(true);

    try {
      const [imobResult, constResult] = await Promise.all([
        supabase.rpc('get_user_imobiliaria', { _user_id: user.id }),
        supabase.rpc('get_user_construtora', { _user_id: user.id }),
      ]);

      if (imobResult.error) throw imobResult.error;
      const dbImobiliariaId = imobResult.data;
      const dbConstrutoraId = constResult.data;

      const isCorretorAutonomo = !dbImobiliariaId && !dbConstrutoraId;
      
      if (isCorretorAutonomo) {
        console.info('[NovaFicha] Corretor autônomo criando ficha sem imobiliária');
      }

      if (imobiliariaId && dbImobiliariaId !== imobiliariaId) {
        console.warn('[NovaFicha] imobiliariaId diverge do backend', {
          hookImobiliariaId: imobiliariaId,
          dbImobiliariaId,
          userId: user.id,
        });
      }

      const protocolo = await generateProtocolo();
      
      const isConstrutoraBroker = !!dbConstrutoraId;
      const isParceiraMode = modoConstrutoraParceira && !!selectedConstrutoraId;
      const selectedParceira = isParceiraMode 
        ? parceriasConstrutoras.find(p => p.construtora_id === selectedConstrutoraId)
        : null;
      
      const incluiProprietario = !isConstrutoraBroker && !isParceiraMode && (modoCriacao === 'completo' || modoCriacao === 'proprietario');
      const incluiComprador = modoCriacao === 'completo' || modoCriacao === 'comprador';

      const insertData: any = {
        user_id: user.id,
        imobiliaria_id: dbImobiliariaId || null,
        construtora_id: isParceiraMode ? selectedConstrutoraId : (dbConstrutoraId || null),
        protocolo,
        imovel_endereco: formData.imovel_endereco,
        imovel_tipo: formData.imovel_tipo,
        empreendimento_id: empreendimentoId || null,
        comprador_autopreenchimento: incluiComprador ? formData.comprador_autopreenchimento : false,
        comprador_nome: incluiComprador && !formData.comprador_autopreenchimento ? formData.comprador_nome : null,
        comprador_cpf: incluiComprador ? formData.comprador_cpf || null : null,
        comprador_telefone: incluiComprador ? formData.comprador_telefone.replace(/\D/g, '') : null,
        data_visita: formData.data_visita,
        observacoes: formData.observacoes || null,
      };

      if (isConstrutoraBroker && construtora) {
        insertData.proprietario_nome = construtora.nome;
        insertData.proprietario_cpf = construtora.cnpj || null;
        insertData.proprietario_telefone = construtora.telefone?.replace(/\D/g, '') || null;
        insertData.proprietario_autopreenchimento = false;
        insertData.proprietario_confirmado_em = new Date().toISOString();
        insertData.status = 'aguardando_comprador';
      } else if (isParceiraMode && selectedParceira) {
        const constData = selectedParceira.construtoras as any;
        insertData.proprietario_nome = constData?.nome || 'Construtora';
        insertData.proprietario_cpf = constData?.cnpj || null;
        insertData.proprietario_telefone = constData?.telefone?.replace(/\D/g, '') || null;
        insertData.proprietario_autopreenchimento = false;
        insertData.proprietario_confirmado_em = new Date().toISOString();
        insertData.status = 'aguardando_comprador';
      } else {
        insertData.proprietario_autopreenchimento = incluiProprietario ? formData.proprietario_autopreenchimento : false;
        insertData.proprietario_nome = incluiProprietario && !formData.proprietario_autopreenchimento ? formData.proprietario_nome : null;
        insertData.proprietario_cpf = incluiProprietario ? formData.proprietario_cpf || null : null;
        insertData.proprietario_telefone = incluiProprietario ? formData.proprietario_telefone.replace(/\D/g, '') : null;
        insertData.status = 'pendente';
      }

      const { data, error } = await supabase
        .from('fichas_visita')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      if (enviarWhatsappAutomatico) {
        const queueItems = [];

        if (incluiProprietario && !isConstrutoraBroker && !isParceiraMode) {
          queueItems.push({
            ficha_id: data.id,
            tipo: 'proprietario',
            app_url: OTP_URL,
            user_id: user.id,
            prioridade: 10,
          });
        }

        if (incluiComprador) {
          queueItems.push({
            ficha_id: data.id,
            tipo: 'comprador',
            app_url: OTP_URL,
            user_id: user.id,
            prioridade: 10,
          });
        }

        if (queueItems.length > 0) {
          const { error: queueError } = await supabase
            .from('otp_queue')
            .insert(queueItems);

          if (queueError) {
            console.error('Erro ao enfileirar OTPs:', queueError);
            toast({
              title: 'Registro criado com sucesso!',
              description: `Protocolo: ${protocolo}. Houve um erro ao agendar o envio do código. Envie manualmente.`,
            });
          } else {
            supabase.functions.invoke('process-otp-queue').catch(err => {
              console.log('Processamento da fila iniciado em background:', err);
            });

            const partesEnviadas = [];
            if (incluiProprietario) partesEnviadas.push('proprietário');
            if (incluiComprador) partesEnviadas.push('comprador');

            toast({
              title: 'Registro criado com sucesso!',
              description: `Protocolo: ${protocolo}. Código de confirmação será enviado para ${partesEnviadas.join(' e ')} em instantes.`,
            });
          }
        } else {
          toast({
            title: 'Registro criado com sucesso!',
            description: `Protocolo: ${protocolo}`,
          });
        }
      } else {
        toast({
          title: 'Registro criado com sucesso!',
          description: `Protocolo: ${protocolo}. Envie o código de confirmação manualmente quando desejar.`,
        });
      }

      navigate(`/fichas/${data.id}`);
    } catch (error: any) {
      console.error('Erro ao criar ficha:', error);
      
      if (error?.message?.includes('Limite de') && error?.message?.includes('fichas/mês atingido')) {
        toast({
          variant: 'destructive',
          title: 'Limite do plano atingido',
          description: 'Você atingiu o limite de fichas do mês. Faça upgrade do seu plano para continuar.',
        });
        navigate(imobiliariaId ? '/empresa/assinatura' : '/minha-assinatura');
        return;
      }
      
      if (error?.message?.includes('Assinatura inativa ou inexistente')) {
        toast({
          variant: 'destructive',
          title: 'Assinatura inativa',
          description: 'Você precisa de uma assinatura ativa para criar fichas.',
        });
        navigate(imobiliariaId ? '/empresa/assinatura' : '/minha-assinatura');
        return;
      }
      
      toast({
        variant: 'destructive',
        title: 'Erro ao criar registro',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const showProprietario = !isConstrutora && !modoConstrutoraParceira && (modoCriacao === 'completo' || modoCriacao === 'proprietario');
  const showComprador = modoCriacao === 'completo' || modoCriacao === 'comprador';
  const empreendimentosParaSelect = modoConstrutoraParceira ? empreendimentosParceira : empreendimentos;

  // ===== PROGRESS INDICATOR =====
  const renderProgressIndicator = () => (
    <div className="mb-6" data-tour="ficha-progress">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isFuture = index > currentStep;

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (isCompleted) setCurrentStep(index);
                  }}
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all text-sm font-semibold
                    ${isCompleted 
                      ? 'bg-green-500 border-green-500 text-white cursor-pointer hover:bg-green-600' 
                      : isCurrent 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : 'bg-muted border-muted-foreground/30 text-muted-foreground cursor-default'
                    }
                  `}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                </button>
                <span className={`mt-1.5 text-xs font-medium hidden md:block ${isCurrent ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {step.label}
                </span>
              </div>
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${index < currentStep ? 'bg-green-500' : 'bg-muted-foreground/20'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ===== STEP: MODO =====
  const renderStepModo = () => (
    <Card className="border-primary/30 bg-primary/5" data-tour="ficha-modo">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-lg">Como deseja criar este registro?</CardTitle>
            <CardDescription>Escolha se quer preencher todos os dados agora ou começar por uma das partes</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={modoCriacao}
          onValueChange={(value) => setModoCriacao(value as ModoCriacao)}
          className="grid gap-3"
        >
          <div className="flex items-center space-x-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="completo" id="completo" />
            <label htmlFor="completo" className="flex-1 cursor-pointer">
              <span className="font-medium">Preencher todos os dados agora</span>
              <p className="text-sm text-muted-foreground">Proprietário e comprador de uma vez</p>
            </label>
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="proprietario" id="proprietario" />
            <label htmlFor="proprietario" className="flex-1 cursor-pointer">
              <span className="font-medium">Apenas Proprietário primeiro</span>
              <p className="text-sm text-muted-foreground">Preencha o comprador depois no registro</p>
            </label>
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="comprador" id="comprador" />
            <label htmlFor="comprador" className="flex-1 cursor-pointer">
              <span className="font-medium">Apenas Comprador primeiro</span>
              <p className="text-sm text-muted-foreground">Preencha o proprietário depois no registro</p>
            </label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );

  // ===== STEP: EMPREENDIMENTO (construtora) =====
  const renderStepEmpreendimento = () => (
    <>
      {/* Info card for construtora nativa */}
      {isConstrutora && construtora && (
        <Card className="border-primary/30 bg-primary/5 mb-4">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Proprietário: {construtora.nome}</p>
                <p className="text-sm text-muted-foreground">
                  Os dados do proprietário serão preenchidos automaticamente com os dados da construtora.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parceira: select construtora + empreendimento */}
      {modoConstrutoraParceira && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Construtora Parceira</CardTitle>
                <CardDescription>Selecione a construtora e o empreendimento</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="construtora-parceira">Construtora *</Label>
              <Select
                value={selectedConstrutoraId}
                onValueChange={(value) => {
                  setSelectedConstrutoraId(value);
                  setEmpreendimentoId('');
                  setFormData(prev => ({ ...prev, imovel_endereco: '', imovel_tipo: '' }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a construtora" />
                </SelectTrigger>
                <SelectContent>
                  {parceriasConstrutoras.map((p) => {
                    const constData = p.construtoras as any;
                    return (
                      <SelectItem key={p.construtora_id} value={p.construtora_id}>
                        {constData?.nome || 'Construtora'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedConstrutoraId && (
              <div className="space-y-2">
                <Label htmlFor="empreendimento-parceira">Empreendimento *</Label>
                <Select
                  value={empreendimentoId}
                  onValueChange={(value) => {
                    setEmpreendimentoId(value);
                    const emp = empreendimentosParceira.find(e => e.id === value);
                    if (emp) {
                      const isGenerico = emp.nome === 'Outro (Endereço Manual)';
                      if (isGenerico) {
                        setFormData(prev => ({ ...prev, imovel_endereco: '', imovel_tipo: '' }));
                      } else {
                        const endereco = [emp.endereco, emp.cidade, emp.estado].filter(Boolean).join(', ');
                        setFormData(prev => ({
                          ...prev,
                          imovel_endereco: endereco || emp.nome,
                          imovel_tipo: emp.tipo === 'residencial' ? 'Apartamento' : emp.tipo === 'comercial' ? 'Sala Comercial' : 'Outro',
                        }));
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={empreendimentosParceira.length === 0 ? "Nenhum empreendimento liberado" : "Selecione o empreendimento"} />
                  </SelectTrigger>
                  <SelectContent>
                    {empreendimentosParceira.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        <div className="flex flex-col">
                          <span>{emp.nome}</span>
                          {emp.endereco && (
                            <span className="text-xs text-muted-foreground">{emp.endereco}{emp.cidade ? `, ${emp.cidade}` : ''}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {empreendimentoId && (() => {
              const selectedEmp = empreendimentosParceira.find(e => e.id === empreendimentoId);
              const isGenerico = selectedEmp?.nome === 'Outro (Endereço Manual)';
              if (isGenerico) {
                return (
                    <div className="space-y-4">
                    <CepInput onAddressFound={(endereco) => setFormData({ ...formData, imovel_endereco: endereco })} />
                    <div className="space-y-2">
                      <Label htmlFor="imovel_endereco_parceira">Endereço completo *</Label>
                      <Input
                        id="imovel_endereco_parceira"
                        placeholder="Rua, número, bairro, cidade"
                        value={formData.imovel_endereco}
                        onChange={(e) => setFormData({ ...formData, imovel_endereco: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imovel_tipo_parceira">Tipo do imóvel *</Label>
                      <Select
                        value={formData.imovel_tipo}
                        onValueChange={(value) => setFormData({ ...formData, imovel_tipo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposImovel.map((tipo) => (
                            <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">O proprietário será preenchido automaticamente com os dados da construtora.</p>
                  </div>
                );
              }
              return (
                <div className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/30">
                  <p><strong>Endereço:</strong> {formData.imovel_endereco}</p>
                  <p><strong>Tipo:</strong> {formData.imovel_tipo}</p>
                  <p className="mt-2 text-xs">O proprietário será preenchido automaticamente com os dados da construtora.</p>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Construtora nativa: select empreendimento */}
      {isConstrutora && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Empreendimento</CardTitle>
                <CardDescription>Selecione o empreendimento</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="empreendimento">Empreendimento *</Label>
              <Select
                value={empreendimentoId}
                onValueChange={(value) => {
                  setEmpreendimentoId(value);
                  const emp = empreendimentos.find(e => e.id === value);
                  if (emp) {
                    const isGenerico = emp.nome === 'Outro (Endereço Manual)';
                    if (isGenerico) {
                      setFormData(prev => ({ ...prev, imovel_endereco: '', imovel_tipo: '' }));
                    } else {
                      const endereco = [emp.endereco, emp.cidade, emp.estado].filter(Boolean).join(', ');
                      setFormData(prev => ({
                        ...prev,
                        imovel_endereco: endereco || emp.nome,
                        imovel_tipo: emp.tipo === 'residencial' ? 'Apartamento' : emp.tipo === 'comercial' ? 'Sala Comercial' : 'Outro',
                      }));
                    }
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o empreendimento" />
                </SelectTrigger>
                <SelectContent>
                  {empreendimentos.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      <div className="flex flex-col">
                        <span>{emp.nome}</span>
                        {emp.endereco && (
                          <span className="text-xs text-muted-foreground">{emp.endereco}{emp.cidade ? `, ${emp.cidade}` : ''}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {empreendimentoId && (() => {
              const selectedEmp = empreendimentos.find(e => e.id === empreendimentoId);
              const isGenerico = selectedEmp?.nome === 'Outro (Endereço Manual)';
              if (isGenerico) {
                return (
                  <div className="space-y-4">
                    <CepInput onAddressFound={(endereco) => setFormData({ ...formData, imovel_endereco: endereco })} />
                    <div className="space-y-2">
                      <Label htmlFor="imovel_endereco">Endereço completo *</Label>
                      <Input
                        id="imovel_endereco"
                        placeholder="Rua, número, bairro, cidade"
                        value={formData.imovel_endereco}
                        onChange={(e) => setFormData({ ...formData, imovel_endereco: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imovel_tipo">Tipo do imóvel *</Label>
                      <Select
                        value={formData.imovel_tipo}
                        onValueChange={(value) => setFormData({ ...formData, imovel_tipo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposImovel.map((tipo) => (
                            <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              }
              return (
                <div className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/30">
                  <p><strong>Endereço:</strong> {formData.imovel_endereco}</p>
                  <p><strong>Tipo:</strong> {formData.imovel_tipo}</p>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </>
  );

  // ===== STEP: IMOVEL (imobiliária) =====
  const renderStepImovel = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-lg">Dados do Imóvel</CardTitle>
            <CardDescription>Informações sobre o imóvel visitado</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <CepInput onAddressFound={(endereco) => setFormData({ ...formData, imovel_endereco: endereco })} />
        <div className="space-y-2">
          <Label htmlFor="imovel_endereco">Endereço completo *</Label>
          <Input
            id="imovel_endereco"
            placeholder="Rua, número, bairro, cidade"
            value={formData.imovel_endereco}
            onChange={(e) => setFormData({ ...formData, imovel_endereco: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="imovel_tipo">Tipo do imóvel *</Label>
          <Select
            value={formData.imovel_tipo}
            onValueChange={(value) => setFormData({ ...formData, imovel_tipo: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {tiposImovel.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  // ===== STEP: PROPRIETARIO =====
  const renderStepProprietario = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
            <User className="h-5 w-5 text-secondary-foreground" />
          </div>
          <div>
            <CardTitle className="text-lg">Dados do Proprietário</CardTitle>
            <CardDescription>Informações do dono do imóvel</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
          <Checkbox 
            id="proprietario_autopreenchimento"
            checked={formData.proprietario_autopreenchimento}
            onCheckedChange={(checked) => setFormData({ 
              ...formData, 
              proprietario_autopreenchimento: checked === true,
              proprietario_nome: checked ? '' : formData.proprietario_nome,
              proprietario_cpf: checked ? '' : formData.proprietario_cpf
            })}
          />
          <label htmlFor="proprietario_autopreenchimento" className="text-sm cursor-pointer">
            <span className="font-medium">Deixar o proprietário preencher</span>
            <p className="text-xs text-muted-foreground">O proprietário preencherá nome e CPF ao confirmar a visita</p>
          </label>
        </div>

        {!formData.proprietario_autopreenchimento && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="proprietario_nome">Nome completo *</Label>
              <Input
                id="proprietario_nome"
                placeholder="Nome do proprietário"
                value={formData.proprietario_nome}
                onChange={(e) => setFormData({ ...formData, proprietario_nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proprietario_cpf">CPF</Label>
              <Input
                id="proprietario_cpf"
                placeholder="000.000.000-00"
                value={formData.proprietario_cpf}
                onChange={(e) => handleCPFChange('proprietario_cpf', e.target.value)}
                maxLength={14}
                className={!proprietarioCpfValid ? 'border-destructive' : ''}
              />
              {!proprietarioCpfValid && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  CPF inválido. Verifique os dígitos.
                </p>
              )}
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="proprietario_telefone">Telefone (WhatsApp) *</Label>
          <Input
            id="proprietario_telefone"
            placeholder="(00) 00000-0000"
            value={formData.proprietario_telefone}
            onChange={(e) => handlePhoneChange('proprietario_telefone', e.target.value)}
            maxLength={15}
          />
        </div>
      </CardContent>
    </Card>
  );

  // ===== STEP: COMPRADOR =====
  const renderStepComprador = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
            <Users className="h-5 w-5 text-secondary-foreground" />
          </div>
          <div>
            <CardTitle className="text-lg">Dados do Comprador/Visitante</CardTitle>
            <CardDescription>Informações do interessado no imóvel</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
          <Checkbox 
            id="comprador_autopreenchimento"
            checked={formData.comprador_autopreenchimento}
            onCheckedChange={(checked) => setFormData({ 
              ...formData, 
              comprador_autopreenchimento: checked === true,
              comprador_nome: checked ? '' : formData.comprador_nome,
              comprador_cpf: checked ? '' : formData.comprador_cpf
            })}
          />
          <label htmlFor="comprador_autopreenchimento" className="text-sm cursor-pointer">
            <span className="font-medium">Deixar o comprador preencher</span>
            <p className="text-xs text-muted-foreground">O comprador preencherá nome e CPF ao confirmar a visita</p>
          </label>
        </div>

        {!formData.comprador_autopreenchimento && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="comprador_nome">Nome completo *</Label>
              <Input
                id="comprador_nome"
                placeholder="Nome do comprador"
                value={formData.comprador_nome}
                onChange={(e) => setFormData({ ...formData, comprador_nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comprador_cpf">CPF</Label>
              <Input
                id="comprador_cpf"
                placeholder="000.000.000-00"
                value={formData.comprador_cpf}
                onChange={(e) => handleCPFChange('comprador_cpf', e.target.value)}
                maxLength={14}
                className={!compradorCpfValid ? 'border-destructive' : ''}
              />
              {!compradorCpfValid && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  CPF inválido. Verifique os dígitos.
                </p>
              )}
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="comprador_telefone">Telefone (WhatsApp) *</Label>
          <Input
            id="comprador_telefone"
            placeholder="(00) 00000-0000"
            value={formData.comprador_telefone}
            onChange={(e) => handlePhoneChange('comprador_telefone', e.target.value)}
            maxLength={15}
          />
        </div>
      </CardContent>
    </Card>
  );

  // ===== STEP: REVISAO =====
  const renderStepRevisao = () => {
    const empList = modoConstrutoraParceira ? empreendimentosParceira : empreendimentos;
    const selectedEmp = empList.find(e => e.id === empreendimentoId);

    return (
      <div className="space-y-4">
        {/* Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Resumo do Registro</CardTitle>
                <CardDescription>Revise os dados antes de criar</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Imóvel */}
            <div className="p-3 rounded-lg bg-muted/50 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Imóvel</p>
              {(isConstrutora || modoConstrutoraParceira) && selectedEmp && (
                <p className="text-sm"><strong>Empreendimento:</strong> {selectedEmp.nome}</p>
              )}
              <p className="text-sm"><strong>Endereço:</strong> {formData.imovel_endereco || '—'}</p>
              <p className="text-sm"><strong>Tipo:</strong> {formData.imovel_tipo || '—'}</p>
            </div>

            {/* Proprietário */}
            {showProprietario && (
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Proprietário</p>
                {formData.proprietario_autopreenchimento ? (
                  <p className="text-sm italic text-muted-foreground">Preenchimento pelo proprietário</p>
                ) : (
                  <>
                    <p className="text-sm"><strong>Nome:</strong> {formData.proprietario_nome || '—'}</p>
                    {formData.proprietario_cpf && <p className="text-sm"><strong>CPF:</strong> {formData.proprietario_cpf}</p>}
                  </>
                )}
                <p className="text-sm"><strong>Telefone:</strong> {formData.proprietario_telefone || '—'}</p>
              </div>
            )}

            {(isConstrutora || modoConstrutoraParceira) && (
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Proprietário</p>
                <p className="text-sm italic text-muted-foreground">Preenchido automaticamente (construtora)</p>
              </div>
            )}

            {/* Comprador */}
            {showComprador && (
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Comprador/Visitante</p>
                {formData.comprador_autopreenchimento ? (
                  <p className="text-sm italic text-muted-foreground">Preenchimento pelo comprador</p>
                ) : (
                  <>
                    <p className="text-sm"><strong>Nome:</strong> {formData.comprador_nome || '—'}</p>
                    {formData.comprador_cpf && <p className="text-sm"><strong>CPF:</strong> {formData.comprador_cpf}</p>}
                  </>
                )}
                <p className="text-sm"><strong>Telefone:</strong> {formData.comprador_telefone || '—'}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data e Observações */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                <Calendar className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Data e Observações</CardTitle>
                <CardDescription>Quando a visita aconteceu ou acontecerá</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data_visita">Data e hora da visita *</Label>
              <Input
                id="data_visita"
                type="datetime-local"
                value={formData.data_visita}
                onChange={(e) => setFormData({ ...formData, data_visita: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Anotações adicionais sobre a visita..."
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp toggle */}
        <Card className={`border-2 transition-colors ${enviarWhatsappAutomatico ? 'border-green-500/50 bg-green-500/5' : 'border-muted bg-muted/5'}`}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Switch
                id="enviar-whatsapp"
                checked={enviarWhatsappAutomatico}
                onCheckedChange={setEnviarWhatsappAutomatico}
              />
              <div className="flex-1 grid gap-1.5 leading-none">
                <label htmlFor="enviar-whatsapp" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  {enviarWhatsappAutomatico ? (
                    <MessageCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Send className="h-4 w-4 text-muted-foreground" />
                  )}
                  Envio automático via WhatsApp
                </label>
                <p className="text-sm text-muted-foreground">
                  {enviarWhatsappAutomatico ? (
                    modoCriacao === 'completo' 
                      ? 'Ao criar o registro, o código de confirmação será enviado automaticamente para o proprietário e o comprador.'
                      : modoCriacao === 'proprietario'
                        ? 'Ao criar o registro, o código de confirmação será enviado automaticamente para o proprietário.'
                        : 'Ao criar o registro, o código de confirmação será enviado automaticamente para o comprador.'
                  ) : (
                    'O código de confirmação não será enviado automaticamente. Você poderá enviar manualmente depois.'
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ===== RENDER CURRENT STEP =====
  const renderCurrentStep = () => {
    switch (currentStepId) {
      case 'modo': return renderStepModo();
      case 'empreendimento': return renderStepEmpreendimento();
      case 'imovel': return renderStepImovel();
      case 'proprietario': return renderStepProprietario();
      case 'comprador': return renderStepComprador();
      case 'revisao': return renderStepRevisao();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <MobileHeader
        title={modoConstrutoraParceira ? "Registro Construtora" : "Novo Registro de Visita"}
        subtitle={modoConstrutoraParceira ? "Crie fichas para empreendimentos parceiros" : "Preencha os dados da visita"}
        backPath="/fichas"
      />

      <main className="container mx-auto px-4 py-4 md:py-8 max-w-3xl">
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* Progress indicator */}
          {renderProgressIndicator()}

          {/* Current step content */}
          {renderCurrentStep()}

          {/* Navigation buttons */}
          <div className="sticky bottom-20 md:static bg-background pt-4 pb-2 md:py-0 -mx-4 px-4 md:mx-0 border-t md:border-0" data-tour="ficha-nav-buttons">
            <div className="flex gap-3 md:gap-4 justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={isFirstStep ? () => navigate('/fichas') : handleBack}
                className="flex-1 md:flex-none h-12 md:h-10"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {isFirstStep ? 'Cancelar' : 'Voltar'}
              </Button>

              {isLastStep ? (
                <Button 
                  type="button" 
                  onClick={handleSubmit} 
                  disabled={isSubmitting} 
                  className="gap-2 flex-1 md:flex-none h-12 md:h-10"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="hidden sm:inline">Criando e enviando...</span>
                      <span className="sm:hidden">Criando...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Criar Registro
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  type="button" 
                  onClick={handleNext}
                  className="gap-2 flex-1 md:flex-none h-12 md:h-10"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </main>

      <MobileNav />
      <OnboardingTour steps={NOVA_FICHA_TOUR_STEPS} storageKey="visitaprova-novaficha-tour-done" />
    </div>
  );
}
