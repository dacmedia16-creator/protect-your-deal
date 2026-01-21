import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Archive, Download, Eye, Search, HardDrive, FileText, Calendar, Building2, User, Trash2, Loader2, FolderDown } from 'lucide-react';
import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';
import { SuperAdminLayout } from '@/components/layouts/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface BackupFile {
  name: string;
  visita_id: string;
  protocolo: string;
  size: number;
  created_at: string;
  imobiliaria_id: string | null;
  imobiliaria_nome: string | null;
  user_id: string | null;
  corretor_nome: string | null;
}

interface BackupGroup {
  id: string;
  type: 'imobiliaria' | 'corretor_autonomo';
  name: string;
  backups: BackupFile[];
  totalSize: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function groupBackups(backups: BackupFile[]): BackupGroup[] {
  const imobiliariaGroups = new Map<string, BackupFile[]>();
  const autonomoGroups = new Map<string, BackupFile[]>();
  const orfaos: BackupFile[] = [];

  backups.forEach(backup => {
    if (backup.imobiliaria_id && backup.imobiliaria_nome) {
      // Agrupar por imobiliária
      const existing = imobiliariaGroups.get(backup.imobiliaria_id) || [];
      existing.push(backup);
      imobiliariaGroups.set(backup.imobiliaria_id, existing);
    } else if (backup.user_id && backup.corretor_nome) {
      // Agrupar por corretor autônomo
      const existing = autonomoGroups.get(backup.user_id) || [];
      existing.push(backup);
      autonomoGroups.set(backup.user_id, existing);
    } else {
      // Backups sem ficha correspondente (órfãos)
      orfaos.push(backup);
    }
  });

  const groups: BackupGroup[] = [];

  // 1. Adicionar grupos de imobiliárias
  const imobiliariaEntries = Array.from(imobiliariaGroups.entries())
    .map(([id, groupBackups]) => ({
      id,
      type: 'imobiliaria' as const,
      name: groupBackups[0].imobiliaria_nome || 'Sem nome',
      backups: groupBackups,
      totalSize: groupBackups.reduce((acc, b) => acc + b.size, 0),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  groups.push(...imobiliariaEntries);

  // 2. Adicionar grupos de corretores autônomos
  const autonomoEntries = Array.from(autonomoGroups.entries())
    .map(([id, groupBackups]) => ({
      id,
      type: 'corretor_autonomo' as const,
      name: groupBackups[0].corretor_nome || 'Corretor Desconhecido',
      backups: groupBackups,
      totalSize: groupBackups.reduce((acc, b) => acc + b.size, 0),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  groups.push(...autonomoEntries);

  // 3. Adicionar grupo de órfãos (se houver)
  if (orfaos.length > 0) {
    groups.push({
      id: 'orfaos',
      type: 'corretor_autonomo',
      name: 'Backups Órfãos',
      backups: orfaos,
      totalSize: orfaos.reduce((acc, b) => acc + b.size, 0),
    });
  }

  return groups;
}

export default function AdminBackups() {
  const [search, setSearch] = useState('');
  const [deletingOrphans, setDeletingOrphans] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const queryClient = useQueryClient();

  const { data: backups, isLoading } = useQuery({
    queryKey: ['admin-backups'],
    queryFn: async () => {
      // List files from storage bucket
      const { data: files, error: storageError } = await supabase.storage
        .from('comprovantes-backup')
        .list('', { limit: 500, sortBy: { column: 'created_at', order: 'desc' } });

      if (storageError) throw storageError;
      if (!files || files.length === 0) return [];

      // Filter backup files (format: {protocolo}-backup-{timestamp}.pdf)
      const backupFiles = files.filter(f => f.name.includes('-backup-') && f.name.endsWith('.pdf'));
      
      if (backupFiles.length === 0) return [];

      // Extract protocols from filenames
      const protocolos = backupFiles.map(f => f.name.split('-backup-')[0]);

      // Fetch fichas data with imobiliaria info
      const { data: fichas, error: fichasError } = await supabase
        .from('fichas_visita')
        .select(`
          id, 
          protocolo, 
          imobiliaria_id,
          user_id,
          imobiliarias!left(nome)
        `)
        .in('protocolo', protocolos);

      if (fichasError) throw fichasError;

      // Buscar nomes dos corretores separadamente
      const userIds = fichas?.filter(f => f.user_id).map(f => f.user_id) || [];
      const uniqueUserIds = [...new Set(userIds)];

      let profilesMap = new Map<string, string>();
      if (uniqueUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, nome')
          .in('user_id', uniqueUserIds);
        
        profilesMap = new Map(profiles?.map(p => [p.user_id, p.nome]) || []);
      }

      const fichasMap = new Map(fichas?.map(f => [f.protocolo, {
        id: f.id,
        imobiliaria_id: f.imobiliaria_id,
        imobiliaria_nome: (f.imobiliarias as any)?.nome || null,
        user_id: f.user_id,
        corretor_nome: f.user_id ? profilesMap.get(f.user_id) || null : null,
      }]) || []);

      return backupFiles.map(f => {
        const protocolo = f.name.split('-backup-')[0];
        const fichaInfo = fichasMap.get(protocolo);
        return {
          name: f.name,
          visita_id: fichaInfo?.id || '',
          protocolo: protocolo,
          size: f.metadata?.size || 0,
          created_at: f.created_at,
          imobiliaria_id: fichaInfo?.imobiliaria_id || null,
          imobiliaria_nome: fichaInfo?.imobiliaria_nome || null,
          user_id: fichaInfo?.user_id || null,
          corretor_nome: fichaInfo?.corretor_nome || null,
        } as BackupFile;
      });
    },
  });

  const filteredBackups = backups?.filter(b =>
    b.protocolo.toLowerCase().includes(search.toLowerCase()) ||
    b.imobiliaria_nome?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const groups = groupBackups(filteredBackups);

  const totalSize = backups?.reduce((acc, b) => acc + b.size, 0) || 0;
  const lastBackup = backups?.[0]?.created_at;
  const totalImobiliarias = groups.filter(g => g.type === 'imobiliaria').length;

  const handleDownload = async (fileName: string, protocolo: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('comprovantes-backup')
        .download(fileName);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${protocolo}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Download iniciado');
    } catch (error) {
      toast.error('Erro ao baixar arquivo');
    }
  };

  const handleView = async (fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('comprovantes-backup')
        .createSignedUrl(fileName, 3600);

      if (error) throw error;

      window.open(data.signedUrl, '_blank');
    } catch (error) {
      toast.error('Erro ao visualizar arquivo');
    }
  };

  // Identificar backups órfãos
  const orphanGroup = groups.find(g => g.id === 'orfaos');
  const orphanCount = orphanGroup?.backups.length || 0;
  const orphanSize = orphanGroup?.totalSize || 0;

  const handleDeleteOrphans = async () => {
    if (!orphanGroup || orphanGroup.backups.length === 0) return;

    setDeletingOrphans(true);
    try {
      const filesToDelete = orphanGroup.backups.map(b => b.name);
      
      const { error } = await supabase
        .storage
        .from('comprovantes-backup')
        .remove(filesToDelete);

      if (error) throw error;

      toast.success(`${filesToDelete.length} backups órfãos excluídos com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['admin-backups'] });
    } catch (error) {
      console.error('Erro ao deletar backups órfãos:', error);
      toast.error('Erro ao excluir backups órfãos');
    } finally {
      setDeletingOrphans(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!backups || backups.length === 0) return;

    setDownloadingAll(true);
    try {
      const zip = new JSZip();
      let downloadedCount = 0;

      for (const backup of backups) {
        const { data, error } = await supabase.storage
          .from('comprovantes-backup')
          .download(backup.name);

        if (!error && data) {
          zip.file(`${backup.protocolo}.pdf`, data);
          downloadedCount++;
        }
      }

      if (downloadedCount === 0) {
        toast.error('Nenhum arquivo foi baixado');
        return;
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backups_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`${downloadedCount} backups baixados com sucesso!`);
    } catch (error) {
      console.error('Erro ao baixar backups:', error);
      toast.error('Erro ao baixar backups');
    } finally {
      setDownloadingAll(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Archive className="h-6 w-6" />
            Backups de Comprovantes
          </h1>
          <p className="text-muted-foreground">
            PDFs de backup gerados automaticamente quando fichas são finalizadas
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Backups</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{backups?.length || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Imobiliárias</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{totalImobiliarias}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Armazenamento Usado</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{formatBytes(totalSize)}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Último Backup</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : lastBackup ? (
                <div className="text-2xl font-bold">
                  {format(new Date(lastBackup), "dd/MM/yy HH:mm", { locale: ptBR })}
                </div>
              ) : (
                <div className="text-2xl font-bold text-muted-foreground">-</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por protocolo ou imobiliária..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {backups && backups.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleDownloadAll}
              disabled={downloadingAll}
            >
              {downloadingAll ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Baixando...
                </>
              ) : (
                <>
                  <FolderDown className="h-4 w-4" />
                  Baixar Todos ({backups.length})
                </>
              )}
            </Button>
          )}

          {orphanCount > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Limpar {orphanCount} órfão{orphanCount > 1 ? 's' : ''} ({formatBytes(orphanSize)})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Limpar backups órfãos?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Você está prestes a excluir <strong>{orphanCount}</strong> backup{orphanCount > 1 ? 's' : ''} órfão{orphanCount > 1 ? 's' : ''} 
                    que não possuem fichas correspondentes no sistema.
                    <br /><br />
                    <span className="text-destructive font-medium">
                      Esta ação não pode ser desfeita. Total: {formatBytes(orphanSize)}
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deletingOrphans}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteOrphans}
                    disabled={deletingOrphans}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deletingOrphans ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Excluindo...
                      </>
                    ) : (
                      'Excluir todos'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Grouped Backups */}
        {isLoading ? (
          <Card>
            <CardContent className="p-6 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {search ? 'Nenhum backup encontrado' : 'Nenhum backup gerado ainda'}
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" defaultValue={[]} className="space-y-2">
            {groups.map((group) => (
              <AccordionItem key={group.id} value={group.id} className="border rounded-lg bg-card">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3 flex-1">
                    {group.type === 'imobiliaria' ? (
                      <Building2 className="h-5 w-5 text-primary" />
                    ) : (
                      <User className="h-5 w-5 text-orange-500" />
                    )}
                    <span className="font-medium">{group.name}</span>
                    <Badge variant="secondary" className="ml-2">
                      {group.backups.length} {group.backups.length === 1 ? 'backup' : 'backups'}
                    </Badge>
                    <span className="text-sm text-muted-foreground ml-auto mr-4">
                      {formatBytes(group.totalSize)}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-0 pb-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Protocolo</TableHead>
                        <TableHead>Data do Backup</TableHead>
                        <TableHead>Tamanho</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.backups.map((backup) => (
                        <TableRow key={backup.name}>
                          <TableCell>
                            <Link
                              to={`/admin/fichas`}
                              className="font-medium text-primary hover:underline"
                            >
                              {backup.protocolo}
                            </Link>
                          </TableCell>
                          <TableCell>
                            {format(new Date(backup.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>{formatBytes(backup.size)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleView(backup.name)}
                                title="Visualizar"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownload(backup.name, backup.protocolo)}
                                title="Baixar"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </SuperAdminLayout>
  );
}
