import { useEffect, useState } from 'react';
import { entityStatusColors, subscriptionStatusColors, getStatusColor } from '@/lib/statusColors';
import { Link, useNavigate } from 'react-router-dom';
import { SuperAdminLayout } from '@/components/layouts/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, MoreHorizontal, Building2, Users, Eye, Ban, Trash2, Power, CreditCard, ClipboardCheck, LogIn, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AnimatedContent, AnimatedList, AnimatedItem } from '@/components/AnimatedContent';

interface Imobiliaria {
  id: string;
  nome: string;
  cnpj: string | null;
  email: string;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;
  status: string;
  created_at: string;
  codigo?: number | null;
  corretores_count?: number;
  assinatura_status?: string;
  assinatura_id?: string;
  assinatura_plano_id?: string;
  assinatura_plano_nome?: string;
  survey_enabled?: boolean;
}

interface Plano {
  id: string;
  nome: string;
  valor_mensal: number;
  max_corretores: number;
}

export default function AdminImobiliarias() {
  const navigate = useNavigate();
  const [imobiliarias, setImobiliarias] = useState<Imobiliaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isTogglingAssinatura, setIsTogglingAssinatura] = useState<string | null>(null);
  const [isTogglingFeature, setIsTogglingFeature] = useState<string | null>(null);
  
  // Estados para alterar plano
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [isPlanoDialogOpen, setIsPlanoDialogOpen] = useState(false);
  const [imobiliariaToChangePlan, setImobiliariaToChangePlan] = useState<Imobiliaria | null>(null);
  const [selectedPlanoId, setSelectedPlanoId] = useState("");
  
  // Estados para impersonação
  const [isImpersonateDialogOpen, setIsImpersonateDialogOpen] = useState(false);
  const [imobiliariaToImpersonate, setImobiliariaToImpersonate] = useState<Imobiliaria | null>(null);
  const [masterPassword, setMasterPassword] = useState("");
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [isChangingPlano, setIsChangingPlano] = useState(false);

  async function fetchPlanos() {
    try {
      const { data, error } = await supabase
        .from("planos")
        .select("id, nome, valor_mensal, max_corretores")
        .eq("ativo", true)
        .gt("max_corretores", 1)
        .order("valor_mensal");

      if (error) throw error;
      setPlanos(data || []);
    } catch (error) {
      console.error("Error fetching planos:", error);
    }
  }

  async function fetchImobiliarias() {
    try {
      const { data, error } = await supabase
        .from('imobiliarias')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch additional info for each imobiliaria
      const enrichedData = await Promise.all(
        (data || []).map(async (imob) => {
          // Count corretores (apenas role 'corretor', não inclui admins)
          const { count } = await supabase
            .from('user_roles')
            .select('*', { count: 'exact', head: true })
            .eq('imobiliaria_id', imob.id)
            .eq('role', 'corretor');

          // Get subscription with plan info
          const { data: assData } = await supabase
            .from('assinaturas')
            .select('id, status, plano_id, plano:planos!assinaturas_plano_id_fkey(nome)')
            .eq('imobiliaria_id', imob.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get survey feature flag
          const { data: featureData } = await supabase
            .from('imobiliaria_feature_flags')
            .select('enabled')
            .eq('imobiliaria_id', imob.id)
            .eq('feature_key', 'post_visit_survey')
            .maybeSingle();

          const planoData = assData?.plano as { nome: string } | null;

          return {
            ...imob,
            corretores_count: count || 0,
            assinatura_status: assData?.status || 'sem_assinatura',
            assinatura_id: assData?.id,
            assinatura_plano_id: assData?.plano_id,
            assinatura_plano_nome: planoData?.nome,
            survey_enabled: featureData?.enabled ?? false,
          };
        })
      );

      setImobiliarias(enrichedData);
    } catch (error) {
      console.error('Error fetching imobiliarias:', error);
      toast.error('Erro ao carregar imobiliárias');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchImobiliarias();
    fetchPlanos();
  }, []);

  async function toggleStatus(imob: Imobiliaria) {
    const newStatus = imob.status === 'ativo' ? 'suspenso' : 'ativo';
    
    try {
      const { error } = await supabase
        .from('imobiliarias')
        .update({ status: newStatus })
        .eq('id', imob.id);

      if (error) throw error;

      toast.success(`Imobiliária ${newStatus === 'ativo' ? 'ativada' : 'suspensa'} com sucesso`);
      fetchImobiliarias();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  }

  async function deleteImobiliaria(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta imobiliária? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('imobiliarias')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Imobiliária excluída com sucesso');
      fetchImobiliarias();
    } catch (error) {
      console.error('Error deleting imobiliaria:', error);
      toast.error('Erro ao excluir imobiliária');
    }
  }

  async function toggleAssinatura(imob: Imobiliaria) {
    if (!imob.assinatura_status || imob.assinatura_status === 'sem_assinatura') {
      toast.error('Imobiliária não possui assinatura vinculada');
      return;
    }

    setIsTogglingAssinatura(imob.id);
    try {
      const novoStatus = imob.assinatura_status === 'ativa' ? 'suspensa' : 'ativa';

      const { error } = await supabase
        .from('assinaturas')
        .update({ status: novoStatus })
        .eq('imobiliaria_id', imob.id);

      if (error) throw error;

      toast.success(
        novoStatus === 'ativa'
          ? 'Assinatura ativada com sucesso!'
          : 'Assinatura suspensa com sucesso!'
      );
      fetchImobiliarias();
    } catch (error: any) {
      console.error('Error toggling subscription:', error);
      toast.error(error.message || 'Erro ao alterar status da assinatura');
    } finally {
      setIsTogglingAssinatura(null);
    }
  }

  function openPlanoDialog(imob: Imobiliaria) {
    setImobiliariaToChangePlan(imob);
    setSelectedPlanoId(imob.assinatura_plano_id || "");
    setIsPlanoDialogOpen(true);
  }

  async function handleChangePlano() {
    if (!imobiliariaToChangePlan || !selectedPlanoId) {
      toast.error("Selecione um plano");
      return;
    }

    setIsChangingPlano(true);
    try {
      if (imobiliariaToChangePlan.assinatura_id) {
        // Atualizar assinatura existente
        const { error } = await supabase
          .from("assinaturas")
          .update({ plano_id: selectedPlanoId, status: "ativa" })
          .eq("id", imobiliariaToChangePlan.assinatura_id);
        if (error) throw error;
      } else {
        // Criar nova assinatura
        const { error } = await supabase
          .from("assinaturas")
          .insert({
            imobiliaria_id: imobiliariaToChangePlan.id,
            plano_id: selectedPlanoId,
            status: "ativa",
            data_inicio: new Date().toISOString().split("T")[0],
          });
        if (error) throw error;
      }

      toast.success("Plano alterado com sucesso!");
      setIsPlanoDialogOpen(false);
      setImobiliariaToChangePlan(null);
      setSelectedPlanoId("");
      fetchImobiliarias();
    } catch (error: any) {
      console.error("Error changing plan:", error);
      toast.error(error.message || "Erro ao alterar plano");
    } finally {
      setIsChangingPlano(false);
    }
  }

  async function toggleSurveyFeature(imob: Imobiliaria) {
    setIsTogglingFeature(imob.id);
    try {
      const newValue = !imob.survey_enabled;

      const { error } = await supabase
        .from('imobiliaria_feature_flags')
        .upsert({
          imobiliaria_id: imob.id,
          feature_key: 'post_visit_survey',
          enabled: newValue,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'imobiliaria_id,feature_key',
        });

      if (error) throw error;

      toast.success(
        newValue
          ? 'Pesquisa Pós-Visita habilitada!'
          : 'Pesquisa Pós-Visita desabilitada!'
      );
      fetchImobiliarias();
    } catch (error) {
      console.error('Error toggling survey feature:', error);
      toast.error('Erro ao alterar feature');
    } finally {
      setIsTogglingFeature(null);
    }
  }

  function openImpersonateDialog(imob: Imobiliaria, e?: React.MouseEvent) {
    e?.stopPropagation();
    setImobiliariaToImpersonate(imob);
    setMasterPassword("");
    setIsImpersonateDialogOpen(true);
  }

  async function handleImpersonate() {
    if (!imobiliariaToImpersonate || !masterPassword) {
      toast.error("Digite a senha master");
      return;
    }

    setIsImpersonating(true);
    try {
      // 1. Buscar o user_id do admin
      const { data: adminUserId, error: adminError } = await supabase
        .rpc('get_imobiliaria_admin', { imob_id: imobiliariaToImpersonate.id });
      
      if (adminError || !adminUserId) {
        toast.error('Admin não encontrado para esta imobiliária');
        return;
      }
      
      // 2. Buscar email do admin via profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', adminUserId)
        .maybeSingle();
      
      if (!profile?.email) {
        toast.error('Email do admin não encontrado');
        return;
      }
      
      // 3. Chamar master-login
      const { data, error } = await supabase.functions.invoke('master-login', {
        body: { 
          email: profile.email, 
          master_password: masterPassword 
        }
      });
      
      if (error || !data?.redirect_url) {
        toast.error(data?.error || 'Erro ao gerar link de acesso');
        return;
      }
      
      // 4. Redirecionar
      window.location.href = data.redirect_url;
      
    } catch (error) {
      console.error('Impersonation error:', error);
      toast.error('Erro ao acessar conta');
    } finally {
      setIsImpersonating(false);
    }
  }

  const filteredImobiliarias = imobiliarias.filter(imob =>
    imob.nome.toLowerCase().includes(search.toLowerCase()) ||
    imob.email.toLowerCase().includes(search.toLowerCase()) ||
    imob.cnpj?.includes(search)
  );

  // Using global status colors from lib/statusColors

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Skeleton className="h-8 w-40 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-40" />
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-10 w-full max-w-md" />
            </CardHeader>
            <CardContent>
              {/* Mobile skeleton */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-10" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                      <Skeleton className="h-4 w-48" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop skeleton */}
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead><Skeleton className="h-4 w-8" /></TableHead>
                      <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                      <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                      <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                      <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                      <TableHead><Skeleton className="h-4 w-12" /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <AnimatedContent className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Imobiliárias</h1>
            <p className="text-muted-foreground">Gerencie as imobiliárias cadastradas</p>
          </div>
          <Link to="/admin/imobiliarias/nova">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Imobiliária
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou CNPJ..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredImobiliarias.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhuma imobiliária encontrada</h3>
                <p className="text-muted-foreground">
                  {search ? 'Tente buscar por outro termo' : 'Cadastre a primeira imobiliária'}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile View - Cards */}
                <AnimatedList className="grid grid-cols-1 gap-3 md:hidden">
                  {filteredImobiliarias.map((imob) => (
                    <AnimatedItem key={imob.id}>
                      <Card
                      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                      onClick={() => navigate(`/admin/imobiliarias/${imob.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                #{imob.codigo || '-'}
                              </span>
                              <Badge className={getStatusColor(entityStatusColors, imob.status)}>
                                {imob.status === 'ativo' ? 'Ativo' : imob.status === 'suspenso' ? 'Suspenso' : 'Inativo'}
                              </Badge>
                            </div>
                            <button
                              onClick={(e) => openImpersonateDialog(imob, e)}
                              className="text-left group"
                            >
                              <p className="font-medium truncate group-hover:text-primary transition-colors flex items-center gap-1">
                                {imob.nome}
                                <LogIn className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                              </p>
                              <p className="text-sm text-muted-foreground truncate">{imob.email}</p>
                            </button>
                            {imob.cidade && imob.estado && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {imob.cidade}/{imob.estado}
                              </p>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/imobiliarias/${imob.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver detalhes
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleStatus(imob)}>
                                <Ban className="h-4 w-4 mr-2" />
                                {imob.status === 'ativo' ? 'Suspender' : 'Ativar'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openPlanoDialog(imob)}>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Alterar Plano
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => deleteImobiliaria(imob.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t">
                          <Badge variant="outline" className={getStatusColor(subscriptionStatusColors, imob.assinatura_status || 'sem_assinatura', 'bg-muted text-muted-foreground')}>
                            {imob.assinatura_status === 'ativa' && 'Assinatura Ativa'}
                            {imob.assinatura_status === 'trial' && 'Trial'}
                            {imob.assinatura_status === 'pendente' && 'Pendente'}
                            {imob.assinatura_status === 'suspensa' && 'Suspensa'}
                            {imob.assinatura_status === 'cancelada' && 'Cancelada'}
                            {imob.assinatura_status === 'sem_assinatura' && 'Sem assinatura'}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground ml-auto">
                            <Users className="h-4 w-4" />
                            <span>{imob.corretores_count}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    </AnimatedItem>
                  ))}
                </AnimatedList>

                {/* Desktop View - Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[70px]">Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="hidden lg:table-cell">CNPJ</TableHead>
                        <TableHead className="hidden lg:table-cell">Localização</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assinatura</TableHead>
                        <TableHead>Corretores</TableHead>
                        <TableHead className="hidden lg:table-cell">Cadastro</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredImobiliarias.map((imob) => (
                        <TableRow key={imob.id}>
                          <TableCell>
                            <span className="font-mono font-semibold text-primary">
                              {imob.codigo || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => openImpersonateDialog(imob)}
                                    className="text-left group"
                                  >
                                    <p className="font-medium group-hover:text-primary group-hover:underline transition-colors flex items-center gap-1">
                                      {imob.nome}
                                      <LogIn className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </p>
                                    <p className="text-sm text-muted-foreground group-hover:text-primary/70 transition-colors">{imob.email}</p>
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Entrar como admin desta imobiliária</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {imob.cnpj || '-'}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {imob.cidade && imob.estado ? `${imob.cidade}/${imob.estado}` : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(entityStatusColors, imob.status)}>
                              {imob.status === 'ativo' ? 'Ativo' : imob.status === 'suspenso' ? 'Suspenso' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(subscriptionStatusColors, imob.assinatura_status || 'sem_assinatura', 'bg-muted text-muted-foreground')}>
                              {imob.assinatura_status === 'ativa' && 'Ativa'}
                              {imob.assinatura_status === 'trial' && 'Trial'}
                              {imob.assinatura_status === 'pendente' && 'Pendente'}
                              {imob.assinatura_status === 'suspensa' && 'Suspensa'}
                              {imob.assinatura_status === 'cancelada' && 'Cancelada'}
                              {imob.assinatura_status === 'sem_assinatura' && 'Sem assinatura'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {imob.corretores_count}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">
                            {format(new Date(imob.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to={`/admin/imobiliarias/${imob.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver detalhes
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleStatus(imob)}>
                                  <Ban className="h-4 w-4 mr-2" />
                                  {imob.status === 'ativo' ? 'Suspender Imobiliária' : 'Ativar Imobiliária'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openPlanoDialog(imob)}>
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Alterar Plano
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => toggleSurveyFeature(imob)}
                                  disabled={isTogglingFeature === imob.id}
                                >
                                  <ClipboardCheck className="h-4 w-4 mr-2" />
                                  {imob.survey_enabled ? 'Desabilitar Pesquisa' : 'Habilitar Pesquisa'}
                                </DropdownMenuItem>
                                {imob.assinatura_status && imob.assinatura_status !== 'sem_assinatura' && (
                                  <DropdownMenuItem
                                    onClick={() => toggleAssinatura(imob)}
                                    disabled={isTogglingAssinatura === imob.id}
                                  >
                                    <Power className="h-4 w-4 mr-2" />
                                    {imob.assinatura_status === 'ativa' ? 'Desativar Assinatura' : 'Ativar Assinatura'}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => deleteImobiliaria(imob.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Dialog para alterar plano */}
        <Dialog open={isPlanoDialogOpen} onOpenChange={setIsPlanoDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Plano da Imobiliária</DialogTitle>
              <DialogDescription>
                Selecione o novo plano para {imobiliariaToChangePlan?.nome}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Plano atual</Label>
                <p className="text-sm text-muted-foreground">
                  {imobiliariaToChangePlan?.assinatura_plano_nome || "Sem plano"}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Novo plano</Label>
                <Select value={selectedPlanoId} onValueChange={setSelectedPlanoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {planos.map((plano) => (
                      <SelectItem key={plano.id} value={plano.id}>
                        {plano.nome} - R$ {plano.valor_mensal.toFixed(2)} ({plano.max_corretores} corretores)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPlanoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleChangePlano} disabled={isChangingPlano || !selectedPlanoId}>
                {isChangingPlano ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para impersonação */}
        <Dialog open={isImpersonateDialogOpen} onOpenChange={setIsImpersonateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                Entrar como Admin
              </DialogTitle>
              <DialogDescription>
                Você irá acessar o sistema como administrador da imobiliária <strong>{imobiliariaToImpersonate?.nome}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  ⚠️ Esta ação é registrada para auditoria. Use apenas para suporte ao cliente.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="master-password">Senha Master</Label>
                <Input
                  id="master-password"
                  type="password"
                  placeholder="Digite a senha master..."
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleImpersonate()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsImpersonateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleImpersonate} disabled={isImpersonating || !masterPassword}>
                {isImpersonating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Entrar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AnimatedContent>
    </SuperAdminLayout>
  );
}
