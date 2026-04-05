import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Star, Loader2, Upload, X, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface DepoimentoForm {
  nome: string;
  cargo: string;
  empresa: string;
  texto: string;
  nota: number;
  ordem: number;
  ativo: boolean;
  avatar_url: string | null;
}

const emptyForm: DepoimentoForm = {
  nome: '', cargo: '', empresa: '', texto: '', nota: 5, ordem: 0, ativo: true, avatar_url: null,
};

export default function AdminDepoimentos() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DepoimentoForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: depoimentos, isLoading } = useQuery({
    queryKey: ['admin-depoimentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('depoimentos')
        .select('*')
        .order('ordem', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 2MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('depoimentos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('depoimentos')
        .getPublicUrl(fileName);

      setForm(f => ({ ...f, avatar_url: urlData.publicUrl }));
      toast.success('Foto enviada');
    } catch {
      toast.error('Erro ao enviar foto');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (form.avatar_url) {
      try {
        const url = new URL(form.avatar_url);
        const pathParts = url.pathname.split('/depoimentos/');
        if (pathParts[1]) {
          await supabase.storage.from('depoimentos').remove([pathParts[1]]);
        }
      } catch { /* ignore deletion errors */ }
    }
    setForm(f => ({ ...f, avatar_url: null }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: form.nome,
        cargo: form.cargo || null,
        empresa: form.empresa || null,
        texto: form.texto,
        nota: form.nota,
        ordem: form.ordem,
        ativo: form.ativo,
        avatar_url: form.avatar_url,
      };
      if (editingId) {
        const { error } = await supabase.from('depoimentos').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('depoimentos').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-depoimentos'] });
      toast.success(editingId ? 'Depoimento atualizado' : 'Depoimento criado');
      closeDialog();
    },
    onError: () => toast.error('Erro ao salvar depoimento'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('depoimentos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-depoimentos'] });
      toast.success('Depoimento removido');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from('depoimentos').update({ ativo }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-depoimentos'] }),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openEdit = (d: any) => {
    setEditingId(d.id);
    setForm({
      nome: d.nome, cargo: d.cargo || '', empresa: d.empresa || '',
      texto: d.texto, nota: d.nota, ordem: d.ordem, ativo: d.ativo,
      avatar_url: d.avatar_url || null,
    });
    setDialogOpen(true);
  };

  return (<div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Depoimentos</h1>
            <p className="text-muted-foreground">Gerencie os depoimentos exibidos na landing page</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button onClick={() => { setForm(emptyForm); setEditingId(null); }}>
                <Plus className="h-4 w-4 mr-2" /> Novo Depoimento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar' : 'Novo'} Depoimento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Photo upload */}
                <div>
                  <Label>Foto</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={form.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {form.nome ? form.nome.charAt(0).toUpperCase() : <User className="h-6 w-6" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploading}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                          {form.avatar_url ? 'Trocar' : 'Enviar'}
                        </Button>
                        {form.avatar_url && (
                          <Button type="button" variant="ghost" size="sm" onClick={handleRemovePhoto}>
                            <X className="h-4 w-4 mr-1" /> Remover
                          </Button>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">Imagem até 2MB</span>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>

                <div>
                  <Label>Nome *</Label>
                  <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cargo</Label>
                    <Input value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} placeholder="Ex: Corretor" />
                  </div>
                  <div>
                    <Label>Empresa</Label>
                    <Input value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))} placeholder="Ex: Imobiliária XYZ" />
                  </div>
                </div>
                <div>
                  <Label>Depoimento *</Label>
                  <Textarea value={form.texto} onChange={e => setForm(f => ({ ...f, texto: e.target.value }))} rows={4} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nota (1-5)</Label>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} type="button" onClick={() => setForm(f => ({ ...f, nota: n }))}>
                          <Star className={`h-6 w-6 ${n <= form.nota ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Ordem</Label>
                    <Input type="number" value={form.ordem} onChange={e => setForm(f => ({ ...f, ordem: parseInt(e.target.value) || 0 }))} />
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => saveMutation.mutate()}
                  disabled={!form.nome || !form.texto || saveMutation.isPending || uploading}
                >
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : !depoimentos?.length ? (
              <div className="text-center py-12 text-muted-foreground">Nenhum depoimento cadastrado</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ordem</TableHead>
                    <TableHead>Foto</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cargo/Empresa</TableHead>
                    <TableHead>Nota</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {depoimentos.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.ordem}</TableCell>
                      <TableCell>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={d.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {d.nome?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{d.nome}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {[d.cargo, d.empresa].filter(Boolean).join(' · ') || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < d.nota ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/20'}`} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={d.ativo}
                          onCheckedChange={(checked) => toggleMutation.mutate({ id: d.id, ativo: checked })}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => {
                              if (confirm('Remover este depoimento?')) deleteMutation.mutate(d.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>);
}
