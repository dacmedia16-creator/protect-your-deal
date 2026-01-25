import { useEffect, useState, useCallback } from 'react';
import { fichaStatusColors, getStatusColor } from '@/lib/statusColors';
import { ImobiliariaLayout } from '@/components/layouts/ImobiliariaLayout';
import { useUserRole } from '@/hooks/useUserRole';
import { useFichaNotification } from '@/hooks/useFichaNotification';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Loader2, Eye, Search, PartyPopper, MapPin, Calendar, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';
import { DeleteFichaDialog } from '@/components/DeleteFichaDialog';

interface Ficha {
  id: string;
  protocolo: string;
  imovel_endereco: string;
  proprietario_nome: string | null;
  comprador_nome: string | null;
  data_visita: string;
  status: string;
  corretor_nome?: string;
  convertido_venda?: boolean;
}

export default function EmpresaFichas() {
  const { imobiliariaId } = useUserRole();
  const navigate = useNavigate();
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Hook de notificação para fichas confirmadas
  useFichaNotification();

  const fetchFichas = useCallback(async () => {
    if (!imobiliariaId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fichas_visita')
        .select('id, protocolo, imovel_endereco, proprietario_nome, comprador_nome, data_visita, status, user_id, convertido_venda')
        .eq('imobiliaria_id', imobiliariaId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch corretor names (only for non-null user_ids)
      const userIds = [...new Set((data || []).filter(f => f.user_id).map(f => f.user_id))];
      
      let corretorMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, nome')
          .in('user_id', userIds);

        corretorMap = (profiles || []).reduce((acc, p) => {
          acc[p.user_id] = p.nome;
          return acc;
        }, {} as Record<string, string>);
      }

      const enrichedFichas = (data || []).map(f => ({
        ...f,
        corretor_nome: f.user_id 
          ? (corretorMap[f.user_id] || 'Desconhecido')
          : null, // Null indicates orphaned ficha
        convertido_venda: f.convertido_venda ?? false
      }));

      setFichas(enrichedFichas);
    } catch (error) {
      console.error('Error fetching fichas:', error);
    } finally {
      setLoading(false);
    }
  }, [imobiliariaId]);

  useEffect(() => {
    fetchFichas();
  }, [fetchFichas]);

  const filteredFichas = fichas.filter(f =>
    f.protocolo.toLowerCase().includes(search.toLowerCase()) ||
    f.imovel_endereco.toLowerCase().includes(search.toLowerCase()) ||
    f.corretor_nome?.toLowerCase().includes(search.toLowerCase()) ||
    f.proprietario_nome?.toLowerCase().includes(search.toLowerCase()) ||
    f.comprador_nome?.toLowerCase().includes(search.toLowerCase())
  );

  const statusLabels: Record<string, string> = {
    pendente: 'Pendente',
    aguardando_proprietario: 'Aguard. Proprietário',
    aguardando_comprador: 'Aguard. Comprador',
    completo: 'Completo',
    finalizado_parcial: 'Finalizado',
    cancelado: 'Cancelado',
  };

  // Using fichaStatusColors from lib/statusColors

  if (loading) {
    return (
      <ImobiliariaLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ImobiliariaLayout>
    );
  }

  return (
    <ImobiliariaLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Registros de Visita</h1>
          <p className="text-muted-foreground">Visualize todos os registros da imobiliária</p>
        </div>

        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por protocolo, endereço, corretor..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredFichas.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhum registro encontrado</h3>
                <p className="text-muted-foreground">
                  {search ? 'Tente buscar por outro termo' : 'Ainda não há registros cadastrados'}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Layout - Cards clicáveis */}
                <div className="space-y-3 md:hidden">
                  {filteredFichas.map((ficha) => (
                    <Card 
                      key={ficha.id}
                      className="cursor-pointer hover:shadow-md active:bg-muted/30 transition-all"
                      onClick={() => navigate(`/fichas/${ficha.id}`)}
                    >
                      <CardContent className="p-3 space-y-2">
                        {/* Header: Protocolo + Status */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-xs font-medium text-primary">
                            #{ficha.protocolo}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <Badge variant="outline" className={getStatusColor(fichaStatusColors, ficha.status)}>
                              {statusLabels[ficha.status] || ficha.status}
                            </Badge>
                            {ficha.convertido_venda && (
                              <Badge variant="outline" className="bg-success/20 text-success border-success/30 gap-1">
                                <PartyPopper className="h-3 w-3" />
                                Vendido
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Endereço */}
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <p className="text-sm font-medium line-clamp-2">{ficha.imovel_endereco}</p>
                        </div>
                        
                        {/* Info: Corretor + Data */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            <span>
                              {ficha.corretor_nome || (
                                <span className="italic">(Corretor removido)</span>
                              )}
                            </span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{format(new Date(ficha.data_visita), "dd/MM/yy", { locale: ptBR })}</span>
                          </div>
                        </div>
                        
                        {/* Footer com delete */}
                        <div 
                          className="flex justify-end pt-2 border-t border-border/50" 
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DeleteFichaDialog 
                            fichaId={ficha.id} 
                            protocolo={ficha.protocolo}
                            onDeleted={fetchFichas}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop Layout - Tabela */}
                <div className="overflow-x-auto hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Protocolo</TableHead>
                        <TableHead>Corretor</TableHead>
                        <TableHead className="hidden lg:table-cell">Endereço</TableHead>
                        <TableHead className="hidden xl:table-cell">Proprietário</TableHead>
                        <TableHead className="hidden xl:table-cell">Comprador</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px] text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFichas.map((ficha) => (
                        <TableRow key={ficha.id}>
                          <TableCell className="font-mono text-sm">{ficha.protocolo}</TableCell>
                          <TableCell>
                            {ficha.corretor_nome ? (
                              ficha.corretor_nome
                            ) : (
                              <span className="text-muted-foreground italic text-sm">
                                (Corretor removido)
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell max-w-[200px] truncate">
                            {ficha.imovel_endereco}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {ficha.proprietario_nome || '-'}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {ficha.comprador_nome || '-'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(ficha.data_visita), "dd/MM/yy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className={getStatusColor(fichaStatusColors, ficha.status)}>
                                {statusLabels[ficha.status] || ficha.status}
                              </Badge>
                              {ficha.convertido_venda && (
                                <Badge variant="outline" className="bg-success/20 text-success border-success/30 gap-1">
                                  <PartyPopper className="h-3 w-3" />
                                  Vendido
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link to={`/fichas/${ficha.id}`}>
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <DeleteFichaDialog 
                                fichaId={ficha.id} 
                                protocolo={ficha.protocolo}
                                onDeleted={fetchFichas}
                              />
                            </div>
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
      </div>
    </ImobiliariaLayout>
  );
}
