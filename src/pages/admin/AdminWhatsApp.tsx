import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { MessageCircle, Send, Search, Users, CheckCircle2, XCircle, Loader2, Pause, Play } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { whatsappEngine, type EngineState, type SendResult } from '@/lib/whatsappSendEngine';

interface UserWithRole {
  user_id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  role: string;
  imobiliaria_id: string | null;
  imobiliaria_nome: string | null;
}

export default function AdminWhatsApp() {
  useDocumentTitle('WhatsApp - Admin');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [imobiliariaFilter, setImobiliariaFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');

  // Engine state synced from global singleton
  const [engineState, setEngineState] = useState<EngineState>(whatsappEngine.getState());

  useEffect(() => {
    // Sync immediately on mount (engine may already be running)
    setEngineState(whatsappEngine.getState());
    return whatsappEngine.subscribe(setEngineState);
  }, []);

  // Warn before closing tab during send
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (engineState.isRunning) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [engineState.isRunning]);

  // Show toast when engine finishes
  const prevRunning = useState(engineState.isRunning)[0];
  useEffect(() => {
    if (!engineState.isRunning && engineState.results.length > 0 && engineState.progress.sent === engineState.progress.total) {
      const s = engineState.progress.success;
      const f = engineState.progress.failed;
      if (f === 0) toast.success(`${s} mensagem(ns) enviada(s) com sucesso!`);
      else toast.warning(`${s} enviada(s), ${f} falha(s)`);
    }
  }, [engineState.isRunning]);

  // Fetch users with phone numbers
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-whatsapp-users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, nome, telefone, email')
        .not('telefone', 'is', null)
        .neq('telefone', '');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, imobiliaria_id');

      if (rolesError) throw rolesError;

      const { data: imobiliarias } = await supabase
        .from('imobiliarias')
        .select('id, nome');

      const imobMap = new Map(imobiliarias?.map(i => [i.id, i.nome]) || []);
      const roleMap = new Map(roles?.map(r => [r.user_id, r]) || []);

      const result: UserWithRole[] = (profiles || [])
        .filter(p => p.telefone && p.telefone.length >= 8)
        .map(p => {
          const r = roleMap.get(p.user_id);
          return {
            user_id: p.user_id,
            nome: p.nome,
            telefone: p.telefone,
            email: p.email,
            role: r?.role || 'sem_role',
            imobiliaria_id: r?.imobiliaria_id || null,
            imobiliaria_nome: r?.imobiliaria_id ? imobMap.get(r.imobiliaria_id) || null : null,
          };
        });

      return result;
    },
  });

  // Fetch imobiliarias for filter
  const { data: imobiliarias = [] } = useQuery({
    queryKey: ['admin-whatsapp-imobiliarias'],
    queryFn: async () => {
      const { data } = await supabase.from('imobiliarias').select('id, nome').order('nome');
      return data || [];
    },
  });

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (imobiliariaFilter !== 'all') {
        if (imobiliariaFilter === 'none' && u.imobiliaria_id) return false;
        if (imobiliariaFilter !== 'none' && u.imobiliaria_id !== imobiliariaFilter) return false;
      }
      if (search) {
        const s = search.toLowerCase();
        return (
          u.nome.toLowerCase().includes(s) ||
          u.telefone?.includes(s) ||
          u.email?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [users, roleFilter, imobiliariaFilter, search]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUsers.map(u => u.user_id)));
    }
  };

  const roleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: 'Super Admin',
      imobiliaria_admin: 'Admin Imob.',
      corretor: 'Corretor',
      sem_role: 'Sem Role',
    };
    return labels[role] || role;
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }
    if (selectedIds.size === 0) {
      toast.error('Selecione ao menos um destinatário');
      return;
    }

    const selectedUsers = users.filter(u => selectedIds.has(u.user_id));

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    whatsappEngine.start(selectedUsers, message, token);
  };

  const { isRunning, isPaused, progress: sendProgress, results: sendResults, countdown } = engineState;
  const allFilteredSelected = filteredUsers.length > 0 && selectedIds.size === filteredUsers.length;

  return (<div className="space-y-6">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold">Envio de WhatsApp</h1>
            <p className="text-muted-foreground text-sm">Envie mensagens de texto livre para usuários do sistema</p>
          </div>
        </div>

        {/* Message Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mensagem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Digite sua mensagem... Use {nome} para inserir o nome do usuário"
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              disabled={isRunning}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Variáveis: <code className="bg-muted px-1 rounded">{'{nome}'}</code> = nome do usuário
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{selectedIds.size} selecionado(s)</Badge>
                <Button onClick={handleSend} disabled={isRunning || selectedIds.size === 0 || !message.trim()}>
                  {isRunning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Enviar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        {(isRunning || sendResults.length > 0) && (
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {isRunning && (
                    <Button
                      variant={isPaused ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => whatsappEngine.togglePause()}
                      className="h-8 w-8 p-0"
                    >
                      {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </Button>
                  )}
                  <span>
                    {isPaused
                      ? `⏸ Pausado — ${whatsappEngine.pendingCount} restante(s)`
                      : countdown > 0
                        ? `Aguardando ${countdown}s antes do próximo envio...`
                        : `${sendProgress.sent} de ${sendProgress.total} enviado(s)`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-4 w-4" /> {sendProgress.success}
                  </span>
                  <span className="flex items-center gap-1 text-destructive">
                    <XCircle className="h-4 w-4" /> {sendProgress.failed}
                  </span>
                </div>
              </div>
              <Progress value={sendProgress.total > 0 ? (sendProgress.sent / sendProgress.total) * 100 : 0} />
            </CardContent>
          </Card>
        )}

        {/* Filters + Users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5" />
              Destinatários ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, telefone ou email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="imobiliaria_admin">Admin Imob.</SelectItem>
                  <SelectItem value="corretor">Corretor</SelectItem>
                </SelectContent>
              </Select>
              <Select value={imobiliariaFilter} onValueChange={setImobiliariaFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por imobiliária" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas imobiliárias</SelectItem>
                  <SelectItem value="none">Sem imobiliária</SelectItem>
                  {imobiliarias.map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={allFilteredSelected}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Selecionar todos"
                        />
                      </TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead className="hidden md:table-cell">Role</TableHead>
                      <TableHead className="hidden lg:table-cell">Imobiliária</TableHead>
                      {sendResults.length > 0 && <TableHead>Status</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum usuário encontrado com telefone cadastrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map(user => {
                        const result = sendResults.find(r => r.user_id === user.user_id);
                        return (
                          <TableRow key={user.user_id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.has(user.user_id)}
                                onCheckedChange={() => toggleSelect(user.user_id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{user.nome}</div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{user.telefone}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="outline" className="text-xs">{roleLabel(user.role)}</Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                              {user.imobiliaria_nome || '—'}
                            </TableCell>
                            {sendResults.length > 0 && (
                              <TableCell>
                                {result ? (
                                  result.success ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <span className="flex items-center gap-1 text-destructive text-xs">
                                      <XCircle className="h-4 w-4" />
                                      {result.error?.substring(0, 30)}
                                    </span>
                                  )
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>);
}
