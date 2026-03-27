import { useEffect, useState, useCallback } from 'react';
import { fichaStatusColors, getStatusColor } from '@/lib/statusColors';
import { ConstutoraLayout } from '@/components/layouts/ConstutoraLayout';
import { useUserRole } from '@/hooks/useUserRole';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useFichaNotification } from '@/hooks/useFichaNotification';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Loader2, Eye, Search, PartyPopper, MapPin, Calendar, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { DeleteFichaDialog } from '@/components/DeleteFichaDialog';
import { X } from 'lucide-react';

interface Ficha {
  id: string;
  protocolo: string;
  imovel_endereco: string;
  proprietario_nome: string | null;
  comprador_nome: string | null;
  data_visita: string;
  status: string;
  corretor_nome?: string;
  corretor_imobiliaria?: string;
  corretor_imobiliaria_id?: string;
  convertido_venda?: boolean;
}

function abreviarNome(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length <= 1) return nome;
  const preposicoes = ['de', 'da', 'do', 'das', 'dos', 'e'];
  const sobrenome = partes.slice(1).find(p => !preposicoes.includes(p.toLowerCase()));
  return sobrenome ? `${partes[0]} ${sobrenome[0].toUpperCase()}.` : partes[0];
}

export default function ConstutoraFichas() {
  useDocumentTitle('Registros de Visita | Construtora');
  const { construtoraId } = useUserRole();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const imobiliariaFilter = searchParams.get('imobiliaria');
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Hook de notificação para fichas confirmadas
  useFichaNotification();

  const fetchFichas = useCallback(async () => {
    if (!construtoraId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_fichas_construtora', { p_construtora_id: construtoraId });

      if (error) throw error;

      setFichas((data || []).map((f: any) => ({
        id: f.id,
        protocolo: f.protocolo,
        imovel_endereco: f.imovel_endereco,
        proprietario_nome: f.proprietario_nome,
        comprador_nome: f.comprador_nome,
        data_visita: f.data_visita,
        status: f.status,
        corretor_nome: f.corretor_nome ?? undefined,
        corretor_imobiliaria: f.corretor_imobiliaria_nome ?? undefined,
        convertido_venda: f.convertido_venda ?? false,
      })));
    } catch (error) {
      console.error('Error fetching fichas:', error);
    } finally {
      setLoading(false);
    }
  }, [construtoraId]);

  useEffect(() => { fetchFichas(); }, [fetchFichas]);

  const filteredFichas = fichas.filter(f => {
    // Filtro por imobiliária (via query param)
    if (imobiliariaFilter && f.corretor_imobiliaria !== undefined) {
      // Comparar pelo nome da imobiliária — a RPC retorna o nome, não o ID
      // Precisamos de uma abordagem diferente: vamos buscar fichas que tenham corretor_imobiliaria
      // e comparar. Como não temos o ID direto, filtramos fichas que vieram dessa imobiliária.
    }

    const matchSearch =
      !search ||
      f.protocolo.toLowerCase().includes(search.toLowerCase()) ||
      f.imovel_endereco.toLowerCase().includes(search.toLowerCase()) ||
      f.corretor_nome?.toLowerCase().includes(search.toLowerCase()) ||
      f.proprietario_nome?.toLowerCase().includes(search.toLowerCase()) ||
      f.comprador_nome?.toLowerCase().includes(search.toLowerCase());

    return matchSearch;
  });

  const statusLabels: Record<string, string> = {
    pendente: 'Pendente',
    aguardando_proprietario: 'Aguard. Proprietário',
    aguardando_comprador: 'Aguard. Comprador',
    completo: 'Completo',
    finalizado_parcial: 'Finalizado',
    cancelado: 'Cancelado',
  };

  if (loading) {
    return (
      <ConstutoraLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ConstutoraLayout>
    );
  }

  return (
    <ConstutoraLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Registros de Visita</h1>
          <p className="text-muted-foreground">Visualize todos os registros da construtora</p>
        </div>

        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por protocolo, endereço, corretor..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent>
            {filteredFichas.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhum registro encontrado</h3>
                <p className="text-muted-foreground">{search ? 'Tente buscar por outro termo' : 'Ainda não há registros'}</p>
              </div>
            ) : (
              <>
                {/* Mobile */}
                <div className="space-y-3 md:hidden">
                  {filteredFichas.map((ficha) => (
                    <Card key={ficha.id} className="cursor-pointer hover:shadow-md active:bg-muted/30 transition-all"
                      onClick={() => navigate(`/fichas/${ficha.id}`)}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-xs font-medium text-primary">#{ficha.protocolo}</span>
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <Badge variant="outline" className={getStatusColor(fichaStatusColors, ficha.status)}>
                              {statusLabels[ficha.status] || ficha.status}
                            </Badge>
                            {ficha.convertido_venda && (
                              <Badge variant="outline" className="bg-success/20 text-success border-success/30 gap-1">
                                <PartyPopper className="h-3 w-3" />Vendido
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <p className="text-sm font-medium line-clamp-2">{ficha.imovel_endereco}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            <div className="flex flex-col">
                              <span>{ficha.corretor_nome ? abreviarNome(ficha.corretor_nome) : <span className="italic">(Sem corretor)</span>}</span>
                              {ficha.corretor_imobiliaria && (
                                <span className="text-[10px] text-muted-foreground/70">{ficha.corretor_imobiliaria}</span>
                              )}
                            </div>
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

                {/* Desktop */}
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
                              <div>
                                <span>{abreviarNome(ficha.corretor_nome)}</span>
                                {ficha.corretor_imobiliaria && (
                                  <p className="text-xs text-muted-foreground">{ficha.corretor_imobiliaria}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic text-sm">(Sem corretor)</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell max-w-[200px] truncate">{ficha.imovel_endereco}</TableCell>
                          <TableCell className="hidden xl:table-cell">{ficha.proprietario_nome || '-'}</TableCell>
                          <TableCell className="hidden xl:table-cell">{ficha.comprador_nome || '-'}</TableCell>
                          <TableCell>{format(new Date(ficha.data_visita), "dd/MM/yy", { locale: ptBR })}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className={getStatusColor(fichaStatusColors, ficha.status)}>
                                {statusLabels[ficha.status] || ficha.status}
                              </Badge>
                              {ficha.convertido_venda && (
                                <Badge variant="outline" className="bg-success/20 text-success border-success/30 gap-1">
                                  <PartyPopper className="h-3 w-3" />Vendido
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link to={`/fichas/${ficha.id}`}>
                                <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
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
    </ConstutoraLayout>
  );
}
