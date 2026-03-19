import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AfiliadoLayout } from "@/components/layouts/AfiliadoLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Ticket, DollarSign, TrendingUp, CheckCircle, Clock, Users, ArrowUpRight, ArrowDownRight, Link as LinkIcon, Copy, Check as CheckIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0">
      {copied ? <CheckIcon className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

export default function AfiliadoDashboard() {
  const { user } = useAuth();

  // Buscar dados do afiliado
  const { data: afiliado, isLoading: loadingAfiliado } = useQuery({
    queryKey: ["afiliado-dados", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("afiliados")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Buscar cupons do afiliado
  const { data: cupons, isLoading: loadingCupons } = useQuery({
    queryKey: ["afiliado-cupons", afiliado?.id],
    queryFn: async () => {
      if (!afiliado) return [];
      
      const { data, error } = await supabase
        .from("cupons")
        .select("*")
        .eq("afiliado_id", afiliado.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!afiliado,
  });

  // Buscar usos dos cupons (comissões diretas)
  const { data: usos, isLoading: loadingUsos } = useQuery({
    queryKey: ["afiliado-usos", cupons],
    queryFn: async () => {
      if (!cupons || cupons.length === 0) return [];
      
      const cupomIds = cupons.map((c) => c.id);
      
      const { data, error } = await supabase
        .from("cupons_usos")
        .select(`
          *,
          cupom:cupons (codigo),
          imobiliaria:imobiliarias (nome)
        `)
        .in("cupom_id", cupomIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!cupons && cupons.length > 0,
  });

  // Buscar comissões indiretas (via afiliado_id)
  const { data: comissoesIndiretas, isLoading: loadingIndiretas } = useQuery({
    queryKey: ["afiliado-indiretas", afiliado?.id],
    queryFn: async () => {
      if (!afiliado) return [];
      
      const { data, error } = await supabase
        .from("cupons_usos")
        .select(`
          *,
          cupom:cupons (codigo),
          imobiliaria:imobiliarias (nome)
        `)
        .eq("afiliado_id", afiliado.id)
        .eq("tipo_comissao", "indireta")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!afiliado,
  });

  // Buscar afiliados indicados
  const { data: rede } = useQuery({
    queryKey: ["afiliado-rede", afiliado?.id],
    queryFn: async () => {
      if (!afiliado) return [];
      
      const { data, error } = await supabase
        .from("afiliados")
        .select("id, nome, email, ativo")
        .eq("indicado_por", afiliado.id)
        .order("nome");

      if (error) throw error;
      return data || [];
    },
    enabled: !!afiliado,
  });

  const isLoading = loadingAfiliado || loadingCupons || loadingUsos || loadingIndiretas;

  // Cálculos de estatísticas
  const totalCadastros = usos?.length || 0;
  const comissaoDiretaPendente = usos?.filter((u: any) => !u.comissao_paga).reduce((sum: number, u: any) => sum + Number(u.valor_comissao), 0) || 0;
  const comissaoIndiretaPendente = comissoesIndiretas?.filter((u: any) => !u.comissao_paga).reduce((sum: number, u: any) => sum + Number(u.valor_comissao), 0) || 0;
  const comissaoPendente = comissaoDiretaPendente + comissaoIndiretaPendente;
  const comissaoDiretaPaga = usos?.filter((u: any) => u.comissao_paga).reduce((sum: number, u: any) => sum + Number(u.valor_comissao), 0) || 0;
  const comissaoIndiretaPaga = comissoesIndiretas?.filter((u: any) => u.comissao_paga).reduce((sum: number, u: any) => sum + Number(u.valor_comissao), 0) || 0;
  const comissaoPaga = comissaoDiretaPaga + comissaoIndiretaPaga;
  const cuponsAtivos = cupons?.filter((c: any) => c.ativo).length || 0;
  const totalRede = rede?.length || 0;

  if (!afiliado && !isLoading) {
    return (
      <AfiliadoLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Conta não vinculada</h1>
          <p className="text-muted-foreground max-w-md">
            Sua conta ainda não está vinculada a um perfil de afiliado. 
            Entre em contato com o administrador para ativar seu acesso.
          </p>
        </div>
      </AfiliadoLayout>
    );
  }

  return (
    <AfiliadoLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo(a), {afiliado?.nome || "Afiliado"}!
          </p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Cadastros</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCadastros}</div>
              <p className="text-xs text-muted-foreground">
                Clientes cadastrados com seus cupons
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comissão Pendente</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                R$ {comissaoPendente.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Aguardando pagamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comissão Paga</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {comissaoPaga.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total já recebido
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cupons Ativos</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cuponsAtivos}</div>
              <p className="text-xs text-muted-foreground">
                Cupons disponíveis para uso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Minha Rede</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRede}</div>
              <p className="text-xs text-muted-foreground">
                Afiliados indicados por você
              </p>
            </CardContent>
          </Card>

          {comissaoIndiretaPendente + comissaoIndiretaPaga > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Comissão Indireta</CardTitle>
                <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  R$ {(comissaoIndiretaPendente + comissaoIndiretaPaga).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total ganho via rede (2º nível)
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Meu Link de Indicação */}
        {cupons && cupons.filter(c => c.ativo).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Meu Link de Indicação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cupons.filter(c => c.ativo).map((cupom) => {
                const link = `${window.location.origin}/registro-tipo?ref=${cupom.codigo}`;
                return (
                  <div key={cupom.id} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <code className="flex-1 text-sm truncate">{link}</code>
                    <CopyButton text={link} />
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground">
                Compartilhe este link para que novos clientes se cadastrem com seu cupom automaticamente.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Lista de Cupons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Meus Cupons
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : !cupons || cupons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum cupom cadastrado ainda
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead className="text-center">Usos</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cupons.map((cupom) => (
                    <TableRow key={cupom.id}>
                      <TableCell className="font-mono font-bold">{cupom.codigo}</TableCell>
                      <TableCell>
                        {cupom.tipo_desconto === "percentual" 
                          ? `${cupom.valor_desconto}%`
                          : `R$ ${cupom.valor_desconto.toFixed(2)}`
                        }
                      </TableCell>
                      <TableCell>{cupom.comissao_percentual}%</TableCell>
                      <TableCell className="text-center">
                        {cupom.usos_atuais}
                        {cupom.max_usos && ` / ${cupom.max_usos}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant={cupom.ativo ? "default" : "secondary"}>
                          {cupom.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Últimos Cadastros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Últimos Cadastros
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : !usos || usos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum cadastro realizado ainda
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Cupom</TableHead>
                    <TableHead className="text-right">Comissão</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usos.slice(0, 10).map((uso) => (
                    <TableRow key={uso.id}>
                      <TableCell>
                        {format(new Date(uso.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{uso.imobiliaria?.nome || "Cliente"}</TableCell>
                      <TableCell className="font-mono">{uso.cupom?.codigo}</TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {Number(uso.valor_comissao).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {uso.comissao_paga ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Pago
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AfiliadoLayout>
  );
}