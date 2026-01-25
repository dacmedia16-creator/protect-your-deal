import { useState, useEffect } from "react";
import { fichaStatusColors, subscriptionStatusColors, getStatusColor } from '@/lib/statusColors';
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SuperAdminLayout } from "@/components/layouts/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Save,
  KeyRound,
  UserCircle,
  Home,
  FileText,
  Users,
  Link as LinkIcon,
  CalendarDays,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatPhone } from "@/lib/phone";

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  telefone: z.string().optional(),
  creci: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Imobiliaria {
  id: string;
  nome: string;
}

interface Ficha {
  id: string;
  protocolo: string;
  comprador_nome: string | null;
  proprietario_nome: string | null;
  imovel_endereco: string;
  status: string;
  data_visita: string;
  created_at: string;
}

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  tipo: string;
  created_at: string;
}

interface Imovel {
  id: string;
  endereco: string;
  tipo: string;
  bairro: string | null;
  cidade: string | null;
  created_at: string;
}

interface Assinatura {
  id: string;
  status: string;
  data_inicio: string;
  data_fim: string | null;
  proxima_cobranca: string | null;
  plano: {
    id: string;
    nome: string;
    valor_mensal: number;
    max_fichas_mes: number;
    max_clientes: number;
    max_imoveis: number;
  } | null;
}

interface Plano {
  id: string;
  nome: string;
  valor_mensal: number;
  max_fichas_mes: number;
  max_clientes: number;
  max_imoveis: number;
}

export default function AdminDetalhesCorretorAutonomo() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  // Data
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [imobiliarias, setImobiliarias] = useState<Imobiliaria[]>([]);
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);
  const [planos, setPlanos] = useState<Plano[]>([]);

  // Link dialog
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [selectedImobiliariaId, setSelectedImobiliariaId] = useState("");
  const [backfillFichas, setBackfillFichas] = useState(true);
  const [isLinking, setIsLinking] = useState(false);

  // Reset password dialog
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetAction, setResetAction] = useState<"set_password" | "send_reset_email">("set_password");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Assinatura management
  const [isAssinaturaDialogOpen, setIsAssinaturaDialogOpen] = useState(false);
  const [selectedPlanoId, setSelectedPlanoId] = useState("");
  const [isSavingAssinatura, setIsSavingAssinatura] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      telefone: "",
      creci: "",
    },
  });

  useEffect(() => {
    async function fetchData() {
      if (!userId) return;

      try {
        const { data: sessionData } = await supabase.auth.getSession();

        // Fetch profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profile) {
          toast.error("Corretor não encontrado");
          navigate("/admin/autonomos");
          return;
        }

        form.reset({
          nome: profile.nome,
          telefone: profile.telefone || "",
          creci: profile.creci || "",
        });

        setCreatedAt(profile.created_at);

        // Fetch email via edge function
        try {
          const { data: usersData } = await supabase.functions.invoke("admin-list-users", {
            headers: {
              Authorization: `Bearer ${sessionData.session?.access_token}`,
            },
          });

          if (usersData?.users) {
            const user = usersData.users.find((u: any) => u.id === userId);
            setEmail(user?.email || null);
          }
        } catch (e) {
          console.error("Error fetching user email:", e);
        }

        // Fetch fichas
        const { data: fichasData } = await supabase
          .from("fichas_visita")
          .select("id, protocolo, comprador_nome, proprietario_nome, imovel_endereco, status, data_visita, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        setFichas(fichasData || []);

        // Fetch clientes
        const { data: clientesData } = await supabase
          .from("clientes")
          .select("id, nome, telefone, email, tipo, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        setClientes(clientesData || []);

        // Fetch imóveis
        const { data: imoveisData } = await supabase
          .from("imoveis")
          .select("id, endereco, tipo, bairro, cidade, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        setImoveis(imoveisData || []);

        // Fetch imobiliarias for linking
        const { data: imobiliariasData } = await supabase
          .from("imobiliarias")
          .select("id, nome")
          .eq("status", "ativo")
          .order("nome");

        setImobiliarias(imobiliariasData || []);

        // Fetch assinatura do corretor autônomo
        const { data: assData } = await supabase
          .from("assinaturas")
          .select(`
            id,
            status,
            data_inicio,
            data_fim,
            proxima_cobranca,
            plano:planos (
              id,
              nome,
              valor_mensal,
              max_fichas_mes,
              max_clientes,
              max_imoveis
            )
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .maybeSingle();

        if (assData) {
          setAssinatura({
            ...assData,
            plano: Array.isArray(assData.plano) ? assData.plano[0] : assData.plano
          });
        }

        // Fetch planos disponíveis
        const { data: planosData } = await supabase
          .from("planos")
          .select("id, nome, valor_mensal, max_fichas_mes, max_clientes, max_imoveis")
          .eq("ativo", true)
          .order("valor_mensal");

        setPlanos(planosData || []);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast.error("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId, navigate, form]);

  const onSubmit = async (data: FormData) => {
    if (!userId) return;
    setSaving(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke("admin-update-corretor", {
        body: {
          user_id: userId,
          nome: data.nome,
          telefone: data.telefone || null,
          creci: data.creci || null,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (response.error || response.data?.error) {
        throw new Error(response.data?.error || response.error?.message);
      }

      toast.success("Dados atualizados com sucesso!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Erro ao atualizar dados");
    } finally {
      setSaving(false);
    }
  };

  const handleLinkToImobiliaria = async () => {
    if (!userId || !selectedImobiliariaId) {
      toast.error("Selecione uma imobiliária");
      return;
    }

    setIsLinking(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke("admin-vincular-usuario", {
        body: {
          user_id: userId,
          imobiliaria_id: selectedImobiliariaId,
          backfill_fichas: backfillFichas,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (response.error || response.data?.error) {
        throw new Error(response.data?.error || response.error?.message);
      }

      const backfillMessage =
        response.data?.backfill?.updated > 0
          ? ` (${response.data.backfill.updated} registro(s) atualizado(s))`
          : "";

      toast.success(`Corretor vinculado com sucesso${backfillMessage}`);
      setIsLinkDialogOpen(false);
      navigate("/admin/autonomos");
    } catch (error: any) {
      toast.error(error.message || "Erro ao vincular corretor");
    } finally {
      setIsLinking(false);
    }
  };

  const handleResetPassword = async () => {
    if (!userId) return;

    if (resetAction === "set_password") {
      if (!newPassword) {
        toast.error("Digite a nova senha");
        return;
      }
      if (newPassword.length < 6) {
        toast.error("A senha deve ter pelo menos 6 caracteres");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("As senhas não coincidem");
        return;
      }
    }

    setIsResetting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke("admin-reset-password", {
        body: {
          user_id: userId,
          action: resetAction,
          new_password: resetAction === "set_password" ? newPassword : undefined,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (response.error || response.data?.error) {
        throw new Error(response.data?.error || response.error?.message);
      }

      toast.success(
        resetAction === "set_password"
          ? "Senha redefinida com sucesso!"
          : "Link de recuperação gerado com sucesso!"
      );
      setIsResetDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error(error.message || "Erro ao redefinir senha");
    } finally {
      setIsResetting(false);
    }
  };

  const handleSaveAssinatura = async () => {
    if (!userId || !selectedPlanoId) {
      toast.error("Selecione um plano");
      return;
    }

    setIsSavingAssinatura(true);
    try {
      if (assinatura) {
        // Atualizar assinatura existente
        const { error } = await supabase
          .from("assinaturas")
          .update({ plano_id: selectedPlanoId, status: 'ativa' })
          .eq("id", assinatura.id);

        if (error) throw error;
      } else {
        // Criar nova assinatura
        const { error } = await supabase
          .from("assinaturas")
          .insert({
            user_id: userId,
            plano_id: selectedPlanoId,
            status: 'ativa',
            data_inicio: new Date().toISOString().split('T')[0],
          });

        if (error) throw error;
      }

      // Refresh assinatura
      const { data: newAssData } = await supabase
        .from("assinaturas")
        .select(`
          id,
          status,
          data_inicio,
          data_fim,
          proxima_cobranca,
          plano:planos (
            id,
            nome,
            valor_mensal,
            max_fichas_mes,
            max_clientes,
            max_imoveis
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (newAssData) {
        setAssinatura({
          ...newAssData,
          plano: Array.isArray(newAssData.plano) ? newAssData.plano[0] : newAssData.plano
        });
      }

      toast.success("Assinatura atualizada com sucesso!");
      setIsAssinaturaDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving assinatura:", error);
      toast.error(error.message || "Erro ao salvar assinatura");
    } finally {
      setIsSavingAssinatura(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Using fichaStatusColors and subscriptionStatusColors from lib/statusColors

  const tipoColors: Record<string, string> = {
    comprador: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    proprietario: "bg-purple-500/10 text-purple-600 border-purple-500/30",
    ambos: "bg-teal-500/10 text-teal-600 border-teal-500/30",
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-amber-500/10 flex items-center justify-center">
              <UserCircle className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-display font-bold">{form.getValues("nome")}</h1>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                  Autônomo
                </Badge>
              </div>
              <p className="text-muted-foreground">{email || "Email não disponível"}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {fichas.length} registros
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {clientes.length} clientes
            </div>
            <div className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              {imoveis.length} imóveis
            </div>
          </div>
        </div>

        <Tabs defaultValue="dados" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="assinatura">Assinatura</TabsTrigger>
            <TabsTrigger value="fichas">Registros ({fichas.length})</TabsTrigger>
            <TabsTrigger value="clientes">Clientes ({clientes.length})</TabsTrigger>
            <TabsTrigger value="imoveis">Imóveis ({imoveis.length})</TabsTrigger>
          </TabsList>

          {/* Dados Tab */}
          <TabsContent value="dados">
            <Card>
              <CardHeader>
                <CardTitle>Dados do Corretor</CardTitle>
                <CardDescription>Edite as informações do corretor autônomo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={email || ""} disabled className="bg-muted" />
                      </div>
                      <FormField
                        control={form.control}
                        name="telefone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="(00) 00000-0000" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="creci"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CRECI</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Número do CRECI" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      Cadastrado em{" "}
                      {createdAt
                        ? format(new Date(createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                        : "-"}
                    </div>

                    <div className="flex flex-wrap gap-3 pt-4">
                      <Button type="submit" disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Salvar Alterações
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsLinkDialogOpen(true)}
                      >
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Vincular a Imobiliária
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsResetDialogOpen(true)}
                      >
                        <KeyRound className="h-4 w-4 mr-2" />
                        Redefinir Senha
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assinatura Tab */}
          <TabsContent value="assinatura">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Assinatura
                    </CardTitle>
                    <CardDescription>
                      Gerencie o plano de assinatura do corretor
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedPlanoId(assinatura?.plano?.id || "");
                      setIsAssinaturaDialogOpen(true);
                    }}
                  >
                    {assinatura ? "Alterar Plano" : "Adicionar Plano"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {assinatura ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Plano</Label>
                        <p className="font-medium">{assinatura.plano?.nome || "-"}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Valor</Label>
                        <p className="font-medium">
                          {assinatura.plano ? formatCurrency(assinatura.plano.valor_mensal) : "-"}/mês
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Status</Label>
                        <div>
                          <Badge variant="outline" className={getStatusColor(subscriptionStatusColors, assinatura.status)}>
                            {assinatura.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Início</Label>
                        <p className="font-medium">
                          {format(new Date(assinatura.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    
                    {assinatura.plano && (
                      <div className="border-t pt-4 mt-4">
                        <Label className="text-muted-foreground text-xs mb-2 block">Limites do Plano</Label>
                        <div className="grid gap-2 md:grid-cols-3 text-sm">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{assinatura.plano.max_fichas_mes} registros/mês</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{assinatura.plano.max_clientes} clientes</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <span>{assinatura.plano.max_imoveis} imóveis</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Este corretor não possui assinatura ativa.</p>
                    <p className="text-sm">Clique em "Adicionar Plano" para criar uma assinatura.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fichas Tab */}
          <TabsContent value="fichas">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Protocolo</TableHead>
                      <TableHead>Comprador</TableHead>
                      <TableHead>Proprietário</TableHead>
                      <TableHead>Imóvel</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Visita</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fichas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum registro encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      fichas.map((ficha) => (
                        <TableRow key={ficha.id}>
                          <TableCell className="font-mono">{ficha.protocolo}</TableCell>
                          <TableCell>{ficha.comprador_nome || "-"}</TableCell>
                          <TableCell>{ficha.proprietario_nome || "-"}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{ficha.imovel_endereco}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(fichaStatusColors, ficha.status)}>
                              {ficha.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(ficha.data_visita), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clientes Tab */}
          <TabsContent value="clientes">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cadastro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhum cliente encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      clientes.map((cliente) => (
                        <TableRow key={cliente.id}>
                          <TableCell className="font-medium">{cliente.nome}</TableCell>
                          <TableCell>{formatPhone(cliente.telefone)}</TableCell>
                          <TableCell>{cliente.email || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={tipoColors[cliente.tipo] || ""}>
                              {cliente.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(cliente.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Imóveis Tab */}
          <TabsContent value="imoveis">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Endereço</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Bairro</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Cadastro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {imoveis.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhum imóvel encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      imoveis.map((imovel) => (
                        <TableRow key={imovel.id}>
                          <TableCell className="font-medium">{imovel.endereco}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{imovel.tipo}</Badge>
                          </TableCell>
                          <TableCell>{imovel.bairro || "-"}</TableCell>
                          <TableCell>{imovel.cidade || "-"}</TableCell>
                          <TableCell>
                            {format(new Date(imovel.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Link to Imobiliaria Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular a Imobiliária</DialogTitle>
            <DialogDescription>
              Selecione a imobiliária para vincular o corretor "{form.getValues("nome")}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Imobiliária</Label>
              <Select value={selectedImobiliariaId} onValueChange={setSelectedImobiliariaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma imobiliária" />
                </SelectTrigger>
                <SelectContent>
                  {imobiliarias.map((imob) => (
                    <SelectItem key={imob.id} value={imob.id}>
                      {imob.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="backfill"
                checked={backfillFichas}
                onCheckedChange={(checked) => setBackfillFichas(checked as boolean)}
              />
              <label htmlFor="backfill" className="text-sm cursor-pointer">
                Atualizar fichas antigas para a nova imobiliária
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleLinkToImobiliaria} disabled={isLinking || !selectedImobiliariaId}>
              {isLinking ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LinkIcon className="h-4 w-4 mr-2" />}
              Vincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              Escolha como redefinir a senha de "{form.getValues("nome")}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <RadioGroup value={resetAction} onValueChange={(v) => setResetAction(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="set_password" id="set_password" />
                <Label htmlFor="set_password">Definir nova senha manualmente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="send_reset_email" id="send_reset_email" />
                <Label htmlFor="send_reset_email">Gerar link de recuperação</Label>
              </div>
            </RadioGroup>

            {resetAction === "set_password" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nova Senha</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Senha</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite novamente"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleResetPassword} disabled={isResetting}>
              {isResetting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}
              Redefinir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assinatura Dialog */}
      <Dialog open={isAssinaturaDialogOpen} onOpenChange={setIsAssinaturaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Assinatura</DialogTitle>
            <DialogDescription>
              Selecione um plano para o corretor "{form.getValues("nome")}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Plano</Label>
              <Select value={selectedPlanoId} onValueChange={setSelectedPlanoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {planos.map((plano) => (
                    <SelectItem key={plano.id} value={plano.id}>
                      {plano.nome} - {formatCurrency(plano.valor_mensal)}/mês
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssinaturaDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAssinatura} disabled={isSavingAssinatura || !selectedPlanoId}>
              {isSavingAssinatura ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
}
