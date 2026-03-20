import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Copy, Share2, Users, DollarSign, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DesktopNav } from '@/components/DesktopNav';
import { MobileNav } from '@/components/MobileNav';

export default function MinhasIndicacoes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [generatingCode, setGeneratingCode] = useState(false);

  // Fetch all referrals
  const { data: indicacoes, isLoading, refetch } = useQuery({
    queryKey: ['minhas-indicacoes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('indicacoes_corretor')
        .select('*')
        .eq('indicador_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Get or generate referral code
  async function handleGenerateCode() {
    setGeneratingCode(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-codigo-indicacao');
      if (error) throw error;
      if (data?.codigo) {
        toast.success('Código gerado com sucesso!');
        refetch();
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar código');
    } finally {
      setGeneratingCode(false);
    }
  }

  // Get the active referral code (pendente with no indicado)
  const codigoAtivo = indicacoes?.find(i => i.status === 'pendente' && !i.indicado_user_id && !i.indicado_imobiliaria_id)?.codigo;

  const baseUrl = window.location.origin;
  const linkCorretor = codigoAtivo ? `${baseUrl}/registro-autonomo?ind=${codigoAtivo}` : '';
  const linkImobiliaria = codigoAtivo ? `${baseUrl}/registro?ind=${codigoAtivo}` : '';

  function copyLink(link: string, tipo: string) {
    navigator.clipboard.writeText(link);
    toast.success(`Link de indicação para ${tipo} copiado!`);
  }

  // Filter out the placeholder entry
  const indicacoesReais = indicacoes?.filter(i => i.indicado_user_id || i.indicado_imobiliaria_id) || [];

  const totalComissoesPendentes = indicacoesReais
    .filter(i => i.status === 'comissao_gerada' && !i.comissao_paga)
    .reduce((sum, i) => sum + (Number(i.valor_comissao) || 0), 0);

  const totalComissoesPagas = indicacoesReais
    .filter(i => i.comissao_paga)
    .reduce((sum, i) => sum + (Number(i.valor_comissao) || 0), 0);

  const statusBadge = (status: string, paga: boolean) => {
    if (paga) return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Paga</Badge>;
    switch (status) {
      case 'cadastrado': return <Badge variant="secondary">Cadastrado</Badge>;
      case 'comissao_gerada': return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">Comissão Pendente</Badge>;
      case 'pendente': return <Badge variant="outline">Aguardando</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      <DesktopNav />

      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold">Minhas Indicações</h1>
            <p className="text-sm text-muted-foreground">Indique corretores e imobiliárias e ganhe comissão</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{indicacoesReais.length}</p>
              <p className="text-xs text-muted-foreground">Indicados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 text-amber-500" />
              <p className="text-2xl font-bold text-amber-600">
                {totalComissoesPendentes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
              <p className="text-2xl font-bold text-emerald-600">
                {totalComissoesPagas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-xs text-muted-foreground">Recebidas</p>
            </CardContent>
          </Card>
        </div>

        {/* Referral Links */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Links de Indicação
            </CardTitle>
            <CardDescription>
              Compartilhe esses links para indicar novos corretores ou imobiliárias
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!codigoAtivo ? (
              <Button onClick={handleGenerateCode} disabled={generatingCode}>
                {generatingCode ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Share2 className="h-4 w-4 mr-2" />}
                Gerar meu código de indicação
              </Button>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Seu código: <span className="text-primary font-bold">{codigoAtivo}</span></p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Para Corretores:</label>
                  <div className="flex gap-2">
                    <code className="flex-1 text-xs bg-muted p-2 rounded truncate">{linkCorretor}</code>
                    <Button size="sm" variant="outline" onClick={() => copyLink(linkCorretor, 'corretores')}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Para Imobiliárias:</label>
                  <div className="flex gap-2">
                    <code className="flex-1 text-xs bg-muted p-2 rounded truncate">{linkImobiliaria}</code>
                    <Button size="sm" variant="outline" onClick={() => copyLink(linkImobiliaria, 'imobiliárias')}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Referrals Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Histórico de Indicações</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : indicacoesReais.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma indicação realizada ainda. Compartilhe seu link!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Comissão</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {indicacoesReais.map((ind) => (
                      <TableRow key={ind.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {ind.tipo_indicado === 'imobiliaria' ? 'Imobiliária' : 'Corretor'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{ind.codigo}</TableCell>
                        <TableCell>
                          {Number(ind.valor_comissao) > 0
                            ? Number(ind.valor_comissao).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            : ind.tipo_comissao_indicacao === 'primeira_mensalidade'
                              ? '1ª mensalidade'
                              : `${ind.comissao_percentual}%`}
                        </TableCell>
                        <TableCell>{statusBadge(ind.status, ind.comissao_paga)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(ind.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <MobileNav />
    </div>
  );
}
