import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import { APP_URL, OTP_URL } from '@/lib/appConfig';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, 
  Building2, 
  User, 
  Users, 
  Calendar, 
  CheckCircle,
  Clock,
  Copy,
  Loader2,
  Send,
  MessageCircle,
  AlertCircle,
  FileDown,
  Shield,
  MapPin,
  Fingerprint,
  Trash2,
  Plus,
  AlertTriangle,
  UserPlus,
  Share2,
  Pencil,
  X,
  Save,
  Check,
  ChevronsUpDown,
  RefreshCw,
  PartyPopper
} from 'lucide-react';
import { MarcarVendaDialog } from '@/components/MarcarVendaDialog';
import { useEquipeLider } from '@/hooks/useEquipeLider';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { validateCPF, formatCPF as formatCPFLib } from '@/lib/cpf';
import { SurveySection } from '@/components/SurveySection';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  pendente: { label: 'Pendente', variant: 'secondary', icon: Clock },
  aguardando_comprador: { label: 'Aguardando Comprador', variant: 'outline', icon: Clock },
  aguardando_proprietario: { label: 'Aguardando Proprietário', variant: 'outline', icon: Clock },
  completo: { label: 'Confirmado', variant: 'default', icon: CheckCircle },
  finalizado_parcial: { label: 'Finalizado (Parcial)', variant: 'outline', icon: CheckCircle },
  expirado: { label: 'Expirado', variant: 'destructive', icon: Clock },
};

export default function DetalhesFicha() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { role, imobiliariaId } = useUserRole();
  const { isLider } = useEquipeLider();
  const { toast } = useToast();
  
  // Dynamic return URL based on user role
  const getFichasListUrl = (params?: string) => {
    const baseUrl = role === 'super_admin' 
      ? '/admin/fichas'
      : role === 'imobiliaria_admin'
        ? '/empresa/fichas'
        : '/fichas';
    return params ? `${baseUrl}?${params}` : baseUrl;
  };
  const { playNotificationSound } = useNotificationSound();
  const previousStatusRef = useRef<string | null>(null);
  const queryClient = useQueryClient();
  
  const [sendingOtp, setSendingOtp] = useState<'proprietario' | 'comprador' | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [regeneratingBackup, setRegeneratingBackup] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [finalizingPartial, setFinalizingPartial] = useState(false);
  const [retryingOtp, setRetryingOtp] = useState<string | null>(null);
  const [lastOtpResult, setLastOtpResult] = useState<{
    tipo: string;
    simulation: boolean;
    codigo?: string;
    verification_url?: string;
  } | null>(null);

  // Rate limit state for OTP buttons (stores remaining SECONDS for precise countdown)
  const RATE_LIMIT_MINUTES = 30;
  const [rateLimitProprietario, setRateLimitProprietario] = useState<number | null>(null);
  const [rateLimitComprador, setRateLimitComprador] = useState<number | null>(null);
  
  // Helper to format seconds as MM:SS
  const formatRateLimitTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // State for completing missing party data
  const [showCompletarProprietario, setShowCompletarProprietario] = useState(false);
  const [showCompletarComprador, setShowCompletarComprador] = useState(false);
  const [completarProprietarioData, setCompletarProprietarioData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    autopreenchimento: false,
  });
  const [completarCompradorData, setCompletarCompradorData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    autopreenchimento: false,
  });
  const [savingCompletarData, setSavingCompletarData] = useState(false);

  // State for partner invite
  const [showConvidarParceiro, setShowConvidarParceiro] = useState(false);
  const [telefoneParceiro, setTelefoneParceiro] = useState('');
  const [enviandoConvite, setEnviandoConvite] = useState(false);
  const [modoConvite, setModoConvite] = useState<'selecionar' | 'digitar'>('selecionar');
  const [corretorSelecionado, setCorretorSelecionado] = useState<string | null>(null);
  const [parceiroExterno, setParceiroExterno] = useState(false);
  const [corretorPopoverOpen, setCorretorPopoverOpen] = useState(false);

  // State for editing existing phone numbers
  const [editandoProprietario, setEditandoProprietario] = useState(false);
  const [editandoComprador, setEditandoComprador] = useState(false);
  const [editProprietarioData, setEditProprietarioData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
  });
  const [editCompradorData, setEditCompradorData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
  });
  const [savingEditData, setSavingEditData] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const { data: ficha, isLoading, refetch } = useQuery({
    queryKey: ['ficha', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('fichas_visita')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  // Buscar feature flag de pesquisa baseada na imobiliaria_id da FICHA (não do usuário logado)
  const { data: surveyFeatureData } = useQuery({
    queryKey: ['ficha-survey-feature', ficha?.imobiliaria_id],
    queryFn: async () => {
      if (!ficha?.imobiliaria_id) return { enabled: false };
      
      const { data, error } = await supabase
        .from('imobiliaria_feature_flags')
        .select('enabled')
        .eq('imobiliaria_id', ficha.imobiliaria_id)
        .eq('feature_key', 'post_visit_survey')
        .maybeSingle();
      
      if (error) {
        console.error('Erro ao buscar feature flag da ficha:', error);
        return { enabled: false };
      }
      
      return { enabled: data?.enabled ?? false };
    },
    enabled: !!ficha?.imobiliaria_id,
  });

  const surveyFeatureEnabled = surveyFeatureData?.enabled ?? false;
  useEffect(() => {
    if (!id || !user) return;

    const channel = supabase
      .channel(`ficha-otp-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'fichas_visita',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          const newData = payload.new as { status: string; proprietario_confirmado_em: string | null; comprador_confirmado_em: string | null };
          const oldData = payload.old as { proprietario_confirmado_em: string | null; comprador_confirmado_em: string | null };
          
          // Verificar se houve nova confirmação
          const novaConfirmacaoProprietario = newData.proprietario_confirmado_em && !oldData.proprietario_confirmado_em;
          const novaConfirmacaoComprador = newData.comprador_confirmado_em && !oldData.comprador_confirmado_em;
          
          if (novaConfirmacaoProprietario || novaConfirmacaoComprador) {
            playNotificationSound('success');
            toast({
              title: '🎉 Confirmação recebida!',
              description: novaConfirmacaoProprietario 
                ? 'O proprietário confirmou a visita.' 
                : 'O comprador confirmou a visita.',
            });
            // Atualizar dados da ficha
            refetch();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user, playNotificationSound, toast, refetch]);

  // Fetch legal acceptance data
  const { data: confirmacoes } = useQuery({
    queryKey: ['confirmacoes', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('confirmacoes_otp')
        .select('*')
        .eq('ficha_id', id)
        .eq('confirmado', true);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id && (ficha?.status === 'completo' || ficha?.status === 'finalizado_parcial'),
  });

  // Fetch external partner data
  const { data: conviteParceiro } = useQuery({
    queryKey: ['convite-parceiro', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('convites_parceiro')
        .select('parceiro_nome, parceiro_cpf, parceiro_creci, parceiro_imobiliaria, permite_externo, status')
        .eq('ficha_id', id)
        .eq('status', 'aceito')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id && !!ficha?.corretor_parceiro_id,
  });

  const confirmacaoProprietario = confirmacoes?.find(c => c.tipo === 'proprietario');
  const confirmacaoComprador = confirmacoes?.find(c => c.tipo === 'comprador');

  // Fetch last OTPs for rate limit display (only for corretor role)
  const { data: lastOtps, refetch: refetchOtps } = useQuery({
    queryKey: ['last-otps', id, role],
    queryFn: async () => {
      if (!id || role !== 'corretor') return null;
      
      const thirtyMinutesAgo = new Date(Date.now() - RATE_LIMIT_MINUTES * 60 * 1000);
      
      const { data, error } = await supabase
        .from('confirmacoes_otp')
        .select('tipo, created_at')
        .eq('ficha_id', id)
        .gte('created_at', thirtyMinutesAgo.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id && role === 'corretor',
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch OTP queue items for this ficha
  const { data: otpQueueItems, refetch: refetchOtpQueue } = useQuery({
    queryKey: ['otp-queue', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('otp_queue')
        .select('*')
        .eq('ficha_id', id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
    refetchInterval: 10000, // Refetch every 10 seconds to show status updates
  });

  // Get failed OTP queue items
  const failedOtpItems = otpQueueItems?.filter(item => item.status === 'falhou') || [];
  const pendingOtpItems = otpQueueItems?.filter(item => item.status === 'pendente' || item.status === 'processando') || [];

  // Calculate rate limit remaining time (in SECONDS for precise countdown)
  useEffect(() => {
    if (role !== 'corretor' || !lastOtps) {
      setRateLimitProprietario(null);
      setRateLimitComprador(null);
      return;
    }

    const calculateRemainingSeconds = (tipo: string): number | null => {
      const lastOtp = lastOtps.find(otp => otp.tipo === tipo);
      if (!lastOtp) return null;
      
      const lastSentTime = new Date(lastOtp.created_at).getTime();
      const nextAvailable = lastSentTime + RATE_LIMIT_MINUTES * 60 * 1000;
      const remainingMs = nextAvailable - Date.now();
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      
      return remainingSeconds > 0 ? remainingSeconds : null;
    };

    const updateLimits = () => {
      setRateLimitProprietario(calculateRemainingSeconds('proprietario'));
      setRateLimitComprador(calculateRemainingSeconds('comprador'));
    };

    updateLimits();
    
    // Update every second for smooth countdown
    const interval = setInterval(updateLimits, 1000);
    
    return () => clearInterval(interval);
  }, [lastOtps, role]);

  // Fetch corretores da mesma imobiliária para seleção no convite de parceiro
  const { data: corretoresImobiliaria } = useQuery({
    queryKey: ['corretores-imobiliaria', imobiliariaId],
    queryFn: async () => {
      if (!imobiliariaId) return [];
      
      // Buscar user_ids dos corretores da mesma imobiliária
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('imobiliaria_id', imobiliariaId)
        .eq('role', 'corretor')
        .neq('user_id', user?.id);
      
      if (rolesError) throw rolesError;
      if (!rolesData || rolesData.length === 0) return [];

      const userIds = rolesData.map(r => r.user_id);

      // Buscar perfis desses usuários
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, nome, telefone, creci')
        .in('user_id', userIds)
        .eq('ativo', true);
      
      if (profilesError) throw profilesError;
      return profilesData || [];
    },
    enabled: !!imobiliariaId && !!user,
  });

  // Check if party data is missing
  const proprietarioFaltando = !ficha?.proprietario_telefone;
  const compradorFaltando = !ficha?.comprador_telefone;

  const formatPhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    return phone;
  };

  const formatPhoneInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const formatCPF = (cpf: string | null) => {
    if (!cpf) return '-';
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length === 11) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
    }
    return cpf;
  };

  const copyProtocolo = () => {
    if (ficha?.protocolo) {
      navigator.clipboard.writeText(ficha.protocolo);
      toast({
        title: 'Protocolo copiado!',
        description: ficha.protocolo,
      });
    }
  };

  const sendOtp = async (tipo: 'proprietario' | 'comprador') => {
    if (!ficha) return;
    
    setSendingOtp(tipo);
    setLastOtpResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { ficha_id: ficha.id, tipo, app_url: OTP_URL },
      });

      // Handle rate limit - check both data and error context
      if (data?.rate_limited) {
        toast({
          variant: 'destructive',
          title: 'Aguarde para reenviar',
          description: `Você poderá enviar novamente em ${data.minutes_remaining} minuto${data.minutes_remaining > 1 ? 's' : ''}.`,
        });
        refetchOtps();
        return;
      }

      // When Edge Function returns non-2xx, error is set but data may still contain info
      if (error) {
        // Check if it's a rate limit error (429)
        const errorMessage = error.message || '';
        if (errorMessage.includes('non-2xx') || errorMessage.includes('429')) {
          toast({
            variant: 'destructive',
            title: 'Aguarde para reenviar',
            description: 'Você já enviou um código recentemente. Aguarde alguns minutos antes de tentar novamente.',
          });
          refetchOtps();
          return;
        }
        
        toast({
          variant: 'destructive',
          title: 'Erro ao enviar OTP',
          description: data?.error || error.message || 'Erro desconhecido',
        });
        return;
      }

      if (data?.error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao enviar OTP',
          description: data.error,
        });
        return;
      }

      setLastOtpResult({
        tipo,
        simulation: data.simulation,
        codigo: data.codigo,
        verification_url: data.verification_url,
      });

      if (data.simulation) {
        toast({
          title: 'OTP gerado (modo simulação)',
          description: `Código: ${data.codigo}. Configure a API do WhatsApp para envio real.`,
        });
      } else {
        toast({
          title: 'OTP enviado!',
          description: `Código enviado para ${tipo === 'proprietario' ? 'o proprietário' : 'o comprador'} via WhatsApp.`,
        });
      }

      // Refresh ficha data and rate limit info
      refetch();
      refetchOtps();
      
    } catch (err) {
      // Catch-all for unexpected errors
      const errMessage = err instanceof Error ? err.message : '';
      if (errMessage.includes('non-2xx') || errMessage.includes('429')) {
        toast({
          variant: 'destructive',
          title: 'Aguarde para reenviar',
          description: 'Você já enviou um código recentemente. Aguarde alguns minutos antes de tentar novamente.',
        });
        refetchOtps();
        return;
      }
      
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao enviar OTP',
      });
    } finally {
      setSendingOtp(null);
    }
  };

  const openWhatsApp = (phone: string, message: string) => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/55${phone}?text=${encodedMessage}`, '_blank');
  };

  const sendManualWhatsApp = (tipo: 'proprietario' | 'comprador') => {
    if (!ficha || !lastOtpResult || lastOtpResult.tipo !== tipo) return;
    
    const phone = tipo === 'proprietario' ? ficha.proprietario_telefone : ficha.comprador_telefone;
    const nome = tipo === 'proprietario' ? ficha.proprietario_nome : ficha.comprador_nome;
    
    if (!phone) return;
    
    const message = `🏠 *Confirmação de Visita*\n\nOlá ${nome}!\n\nVocê está confirmando uma visita ao imóvel:\n📍 ${ficha.imovel_endereco}\n\nSeu código de confirmação é:\n\n🔐 *${lastOtpResult.codigo}*\n\nOu acesse o link:\n${lastOtpResult.verification_url}\n\n⏰ Este código expira em 30 minutos.`;
    
    openWhatsApp(phone, message);
  };

  const downloadPdf = async (forcePartial = false) => {
    if (!ficha) return;
    
    setDownloadingPdf(true);
    try {
      // Use fetch directly to get binary response (supabase.functions.invoke parses as JSON by default)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({ 
          ficha_id: ficha.id, 
          app_url: APP_URL, 
          force_partial: forcePartial 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro ao gerar PDF' }));
        toast({
          variant: 'destructive',
          title: 'Erro ao gerar PDF',
          description: errorData.error || 'Erro desconhecido',
        });
        return;
      }

      // Get as ArrayBuffer to preserve binary data
      const arrayBuffer = await response.arrayBuffer();
      
      // Create blob and download
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comprovante-${ficha.protocolo}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'PDF gerado com sucesso!',
        description: forcePartial ? 'O comprovante parcial foi baixado.' : 'O comprovante foi baixado.',
      });
    } catch (err) {
      console.error('Erro ao baixar PDF:', err);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao gerar PDF',
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const regenerateBackup = async () => {
    if (!ficha) return;
    
    setRegeneratingBackup(true);
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-backup', {
        body: { ficha_id: ficha.id },
      });

      if (error || data?.error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao regenerar backup',
          description: error?.message || data?.error || 'Erro desconhecido',
        });
        return;
      }

      toast({
        title: 'Backup regenerado com sucesso!',
        description: 'O comprovante foi salvo no armazenamento.',
      });

      // Refresh ficha data to update backup_gerado_em
      refetch();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao regenerar backup',
      });
    } finally {
      setRegeneratingBackup(false);
    }
  };

  const handleFinalizarParcial = async () => {
    if (!ficha) return;
    
    setFinalizingPartial(true);
    try {
      // Update status to finalizado_parcial
      const { error } = await supabase
        .from('fichas_visita')
        .update({ status: 'finalizado_parcial' })
        .eq('id', ficha.id);

      if (error) throw error;

      // Generate and download PDF
      await downloadPdf(true);
      
      // Gerar backup automático após finalização parcial
      try {
        console.log('Gerando backup automático após finalização parcial...');
        const { error: backupError } = await supabase.functions.invoke('regenerate-backup', {
          body: { ficha_id: ficha.id },
        });
        
        if (backupError) {
          console.error('Erro ao gerar backup automático:', backupError);
        } else {
          console.log('Backup automático gerado com sucesso');
        }
      } catch (backupErr) {
        console.error('Erro ao chamar regenerate-backup:', backupErr);
      }
      
      queryClient.invalidateQueries({ queryKey: ['fichas'] });

      toast({
        title: 'Registro finalizado',
        description: 'O registro foi finalizado com assinatura parcial e o backup foi gerado.',
      });

      // Redirecionar para lista de finalizados
      navigate(getFichasListUrl('status=completo'));
    } catch (err) {
      console.error('Erro ao finalizar parcialmente:', err);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao finalizar a ficha',
      });
    } finally {
      setFinalizingPartial(false);
    }
  };

  // Retry failed OTP queue item
  const handleRetryOtp = async (queueItemId: string, tipo: string) => {
    if (!ficha || !user) return;
    
    setRetryingOtp(queueItemId);
    try {
      // Delete the failed item
      await supabase
        .from('otp_queue')
        .delete()
        .eq('id', queueItemId);

      // Re-queue with high priority
      const { error: insertError } = await supabase
        .from('otp_queue')
        .insert({
          ficha_id: ficha.id,
          tipo,
          app_url: APP_URL,
          user_id: user.id,
          prioridade: 10,
          status: 'pendente',
          tentativas: 0,
        });

      if (insertError) throw insertError;

      // Trigger immediate processing
      supabase.functions.invoke('process-otp-queue').catch(err => {
        console.log('Processamento da fila iniciado em background:', err);
      });

      toast({
        title: 'Reenvio agendado',
        description: `O código será reenviado para o ${tipo === 'proprietario' ? 'proprietário' : 'comprador'} em instantes.`,
      });

      refetchOtpQueue();
    } catch (err) {
      console.error('Erro ao reagendar OTP:', err);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao reagendar o envio do OTP',
      });
    } finally {
      setRetryingOtp(null);
    }
  };

  const handleSaveCompletarData = async (tipo: 'proprietario' | 'comprador') => {
    if (!ficha) return;

    const data = tipo === 'proprietario' ? completarProprietarioData : completarCompradorData;
    
    // Validate
    if (!data.telefone || data.telefone.replace(/\D/g, '').length < 10) {
      toast({
        variant: 'destructive',
        title: 'Erro de validação',
        description: 'Telefone é obrigatório',
      });
      return;
    }

    if (!data.autopreenchimento && (!data.nome || data.nome.length < 2)) {
      toast({
        variant: 'destructive',
        title: 'Erro de validação',
        description: 'Nome é obrigatório',
      });
      return;
    }

    if (data.cpf && !validateCPF(data.cpf)) {
      toast({
        variant: 'destructive',
        title: 'Erro de validação',
        description: 'CPF inválido',
      });
      return;
    }

    setSavingCompletarData(true);
    try {
      const updateData = tipo === 'proprietario' 
        ? {
            proprietario_telefone: data.telefone.replace(/\D/g, ''),
            proprietario_nome: data.autopreenchimento ? null : data.nome,
            proprietario_cpf: data.cpf || null,
            proprietario_autopreenchimento: data.autopreenchimento,
          }
        : {
            comprador_telefone: data.telefone.replace(/\D/g, ''),
            comprador_nome: data.autopreenchimento ? null : data.nome,
            comprador_cpf: data.cpf || null,
            comprador_autopreenchimento: data.autopreenchimento,
          };

      const { error } = await supabase
        .from('fichas_visita')
        .update(updateData)
        .eq('id', ficha.id);

      if (error) throw error;

      // Refresh data
      await refetch();

      // Close form
      if (tipo === 'proprietario') {
        setShowCompletarProprietario(false);
        setCompletarProprietarioData({ nome: '', cpf: '', telefone: '', autopreenchimento: false });
      } else {
        setShowCompletarComprador(false);
        setCompletarCompradorData({ nome: '', cpf: '', telefone: '', autopreenchimento: false });
      }

      toast({
        title: 'Dados salvos!',
        description: `Dados do ${tipo === 'proprietario' ? 'proprietário' : 'comprador'} foram adicionados.`,
      });

      // Ask if user wants to send OTP now
      setTimeout(() => {
        sendOtp(tipo);
      }, 500);

    } catch (err) {
      console.error('Erro ao salvar dados:', err);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao salvar os dados',
      });
    } finally {
      setSavingCompletarData(false);
    }
  };

  const handleStartEdit = (tipo: 'proprietario' | 'comprador') => {
    if (!ficha) return;
    
    if (tipo === 'proprietario') {
      setEditProprietarioData({
        nome: ficha.proprietario_nome || '',
        cpf: ficha.proprietario_cpf || '',
        telefone: formatPhoneInput(ficha.proprietario_telefone || ''),
      });
      setEditandoProprietario(true);
    } else {
      setEditCompradorData({
        nome: ficha.comprador_nome || '',
        cpf: ficha.comprador_cpf || '',
        telefone: formatPhoneInput(ficha.comprador_telefone || ''),
      });
      setEditandoComprador(true);
    }
  };

  const handleCancelEdit = (tipo: 'proprietario' | 'comprador') => {
    if (tipo === 'proprietario') {
      setEditandoProprietario(false);
      setEditProprietarioData({ nome: '', cpf: '', telefone: '' });
    } else {
      setEditandoComprador(false);
      setEditCompradorData({ nome: '', cpf: '', telefone: '' });
    }
  };

  const handleSaveEditData = async (tipo: 'proprietario' | 'comprador') => {
    if (!ficha) return;

    const data = tipo === 'proprietario' ? editProprietarioData : editCompradorData;
    
    // Validate phone
    if (!data.telefone || data.telefone.replace(/\D/g, '').length < 10) {
      toast({
        variant: 'destructive',
        title: 'Erro de validação',
        description: 'Telefone é obrigatório e deve ter pelo menos 10 dígitos',
      });
      return;
    }

    if (data.cpf && !validateCPF(data.cpf)) {
      toast({
        variant: 'destructive',
        title: 'Erro de validação',
        description: 'CPF inválido',
      });
      return;
    }

    setSavingEditData(true);
    try {
      const updateData = tipo === 'proprietario' 
        ? {
            proprietario_telefone: data.telefone.replace(/\D/g, ''),
            proprietario_nome: data.nome || null,
            proprietario_cpf: data.cpf || null,
          }
        : {
            comprador_telefone: data.telefone.replace(/\D/g, ''),
            comprador_nome: data.nome || null,
            comprador_cpf: data.cpf || null,
          };

      const { error } = await supabase
        .from('fichas_visita')
        .update(updateData)
        .eq('id', ficha.id);

      if (error) throw error;

      // Refresh data
      await refetch();

      // Close edit mode
      handleCancelEdit(tipo);

      toast({
        title: 'Dados atualizados!',
        description: `Dados do ${tipo === 'proprietario' ? 'proprietário' : 'comprador'} foram atualizados. Deseja reenviar o código de confirmação?`,
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => sendOtp(tipo)}
          >
            Reenviar OTP
          </Button>
        ),
      });

    } catch (err) {
      console.error('Erro ao salvar dados:', err);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao salvar os dados',
      });
    } finally {
      setSavingEditData(false);
    }
  };

  const handleDelete = async () => {
    if (!ficha) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('fichas_visita')
        .delete()
        .eq('id', ficha.id);

      if (error) throw error;

      toast({
        title: 'Registro excluído',
        description: 'O registro foi excluído com sucesso.',
      });

      queryClient.invalidateQueries({ queryKey: ['fichas'] });
      navigate(getFichasListUrl());
    } catch (err) {
      console.error('Erro ao excluir:', err);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao excluir a ficha',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleEnviarConviteParceiro = async () => {
    if (!ficha || !telefoneParceiro) return;

    const parteFaltante = proprietarioFaltando ? 'proprietario' : 'comprador';
    
    setEnviandoConvite(true);
    try {
      const { data, error } = await supabase.functions.invoke('enviar-convite-parceiro', {
        body: {
          ficha_id: ficha.id,
          telefone_parceiro: telefoneParceiro.replace(/\D/g, ''),
          parte_faltante: parteFaltante,
          app_url: APP_URL,
          permite_externo: parceiroExterno,
        },
      });

      if (error || data.error) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: data?.error || error?.message || 'Erro ao enviar convite',
        });
        return;
      }

      toast({
        title: data.parceiro_encontrado ? 'Convite enviado!' : 'Convite criado',
        description: data.message,
      });

      setShowConvidarParceiro(false);
      setTelefoneParceiro('');
      setModoConvite('selecionar');
      setCorretorSelecionado(null);
      setParceiroExterno(false);
      refetch();
    } catch (err) {
      console.error('Erro ao enviar convite:', err);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao enviar convite',
      });
    } finally {
      setEnviandoConvite(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ficha) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Registro não encontrado</p>
        <Button onClick={() => navigate('/dashboard')}>Voltar ao Dashboard</Button>
      </div>
    );
  }

  const status = statusConfig[ficha.status] || statusConfig.pendente;
  const StatusIcon = status.icon;

  // Check if can finalize partially (at least one confirmation)
  const temAlgumaConfirmacao = ficha.proprietario_confirmado_em || ficha.comprador_confirmado_em;
  const ambasConfirmadas = ficha.proprietario_confirmado_em && ficha.comprador_confirmado_em;
  const podeFinalizarParcial = temAlgumaConfirmacao && !ambasConfirmadas && ficha.status !== 'completo' && ficha.status !== 'finalizado_parcial';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(getFichasListUrl())}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-xl font-bold">Registro #{ficha.protocolo}</h1>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyProtocolo}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Criada em {format(new Date(ficha.created_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={status.variant} className="gap-1">
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
              {ficha.status !== 'completo' && ficha.status !== 'finalizado_parcial' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir registro</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir o registro #{ficha.protocolo}? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete}
                        disabled={deleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          {/* Status Card */}
          <Card className={(ficha.status === 'completo' || ficha.status === 'finalizado_parcial') ? 'border-success/50 bg-success/5' : ''}>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex items-center gap-3">
                  {ficha.proprietario_confirmado_em ? (
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">Proprietário confirmou</span>
                    </div>
                  ) : proprietarioFaltando ? (
                    <div className="flex items-center gap-2 text-amber-500">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="text-sm">Proprietário não preenchido</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-5 w-5" />
                      <span className="text-sm">Aguardando proprietário</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {ficha.comprador_confirmado_em ? (
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">Comprador confirmou</span>
                    </div>
                  ) : compradorFaltando ? (
                    <div className="flex items-center gap-2 text-amber-500">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="text-sm">Comprador não preenchido</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-5 w-5" />
                      <span className="text-sm">Aguardando comprador</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* OTP Queue Status - Pending items */}
          {pendingOtpItems.length > 0 && (
            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <div>
                    <h3 className="font-semibold text-foreground">Enviando código de confirmação...</h3>
                    <p className="text-sm text-muted-foreground">
                      {pendingOtpItems.map(item => 
                        item.tipo === 'proprietario' ? 'Proprietário' : 'Comprador'
                      ).join(' e ')} - aguardando envio via WhatsApp
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* OTP Queue Status - Failed items */}
          {failedOtpItems.length > 0 && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <h3 className="font-semibold text-foreground">Falha no envio do código</h3>
                    <p className="text-sm text-muted-foreground">
                      Houve um problema ao enviar o código de confirmação via WhatsApp
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {failedOtpItems.map(item => (
                    <div 
                      key={item.id} 
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg bg-background border"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {item.tipo === 'proprietario' ? 'Proprietário' : 'Comprador'}
                        </p>
                        {item.ultimo_erro && (
                          <p className="text-xs text-muted-foreground">
                            Erro: {item.ultimo_erro}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Tentativas: {item.tentativas}/3
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                        onClick={() => handleRetryOtp(item.id, item.tipo)}
                        disabled={retryingOtp === item.id}
                      >
                        {retryingOtp === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Tentar Novamente
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Marcar como Vendido - para fichas completas/finalizadas */}
          {(ficha.status === 'completo' || ficha.status === 'finalizado_parcial') && 
           (role === 'corretor' && ficha.user_id === user?.id || 
            role === 'imobiliaria_admin' || 
            role === 'super_admin' ||
            isLider) && (
            <Card className={ficha.convertido_venda ? 'border-success/50 bg-success/5' : 'border-amber-500/30 bg-amber-500/5'}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg ${ficha.convertido_venda ? 'bg-success/10' : 'bg-amber-500/10'} flex items-center justify-center`}>
                      <PartyPopper className={`h-5 w-5 ${ficha.convertido_venda ? 'text-success' : 'text-amber-500'}`} />
                    </div>
                    <div>
                      {ficha.convertido_venda ? (
                        <>
                          <h3 className="font-semibold text-success">Venda Registrada!</h3>
                          <p className="text-sm text-muted-foreground">
                            {ficha.valor_venda 
                              ? `Valor: ${ficha.valor_venda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
                              : 'Este registro foi convertido em venda'}
                          </p>
                        </>
                      ) : (
                        <>
                          <h3 className="font-semibold text-foreground">Conversão em Venda</h3>
                          <p className="text-sm text-muted-foreground">
                            Este imóvel foi vendido? Marque para registrar a conversão
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <MarcarVendaDialog
                    fichaId={ficha.id}
                    protocolo={ficha.protocolo}
                    jaVendida={ficha.convertido_venda}
                    valorVenda={ficha.valor_venda}
                    convertidoEm={ficha.convertido_em}
                    onVendaRegistrada={refetch}
                  >
                    <Button
                      variant={ficha.convertido_venda ? 'outline' : 'default'}
                      className={ficha.convertido_venda 
                        ? 'gap-2 min-w-[180px] border-success/50 text-success hover:bg-success/10' 
                        : 'gap-2 min-w-[180px]'}
                    >
                      <PartyPopper className="h-4 w-4" />
                      {ficha.convertido_venda ? 'Ver Detalhes' : 'Marcar como Vendido'}
                    </Button>
                  </MarcarVendaDialog>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Download PDF - when complete or finalized partial */}
          {(ficha.status === 'completo' || ficha.status === 'finalizado_parcial') && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-foreground">Comprovante Disponível</h3>
                    <p className="text-sm text-muted-foreground">
                      {ficha.status === 'finalizado_parcial' 
                        ? 'Registro finalizado com assinatura parcial. Baixe o comprovante.'
                        : 'Ambas as partes confirmaram. Baixe o comprovante com QR code de verificação.'}
                    </p>
                  </div>
                  <Button 
                    onClick={() => downloadPdf(ficha.status === 'finalizado_parcial')}
                    disabled={downloadingPdf}
                    className="gap-2 min-w-[180px]"
                  >
                    {downloadingPdf ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="h-4 w-4" />
                    )}
                    Baixar Comprovante PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alerta de Backup Faltante - apenas para super_admin */}
          {role === 'super_admin' && (ficha.status === 'completo' || ficha.status === 'finalizado_parcial') && !ficha.backup_gerado_em && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Backup não gerado
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      O backup automático deste registro falhou. Clique para regenerar.
                    </p>
                  </div>
                  <Button 
                    onClick={regenerateBackup}
                    disabled={regeneratingBackup}
                    variant="outline"
                    className="gap-2 min-w-[180px] border-destructive/50 text-destructive hover:bg-destructive/10"
                  >
                    {regeneratingBackup ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Regenerar Backup
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Finalizar Parcialmente */}
          {podeFinalizarParcial && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Finalizar com assinatura parcial
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Apenas {ficha.proprietario_confirmado_em ? 'o proprietário' : 'o comprador'} confirmou. 
                      Você pode gerar o comprovante mesmo assim.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline"
                        className="gap-2 min-w-[180px] border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                        disabled={finalizingPartial}
                      >
                        {finalizingPartial ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Finalizar Parcialmente
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Finalizar com assinatura parcial?</AlertDialogTitle>
                        <AlertDialogDescription>
                          O comprovante será gerado apenas com a confirmação de {ficha.proprietario_confirmado_em ? 'o proprietário' : 'o comprador'}. 
                          O PDF indicará claramente que apenas uma parte confirmou.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleFinalizarParcial}>
                          Finalizar e Baixar PDF
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enviar para Corretor Parceiro */}
          {(proprietarioFaltando || compradorFaltando) && ficha.status !== 'completo' && ficha.status !== 'finalizado_parcial' && !ficha.corretor_parceiro_id && (
            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Share2 className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Enviar para Corretor Parceiro</h3>
                      <p className="text-sm text-muted-foreground">
                        Convide outro corretor para preencher os dados do {proprietarioFaltando ? 'proprietário' : 'comprador'}
                      </p>
                    </div>
                  </div>
                  
                  {!showConvidarParceiro ? (
                    <Button
                      variant="outline"
                      onClick={() => setShowConvidarParceiro(true)}
                      className="gap-2 border-blue-500/50 text-blue-600 hover:bg-blue-500/10"
                    >
                      <UserPlus className="h-4 w-4" />
                      Convidar Parceiro
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      {/* Seletor de modo - só mostra se houver corretores na imobiliária */}
                      {corretoresImobiliaria && corretoresImobiliaria.length > 0 && (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={modoConvite === 'selecionar' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setModoConvite('selecionar');
                              setTelefoneParceiro('');
                              setCorretorSelecionado(null);
                            }}
                          >
                            Selecionar da equipe
                          </Button>
                          <Button
                            type="button"
                            variant={modoConvite === 'digitar' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setModoConvite('digitar');
                              setTelefoneParceiro('');
                              setCorretorSelecionado(null);
                            }}
                          >
                            Digitar telefone
                          </Button>
                        </div>
                      )}

                      {/* Modo selecionar - combobox com busca */}
                      {modoConvite === 'selecionar' && corretoresImobiliaria && corretoresImobiliaria.length > 0 && (
                        <div className="space-y-2">
                          <Label>Selecione um corretor da equipe</Label>
                          <Popover open={corretorPopoverOpen} onOpenChange={setCorretorPopoverOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between font-normal"
                              >
                                {corretorSelecionado ? (
                                  <span className="truncate">
                                    {corretoresImobiliaria.find(c => c.user_id === corretorSelecionado)?.nome}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">Buscar corretor...</span>
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Buscar por nome, CRECI ou telefone..." />
                                <CommandList>
                                  <CommandEmpty>Nenhum corretor encontrado.</CommandEmpty>
                                  <CommandGroup>
                                    {corretoresImobiliaria.map((corretor) => (
                                      <CommandItem
                                        key={corretor.user_id}
                                        value={`${corretor.nome} ${corretor.creci || ''} ${corretor.telefone || ''}`}
                                        onSelect={() => {
                                          setCorretorSelecionado(corretor.user_id);
                                          if (corretor.telefone) {
                                            setTelefoneParceiro(formatPhoneInput(corretor.telefone));
                                          }
                                          setCorretorPopoverOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${corretorSelecionado === corretor.user_id ? 'opacity-100' : 'opacity-0'}`}
                                        />
                                        <div className="flex flex-col">
                                          <span className="font-medium">{corretor.nome}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {corretor.creci ? `CRECI: ${corretor.creci} | ` : ''}{formatPhone(corretor.telefone || '')}
                                          </span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}

                      {/* Modo digitar - input de telefone */}
                      {(modoConvite === 'digitar' || !corretoresImobiliaria?.length) && (
                        <div className="space-y-2">
                          <Label>Telefone do corretor parceiro</Label>
                          <Input
                            placeholder="(00) 00000-0000"
                            value={telefoneParceiro}
                            onChange={(e) => {
                              const numbers = e.target.value.replace(/\D/g, '');
                              if (numbers.length <= 2) setTelefoneParceiro(numbers);
                              else if (numbers.length <= 7) setTelefoneParceiro(`(${numbers.slice(0, 2)}) ${numbers.slice(2)}`);
                              else if (numbers.length <= 11) setTelefoneParceiro(`(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`);
                              else setTelefoneParceiro(`(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`);
                            }}
                            maxLength={15}
                          />
                          <p className="text-xs text-muted-foreground">
                            {parceiroExterno 
                              ? 'Qualquer pessoa com o link poderá preencher os dados'
                              : 'O corretor precisa estar cadastrado no sistema com este telefone'}
                          </p>
                        </div>
                      )}

                      {/* Checkbox para parceiro externo */}
                      <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                        <Checkbox 
                          id="parceiro_externo"
                          checked={parceiroExterno}
                          onCheckedChange={(checked) => setParceiroExterno(checked === true)}
                        />
                        <label htmlFor="parceiro_externo" className="text-sm cursor-pointer">
                          <span className="font-medium">Parceiro externo (não tem conta)</span>
                          <p className="text-xs text-muted-foreground">
                            O parceiro poderá aceitar e preencher os dados sem precisar criar conta no sistema
                          </p>
                        </label>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowConvidarParceiro(false);
                            setTelefoneParceiro('');
                            setModoConvite('selecionar');
                            setCorretorSelecionado(null);
                            setParceiroExterno(false);
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleEnviarConviteParceiro}
                          disabled={enviandoConvite || telefoneParceiro.replace(/\D/g, '').length < 10}
                          className="gap-2"
                        >
                          {enviandoConvite ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          Enviar Convite
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {lastOtpResult?.simulation && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Modo Simulação</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>
                  A API do WhatsApp não está configurada. O código foi gerado mas não enviado automaticamente.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <code className="bg-muted px-2 py-1 rounded font-mono text-lg">
                    {lastOtpResult.codigo}
                  </code>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => sendManualWhatsApp(lastOtpResult.tipo as 'proprietario' | 'comprador')}
                    className="gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Enviar via WhatsApp
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Completar dados do Proprietário */}
          {proprietarioFaltando && ficha.status !== 'completo' && ficha.status !== 'finalizado_parcial' && (
            <Card className="border-amber-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Dados do Proprietário</CardTitle>
                      <CardDescription>Preencha os dados para enviar o código de confirmação</CardDescription>
                    </div>
                  </div>
                  {!showCompletarProprietario && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowCompletarProprietario(true)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar
                    </Button>
                  )}
                </div>
              </CardHeader>
              {showCompletarProprietario && (
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                    <Checkbox 
                      id="prop_autopreenchimento"
                      checked={completarProprietarioData.autopreenchimento}
                      onCheckedChange={(checked) => setCompletarProprietarioData({ 
                        ...completarProprietarioData, 
                        autopreenchimento: checked === true,
                        nome: checked ? '' : completarProprietarioData.nome,
                        cpf: checked ? '' : completarProprietarioData.cpf
                      })}
                    />
                    <label htmlFor="prop_autopreenchimento" className="text-sm cursor-pointer">
                      <span className="font-medium">Deixar o proprietário preencher</span>
                      <p className="text-xs text-muted-foreground">O proprietário preencherá nome e CPF ao confirmar</p>
                    </label>
                  </div>

                  {!completarProprietarioData.autopreenchimento && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Nome completo *</Label>
                        <Input
                          placeholder="Nome do proprietário"
                          value={completarProprietarioData.nome}
                          onChange={(e) => setCompletarProprietarioData({ ...completarProprietarioData, nome: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CPF</Label>
                        <Input
                          placeholder="000.000.000-00"
                          value={completarProprietarioData.cpf}
                          onChange={(e) => setCompletarProprietarioData({ ...completarProprietarioData, cpf: formatCPFLib(e.target.value) })}
                          maxLength={14}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Telefone (WhatsApp) *</Label>
                    <Input
                      placeholder="(00) 00000-0000"
                      value={completarProprietarioData.telefone}
                      onChange={(e) => setCompletarProprietarioData({ ...completarProprietarioData, telefone: formatPhoneInput(e.target.value) })}
                      maxLength={15}
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowCompletarProprietario(false);
                        setCompletarProprietarioData({ nome: '', cpf: '', telefone: '', autopreenchimento: false });
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={() => handleSaveCompletarData('proprietario')}
                      disabled={savingCompletarData}
                      className="gap-2"
                    >
                      {savingCompletarData ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Salvar e Enviar OTP
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Completar dados do Comprador */}
          {compradorFaltando && ficha.status !== 'completo' && ficha.status !== 'finalizado_parcial' && (
            <Card className="border-amber-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Dados do Comprador</CardTitle>
                      <CardDescription>Preencha os dados para enviar o código de confirmação</CardDescription>
                    </div>
                  </div>
                  {!showCompletarComprador && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowCompletarComprador(true)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar
                    </Button>
                  )}
                </div>
              </CardHeader>
              {showCompletarComprador && (
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                    <Checkbox 
                      id="comp_autopreenchimento"
                      checked={completarCompradorData.autopreenchimento}
                      onCheckedChange={(checked) => setCompletarCompradorData({ 
                        ...completarCompradorData, 
                        autopreenchimento: checked === true,
                        nome: checked ? '' : completarCompradorData.nome,
                        cpf: checked ? '' : completarCompradorData.cpf
                      })}
                    />
                    <label htmlFor="comp_autopreenchimento" className="text-sm cursor-pointer">
                      <span className="font-medium">Deixar o comprador preencher</span>
                      <p className="text-xs text-muted-foreground">O comprador preencherá nome e CPF ao confirmar</p>
                    </label>
                  </div>

                  {!completarCompradorData.autopreenchimento && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Nome completo *</Label>
                        <Input
                          placeholder="Nome do comprador"
                          value={completarCompradorData.nome}
                          onChange={(e) => setCompletarCompradorData({ ...completarCompradorData, nome: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CPF</Label>
                        <Input
                          placeholder="000.000.000-00"
                          value={completarCompradorData.cpf}
                          onChange={(e) => setCompletarCompradorData({ ...completarCompradorData, cpf: formatCPFLib(e.target.value) })}
                          maxLength={14}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Telefone (WhatsApp) *</Label>
                    <Input
                      placeholder="(00) 00000-0000"
                      value={completarCompradorData.telefone}
                      onChange={(e) => setCompletarCompradorData({ ...completarCompradorData, telefone: formatPhoneInput(e.target.value) })}
                      maxLength={15}
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowCompletarComprador(false);
                        setCompletarCompradorData({ nome: '', cpf: '', telefone: '', autopreenchimento: false });
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={() => handleSaveCompletarData('comprador')}
                      disabled={savingCompletarData}
                      className="gap-2"
                    >
                      {savingCompletarData ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Salvar e Enviar OTP
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Ações - Enviar OTP */}
          {ficha.status !== 'completo' && ficha.status !== 'finalizado_parcial' && (!proprietarioFaltando || !compradorFaltando) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Enviar para Confirmação</CardTitle>
                <CardDescription>
                  Envie o código OTP via WhatsApp para confirmar a visita
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-3">
                {!ficha.proprietario_confirmado_em && !proprietarioFaltando && (
                  <div className="flex-1 flex flex-col gap-1">
                    <Button 
                      className="gap-2 w-full"
                      onClick={() => sendOtp('proprietario')}
                      disabled={sendingOtp !== null || rateLimitProprietario !== null}
                    >
                      {sendingOtp === 'proprietario' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : rateLimitProprietario !== null ? (
                        <Clock className="h-4 w-4" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {rateLimitProprietario !== null 
                        ? `Aguarde ${formatRateLimitTime(rateLimitProprietario)}`
                        : 'Enviar para Proprietário'
                      }
                    </Button>
                    {rateLimitProprietario !== null && (
                      <p className="text-xs text-muted-foreground text-center animate-pulse">
                        ⏱️ Disponível em {formatRateLimitTime(rateLimitProprietario)}
                      </p>
                    )}
                  </div>
                )}
                {!ficha.comprador_confirmado_em && !compradorFaltando && (
                  <div className="flex-1 flex flex-col gap-1">
                    <Button 
                      variant={ficha.proprietario_confirmado_em ? 'default' : 'outline'}
                      className="gap-2 w-full"
                      onClick={() => sendOtp('comprador')}
                      disabled={sendingOtp !== null || rateLimitComprador !== null}
                    >
                      {sendingOtp === 'comprador' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : rateLimitComprador !== null ? (
                        <Clock className="h-4 w-4" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {rateLimitComprador !== null 
                        ? `Aguarde ${formatRateLimitTime(rateLimitComprador)}`
                        : 'Enviar para Comprador'
                      }
                    </Button>
                    {rateLimitComprador !== null && (
                      <p className="text-xs text-muted-foreground text-center animate-pulse">
                        ⏱️ Disponível em {formatRateLimitTime(rateLimitComprador)}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dados do Imóvel */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Dados do Imóvel</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Endereço</p>
                <p className="font-medium">{ficha.imovel_endereco}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-medium">{ficha.imovel_tipo}</p>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Proprietário - se preenchido */}
          {!proprietarioFaltando && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                      <User className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Proprietário</CardTitle>
                    </div>
                  </div>
                  {/* Botão de editar - só aparece se não confirmou ainda */}
                  {!ficha.proprietario_confirmado_em && ficha.status !== 'completo' && ficha.status !== 'finalizado_parcial' && !editandoProprietario && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit('proprietario')}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editandoProprietario ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="edit-prop-nome">Nome</Label>
                        <Input
                          id="edit-prop-nome"
                          value={editProprietarioData.nome}
                          onChange={(e) => setEditProprietarioData(prev => ({ ...prev, nome: e.target.value }))}
                          placeholder="Nome do proprietário"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-prop-cpf">CPF</Label>
                        <Input
                          id="edit-prop-cpf"
                          value={editProprietarioData.cpf}
                          onChange={(e) => setEditProprietarioData(prev => ({ ...prev, cpf: formatCPFLib(e.target.value) }))}
                          placeholder="000.000.000-00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-prop-telefone">Telefone *</Label>
                        <Input
                          id="edit-prop-telefone"
                          value={editProprietarioData.telefone}
                          onChange={(e) => setEditProprietarioData(prev => ({ ...prev, telefone: formatPhoneInput(e.target.value) }))}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelEdit('proprietario')}
                        disabled={savingEditData}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveEditData('proprietario')}
                        disabled={savingEditData}
                      >
                        {savingEditData ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-1" />
                        )}
                        Salvar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Nome</p>
                      <p className="font-medium">{ficha.proprietario_nome || (ficha.proprietario_autopreenchimento ? '(autopreenchimento)' : '-')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">CPF</p>
                      <p className="font-medium">{formatCPF(ficha.proprietario_cpf)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">{formatPhone(ficha.proprietario_telefone)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dados do Comprador - se preenchido */}
          {!compradorFaltando && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Users className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Comprador/Visitante</CardTitle>
                    </div>
                  </div>
                  {/* Botão de editar - só aparece se não confirmou ainda */}
                  {!ficha.comprador_confirmado_em && ficha.status !== 'completo' && ficha.status !== 'finalizado_parcial' && !editandoComprador && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit('comprador')}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editandoComprador ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="edit-comp-nome">Nome</Label>
                        <Input
                          id="edit-comp-nome"
                          value={editCompradorData.nome}
                          onChange={(e) => setEditCompradorData(prev => ({ ...prev, nome: e.target.value }))}
                          placeholder="Nome do comprador"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-comp-cpf">CPF</Label>
                        <Input
                          id="edit-comp-cpf"
                          value={editCompradorData.cpf}
                          onChange={(e) => setEditCompradorData(prev => ({ ...prev, cpf: formatCPFLib(e.target.value) }))}
                          placeholder="000.000.000-00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-comp-telefone">Telefone *</Label>
                        <Input
                          id="edit-comp-telefone"
                          value={editCompradorData.telefone}
                          onChange={(e) => setEditCompradorData(prev => ({ ...prev, telefone: formatPhoneInput(e.target.value) }))}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelEdit('comprador')}
                        disabled={savingEditData}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveEditData('comprador')}
                        disabled={savingEditData}
                      >
                        {savingEditData ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-1" />
                        )}
                        Salvar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Nome</p>
                      <p className="font-medium">{ficha.comprador_nome || (ficha.comprador_autopreenchimento ? '(autopreenchimento)' : '-')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">CPF</p>
                      <p className="font-medium">{formatCPF(ficha.comprador_cpf)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">{formatPhone(ficha.comprador_telefone)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dados do Corretor Parceiro Externo */}
          {ficha.corretor_parceiro_id && conviteParceiro?.permite_externo && conviteParceiro?.parceiro_nome && (
            <Card className="border-blue-500/30">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Corretor Parceiro</CardTitle>
                    <CardDescription>Parceiro externo que participou desta ficha</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{conviteParceiro.parceiro_nome}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CPF</p>
                    <p className="font-medium">{formatCPF(conviteParceiro.parceiro_cpf)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CRECI</p>
                    <p className="font-medium">{conviteParceiro.parceiro_creci || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Imobiliária</p>
                    <p className="font-medium">{conviteParceiro.parceiro_imobiliaria || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data e Observações */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Detalhes da Visita</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Data e Hora</p>
                <p className="font-medium">
                  {format(new Date(ficha.data_visita), "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              {ficha.observacoes && (
                <div>
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="font-medium">{ficha.observacoes}</p>
                </div>
              )}
          </CardContent>
          </Card>

          {/* Pesquisa Pós-Visita - Only when buyer confirmed AND feature enabled */}
          {ficha.comprador_confirmado_em && surveyFeatureEnabled && (() => {
            // Determinar quem adicionou o comprador
            const corretorQueAdicionouComprador = 
              ficha.parte_preenchida_parceiro === 'comprador' 
                ? ficha.corretor_parceiro_id 
                : ficha.user_id;
            
            const canCreate = user?.id === corretorQueAdicionouComprador;
            const isPartner = !canCreate && (user?.id === ficha.user_id || user?.id === ficha.corretor_parceiro_id);
            
            return (
              <SurveySection 
                fichaId={ficha.id} 
                compradorNome={ficha.comprador_nome} 
                imovelEndereco={ficha.imovel_endereco}
                canCreate={canCreate}
                isPartner={isPartner}
              />
            );
          })()}

          {/* Dados Jurídicos - Only when complete or finalized partial */}
          {(ficha.status === 'completo' || ficha.status === 'finalizado_parcial') && (confirmacaoProprietario || confirmacaoComprador) && (
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Dados Jurídicos das Confirmações</CardTitle>
                    <CardDescription>Assinaturas digitais e rastreabilidade</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Proprietário Legal Data */}
                {confirmacaoProprietario && (
                  <div className="space-y-3 p-4 rounded-lg bg-muted/30 border">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Proprietário</span>
                      <Badge variant="outline" className="text-xs">Confirmado</Badge>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Fingerprint className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Assinatura</p>
                          <p className="font-medium">{confirmacaoProprietario.aceite_nome || '-'}</p>
                          <p className="text-xs text-muted-foreground">CPF: {formatCPF(confirmacaoProprietario.aceite_cpf)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Localização</p>
                          {confirmacaoProprietario.aceite_latitude && confirmacaoProprietario.aceite_longitude ? (
                            <p className="font-medium text-xs">
                              {Number(confirmacaoProprietario.aceite_latitude).toFixed(6)}, {Number(confirmacaoProprietario.aceite_longitude).toFixed(6)}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">Não capturada</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">IP</p>
                        <p className="font-medium font-mono text-xs">{confirmacaoProprietario.aceite_ip || '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Data/Hora do Aceite</p>
                        <p className="font-medium">
                          {confirmacaoProprietario.aceite_em 
                            ? format(new Date(confirmacaoProprietario.aceite_em), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comprador Legal Data */}
                {confirmacaoComprador && (
                  <div className="space-y-3 p-4 rounded-lg bg-muted/30 border">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Comprador/Visitante</span>
                      <Badge variant="outline" className="text-xs">Confirmado</Badge>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Fingerprint className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Assinatura</p>
                          <p className="font-medium">{confirmacaoComprador.aceite_nome || '-'}</p>
                          <p className="text-xs text-muted-foreground">CPF: {formatCPF(confirmacaoComprador.aceite_cpf)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Localização</p>
                          {confirmacaoComprador.aceite_latitude && confirmacaoComprador.aceite_longitude ? (
                            <p className="font-medium text-xs">
                              {Number(confirmacaoComprador.aceite_latitude).toFixed(6)}, {Number(confirmacaoComprador.aceite_longitude).toFixed(6)}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">Não capturada</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">IP</p>
                        <p className="font-medium font-mono text-xs">{confirmacaoComprador.aceite_ip || '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Data/Hora do Aceite</p>
                        <p className="font-medium">
                          {confirmacaoComprador.aceite_em 
                            ? format(new Date(confirmacaoComprador.aceite_em), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!confirmacaoProprietario && ficha.status === 'finalizado_parcial' && (
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium text-sm">Proprietário não confirmou</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Este registro foi finalizado sem a confirmação do proprietário.
                    </p>
                  </div>
                )}

                {!confirmacaoComprador && ficha.status === 'finalizado_parcial' && (
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium text-sm">Comprador não confirmou</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Este registro foi finalizado sem a confirmação do comprador.
                    </p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  Dados coletados conforme Lei 14.063/2020 para validade jurídica da assinatura eletrônica.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
