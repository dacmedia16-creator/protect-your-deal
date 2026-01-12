import { useState, useEffect } from 'react';
import { ImobiliariaLayout } from '@/components/layouts/ImobiliariaLayout';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EquipeBadge } from '@/components/EquipeBadge';
import {
  Plus,
  Users,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  Loader2,
  Search,
  Crown,
} from 'lucide-react';
import { toast } from 'sonner';

interface Equipe {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string;
  ativa: boolean;
  lider_id: string | null;
  lider?: { id: string; nome: string } | null;
  membros_count?: number;
}

interface Corretor {
  id: string;
  nome: string;
  equipe_id?: string;
}

interface Membro {
  id: string;
  user_id: string;
  cargo: string;
  entrou_em: string;
  profile: { nome: string };
}

const CORES = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#6366F1', // indigo
  '#84CC16', // lime
];

export default function EmpresaEquipes() {
  const { imobiliariaId } = useUserRole();
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [corretores, setCorretores] = useState<Corretor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [membrosDialogOpen, setMembrosDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingEquipe, setEditingEquipe] = useState<Equipe | null>(null);
  const [selectedEquipe, setSelectedEquipe] = useState<Equipe | null>(null);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [loadingMembros, setLoadingMembros] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cor, setCor] = useState(CORES[0]);
  const [liderId, setLiderId] = useState<string>('');

  useEffect(() => {
    if (imobiliariaId) {
      fetchData();
    }
  }, [imobiliariaId]);

  async function fetchData() {
    setLoading(true);
    
    // Fetch equipes with member count
    const { data: equipesData } = await supabase
      .from('equipes')
      .select(`
        *,
        lider:profiles!equipes_lider_id_fkey(id, nome)
      `)
      .eq('imobiliaria_id', imobiliariaId)
      .order('nome');

    // Fetch member counts for each equipe
    if (equipesData) {
      const equipesWithCount = await Promise.all(
        equipesData.map(async (equipe) => {
          const { count } = await supabase
            .from('equipes_membros')
            .select('*', { count: 'exact', head: true })
            .eq('equipe_id', equipe.id);
          
          return { ...equipe, membros_count: count || 0 };
        })
      );
      setEquipes(equipesWithCount);
    }

    // Fetch all corretores for the dropdown
    const { data: corretoresData } = await supabase
      .from('profiles')
      .select('id, nome')
      .eq('imobiliaria_id', imobiliariaId)
      .order('nome');

    setCorretores(corretoresData || []);
    setLoading(false);
  }

  async function handleSaveEquipe() {
    if (!nome.trim()) {
      toast.error('Digite o nome da equipe');
      return;
    }

    setSaving(true);

    try {
      if (editingEquipe) {
        // Update
        const { error } = await supabase
          .from('equipes')
          .update({
            nome: nome.trim(),
            descricao: descricao.trim() || null,
            cor,
            lider_id: liderId || null,
          })
          .eq('id', editingEquipe.id);

        if (error) throw error;
        toast.success('Equipe atualizada com sucesso!');
      } else {
        // Create
        const { error } = await supabase
          .from('equipes')
          .insert({
            imobiliaria_id: imobiliariaId,
            nome: nome.trim(),
            descricao: descricao.trim() || null,
            cor,
            lider_id: liderId || null,
          });

        if (error) throw error;
        toast.success('Equipe criada com sucesso!');
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar equipe');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEquipe() {
    if (!selectedEquipe) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('equipes')
        .delete()
        .eq('id', selectedEquipe.id);

      if (error) throw error;
      toast.success('Equipe excluída com sucesso!');
      setDeleteDialogOpen(false);
      setSelectedEquipe(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir equipe');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAtiva(equipe: Equipe) {
    try {
      const { error } = await supabase
        .from('equipes')
        .update({ ativa: !equipe.ativa })
        .eq('id', equipe.id);

      if (error) throw error;
      toast.success(equipe.ativa ? 'Equipe desativada' : 'Equipe ativada');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar status');
    }
  }

  async function openMembrosDialog(equipe: Equipe) {
    setSelectedEquipe(equipe);
    setMembrosDialogOpen(true);
    setLoadingMembros(true);

    const { data } = await supabase
      .from('equipes_membros')
      .select(`
        id,
        user_id,
        cargo,
        entrou_em,
        profile:profiles!equipes_membros_user_id_fkey(nome)
      `)
      .eq('equipe_id', equipe.id)
      .order('entrou_em');

    setMembros((data as any) || []);
    setLoadingMembros(false);
  }

  async function addMembro(userId: string) {
    if (!selectedEquipe) return;

    try {
      const { error } = await supabase
        .from('equipes_membros')
        .insert({
          equipe_id: selectedEquipe.id,
          user_id: userId,
          cargo: 'corretor',
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Este corretor já está na equipe');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Membro adicionado!');
      openMembrosDialog(selectedEquipe);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao adicionar membro');
    }
  }

  async function removeMembro(membroId: string) {
    if (!selectedEquipe) return;

    try {
      const { error } = await supabase
        .from('equipes_membros')
        .delete()
        .eq('id', membroId);

      if (error) throw error;
      toast.success('Membro removido!');
      openMembrosDialog(selectedEquipe);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover membro');
    }
  }

  function openEditDialog(equipe: Equipe) {
    setEditingEquipe(equipe);
    setNome(equipe.nome);
    setDescricao(equipe.descricao || '');
    setCor(equipe.cor);
    setLiderId(equipe.lider_id || '');
    setDialogOpen(true);
  }

  function openCreateDialog() {
    resetForm();
    setDialogOpen(true);
  }

  function resetForm() {
    setEditingEquipe(null);
    setNome('');
    setDescricao('');
    setCor(CORES[0]);
    setLiderId('');
  }

  const filteredEquipes = equipes.filter(e => 
    e.nome.toLowerCase().includes(search.toLowerCase())
  );

  const membrosIds = membros.map(m => m.user_id);
  const availableCorretores = corretores.filter(c => !membrosIds.includes(c.id));

  if (loading) {
    return (
      <ImobiliariaLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ImobiliariaLayout>
    );
  }

  return (
    <ImobiliariaLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Equipes</h1>
            <p className="text-muted-foreground">
              Organize seus corretores em equipes
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Equipe
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar equipe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Equipes Grid */}
        {filteredEquipes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma equipe encontrada</h3>
              <p className="text-muted-foreground text-center mb-4">
                Crie equipes para organizar seus corretores
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Equipe
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEquipes.map((equipe) => (
              <Card key={equipe.id} className={!equipe.ativa ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: equipe.cor }}
                      />
                      <CardTitle className="text-lg">{equipe.nome}</CardTitle>
                    </div>
                    {!equipe.ativa && (
                      <Badge variant="secondary">Inativa</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {equipe.descricao && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {equipe.descricao}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{equipe.membros_count} membros</span>
                    </div>
                    {equipe.lider && (
                      <div className="flex items-center gap-1">
                        <Crown className="h-4 w-4 text-warning" />
                        <span className="truncate">{equipe.lider.nome}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openMembrosDialog(equipe)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Membros
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(equipe)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedEquipe(equipe);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog Criar/Editar Equipe */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEquipe ? 'Editar Equipe' : 'Nova Equipe'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Equipe *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Vendas Premium"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descrição opcional da equipe"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {CORES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      cor === c ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setCor(c)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lider">Líder da Equipe</Label>
              <Select value={liderId} onValueChange={setLiderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um líder (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {corretores.map((corretor) => (
                    <SelectItem key={corretor.id} value={corretor.id}>
                      {corretor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEquipe} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingEquipe ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Gerenciar Membros */}
      <Dialog open={membrosDialogOpen} onOpenChange={setMembrosDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedEquipe?.cor }}
              />
              Membros: {selectedEquipe?.nome}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add member */}
            <div className="flex gap-2">
              <Select onValueChange={addMembro}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Adicionar corretor à equipe..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCorretores.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Todos os corretores já estão na equipe
                    </SelectItem>
                  ) : (
                    availableCorretores.map((corretor) => (
                      <SelectItem key={corretor.id} value={corretor.id}>
                        {corretor.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Members list */}
            {loadingMembros ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : membros.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum membro nesta equipe
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Desde</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membros.map((membro) => (
                    <TableRow key={membro.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {membro.profile?.nome}
                          {membro.user_id === selectedEquipe?.lider_id && (
                            <Crown className="h-4 w-4 text-warning" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{membro.cargo}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(membro.entrou_em).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMembro(membro.id)}
                        >
                          <UserMinus className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Equipe</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Tem certeza que deseja excluir a equipe "{selectedEquipe?.nome}"?
            Todos os membros serão desvinculados.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteEquipe} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ImobiliariaLayout>
  );
}