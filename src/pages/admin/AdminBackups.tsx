import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Archive, Download, Eye, Search, HardDrive, FileText, Calendar } from 'lucide-react';
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
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface BackupFile {
  name: string;
visita_id: string;
  protocolo: string;
  size: number;
  created_at: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function AdminBackups() {
  const [search, setSearch] = useState('');

  const { data: backups, isLoading } = useQuery({
    queryKey: ['admin-backups'],
    queryFn: async () => {
      // List files from storage bucket
      const { data: files, error: storageError } = await supabase.storage
        .from('comprovantes-backup')
        .list('', { limit: 500, sortBy: { column: 'created_at', order: 'desc' } });

      if (storageError) throw storageError;
      if (!files || files.length === 0) return [];

      // Extract ficha IDs from filenames (format: {id}_backup.pdf)
      const fichaIds = files
        .filter(f => f.name.endsWith('_backup.pdf'))
        .map(f => f.name.replace('_backup.pdf', ''));

      // Fetch fichas data
      const { data: fichas, error: fichasError } = await supabase
        .from('fichas_visita')
        .select('id, protocolo')
        .in('id', fichaIds);

      if (fichasError) throw fichasError;

      const fichasMap = new Map(fichas?.map(f => [f.id, f.protocolo]) || []);

      return files
        .filter(f => f.name.endsWith('_backup.pdf'))
        .map(f => {
          const fichaId = f.name.replace('_backup.pdf', '');
          return {
            name: f.name,
            visita_id: fichaId,
            protocolo: fichasMap.get(fichaId) || 'N/A',
            size: f.metadata?.size || 0,
            created_at: f.created_at,
          } as BackupFile;
        });
    },
  });

  const filteredBackups = backups?.filter(b =>
    b.protocolo.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const totalSize = backups?.reduce((acc, b) => acc + b.size, 0) || 0;
  const lastBackup = backups?.[0]?.created_at;

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
        <div className="grid gap-4 md:grid-cols-3">
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

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por protocolo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
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
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredBackups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {search ? 'Nenhum backup encontrado' : 'Nenhum backup gerado ainda'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBackups.map((backup) => (
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
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}
