import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { SuperAdminLayout } from '@/components/layouts/SuperAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  User,
  Building2,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  RefreshCw,
  AlertTriangle,
  Database
} from 'lucide-react';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  details?: string;
}

interface UserDiagnostics {
  userId: string;
  email: string;
  hookRole: string | null;
  hookImobiliariaId: string | null;
  dbRole: string | null;
  dbImobiliariaId: string | null;
  profileExists: boolean;
  profileImobiliariaId: string | null;
  tests: DiagnosticResult[];
}

export default function AdminDiagnostico() {
  const { user } = useAuth();
  const { role, imobiliariaId, loading: roleLoading, refetch } = useUserRole();
  const { toast } = useToast();
  
  const [searchEmail, setSearchEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentUserDiag, setCurrentUserDiag] = useState<UserDiagnostics | null>(null);
  const [searchedUserDiag, setSearchedUserDiag] = useState<UserDiagnostics | null>(null);
  const [isRunningCurrentTests, setIsRunningCurrentTests] = useState(false);

  // Run diagnostics for current user on mount
  useEffect(() => {
    if (user && !roleLoading) {
      runDiagnosticsForCurrentUser();
    }
  }, [user, roleLoading]);

  const runDiagnosticsForCurrentUser = async () => {
    if (!user) return;
    
    setIsRunningCurrentTests(true);
    try {
      const diagnostics = await runFullDiagnostics(user.id, user.email || '');
      setCurrentUserDiag(diagnostics);
    } catch (error) {
      console.error('Error running diagnostics:', error);
    } finally {
      setIsRunningCurrentTests(false);
    }
  };

  const runFullDiagnostics = async (userId: string, email: string): Promise<UserDiagnostics> => {
    const tests: DiagnosticResult[] = [];
    
    // 1. Get role from user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role, imobiliaria_id')
      .eq('user_id', userId)
      .maybeSingle();

    // 2. Get imobiliaria_id from backend function
    const { data: dbImobiliariaId, error: dbImobiliariaError } = await supabase.rpc(
      'get_user_imobiliaria',
      { _user_id: userId }
    );

    // 3. Check profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, imobiliaria_id')
      .eq('user_id', userId)
      .maybeSingle();

    // Test 1: Role exists
    tests.push({
      name: 'Verificar role na tabela user_roles',
      status: roleData?.role ? 'success' : 'error',
      message: roleData?.role ? `Role: ${roleData.role}` : 'Nenhum role encontrado',
      details: roleError?.message
    });

    // Test 2: Imobiliaria linked via get_user_imobiliaria
    tests.push({
      name: 'Verificar imobiliaria_id via get_user_imobiliaria()',
      status: dbImobiliariaId ? 'success' : 'error',
      message: dbImobiliariaId ? `ID: ${dbImobiliariaId}` : 'Não vinculado a nenhuma imobiliária',
      details: dbImobiliariaError?.message
    });

    // Test 3: Profile exists
    tests.push({
      name: 'Verificar perfil (profiles)',
      status: profileData ? 'success' : 'error',
      message: profileData ? 'Perfil existe' : 'Perfil não encontrado',
      details: profileError?.message
    });

    // Test 4: Try to list fichas (SELECT permission)
    const { data: fichasData, error: fichasError } = await supabase
      .from('fichas_visita')
      .select('id')
      .limit(1);

    tests.push({
      name: 'Permissão: Listar fichas (SELECT)',
      status: !fichasError ? 'success' : 'error',
      message: !fichasError ? `Acesso permitido (${fichasData?.length || 0} resultados)` : 'Acesso negado',
      details: fichasError?.message
    });

    // Test 5: Check if can theoretically insert (based on role and imobiliaria)
    const canInsert = roleData?.role && dbImobiliariaId;
    tests.push({
      name: 'Permissão: Criar ficha (INSERT - verificação)',
      status: canInsert ? 'success' : 'error',
      message: canInsert 
        ? 'Pré-requisitos atendidos (role + imobiliaria_id)' 
        : 'Falta role ou imobiliaria_id para criar fichas',
      details: !canInsert ? 'A política RLS exige user_id = auth.uid() E imobiliaria_id = get_user_imobiliaria(auth.uid())' : undefined
    });

    // Test 6: Consistency check between user_roles.imobiliaria_id and get_user_imobiliaria
    const isConsistent = roleData?.imobiliaria_id === dbImobiliariaId;
    tests.push({
      name: 'Consistência: user_roles.imobiliaria_id vs get_user_imobiliaria()',
      status: isConsistent ? 'success' : 'error',
      message: isConsistent ? 'Valores consistentes' : 'DIVERGÊNCIA DETECTADA!',
      details: !isConsistent 
        ? `user_roles: ${roleData?.imobiliaria_id || 'null'} | função: ${dbImobiliariaId || 'null'}` 
        : undefined
    });

    return {
      userId,
      email,
      hookRole: role,
      hookImobiliariaId: imobiliariaId,
      dbRole: roleData?.role || null,
      dbImobiliariaId: dbImobiliariaId || null,
      profileExists: !!profileData,
      profileImobiliariaId: profileData?.imobiliaria_id || null,
      tests
    };
  };

  const searchUser = async () => {
    if (!searchEmail.trim()) {
      toast({
        variant: 'destructive',
        title: 'Digite um email',
        description: 'Informe o email do usuário para pesquisar'
      });
      return;
    }

    setIsSearching(true);
    setSearchedUserDiag(null);

    try {
      // Use edge function to search user by email (requires admin)
      const { data: usersData, error: usersError } = await supabase.functions.invoke('admin-list-users', {
        body: {}
      });

      if (usersError) throw usersError;

      const foundUser = usersData?.users?.find(
        (u: any) => u.email?.toLowerCase() === searchEmail.toLowerCase().trim()
      );

      if (!foundUser) {
        toast({
          variant: 'destructive',
          title: 'Usuário não encontrado',
          description: `Nenhum usuário com email "${searchEmail}" foi encontrado`
        });
        return;
      }

      const diagnostics = await runFullDiagnostics(foundUser.id, foundUser.email);
      setSearchedUserDiag(diagnostics);
      
    } catch (error: any) {
      console.error('Error searching user:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao pesquisar',
        description: error.message
      });
    } finally {
      setIsSearching(false);
    }
  };

  const DiagnosticsCard = ({ diag, title }: { diag: UserDiagnostics; title: string }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{diag.email}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Info Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">User ID</p>
            <p className="font-mono text-xs break-all">{diag.userId}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Role (hook)</p>
            <Badge variant={diag.hookRole ? 'default' : 'destructive'}>
              {diag.hookRole || 'null'}
            </Badge>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Role (DB)</p>
            <Badge variant={diag.dbRole ? 'default' : 'destructive'}>
              {diag.dbRole || 'null'}
            </Badge>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Imobiliária ID (hook)</p>
            <p className="font-mono text-xs break-all">{diag.hookImobiliariaId || 'null'}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Imobiliária ID (DB)</p>
            <p className="font-mono text-xs break-all">{diag.dbImobiliariaId || 'null'}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Perfil</p>
            <Badge variant={diag.profileExists ? 'default' : 'destructive'}>
              {diag.profileExists ? 'Existe' : 'Não existe'}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Test Results */}
        <div>
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <Database className="h-4 w-4" />
            Testes de Permissão
          </h4>
          <div className="space-y-3">
            {diag.tests.map((test, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${
                  test.status === 'success' 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : test.status === 'error' 
                      ? 'bg-destructive/10 border-destructive/30'
                      : 'bg-muted/50 border-border'
                }`}
              >
                <div className="flex items-start gap-3">
                  {test.status === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  ) : test.status === 'error' ? (
                    <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{test.name}</p>
                    <p className="text-sm text-muted-foreground">{test.message}</p>
                    {test.details && (
                      <p className="text-xs text-destructive mt-1 font-mono">{test.details}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Diagnóstico de Usuário
            </h1>
            <p className="text-muted-foreground">
              Verifique roles, permissões e configurações de usuários
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={async () => {
              await refetch();
              runDiagnosticsForCurrentUser();
            }}
            disabled={isRunningCurrentTests}
          >
            {isRunningCurrentTests ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Atualizar
          </Button>
        </div>

        {/* Current User Diagnostics */}
        {isRunningCurrentTests ? (
          <Card>
            <CardContent className="py-12 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Executando diagnósticos...</p>
            </CardContent>
          </Card>
        ) : currentUserDiag ? (
          <DiagnosticsCard diag={currentUserDiag} title="Usuário Atual (Você)" />
        ) : null}

        <Separator />

        {/* Search Other User */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Pesquisar Outro Usuário
            </CardTitle>
            <CardDescription>
              Digite o email de um usuário para ver seus diagnósticos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="searchEmail" className="sr-only">Email</Label>
                <Input
                  id="searchEmail"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUser()}
                />
              </div>
              <Button onClick={searchUser} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline">Pesquisar</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Searched User Diagnostics */}
        {searchedUserDiag && (
          <DiagnosticsCard diag={searchedUserDiag} title="Usuário Pesquisado" />
        )}

        {/* Help Section */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Dicas de Resolução
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div>
              <strong>Role não encontrado:</strong> O usuário precisa ter um registro na tabela{' '}
              <code className="bg-muted px-1 rounded">user_roles</code> com role válido (corretor, imobiliaria_admin, super_admin).
            </div>
            <div>
              <strong>Imobiliária não vinculada:</strong> O campo{' '}
              <code className="bg-muted px-1 rounded">imobiliaria_id</code> na tabela{' '}
              <code className="bg-muted px-1 rounded">user_roles</code> precisa estar preenchido para corretores e admins de imobiliária.
            </div>
            <div>
              <strong>Erro ao criar ficha:</strong> Verifique se o usuário tem role E imobiliaria_id preenchidos. A política RLS exige ambos.
            </div>
            <div>
              <strong>Divergência detectada:</strong> Os valores de imobiliaria_id devem ser iguais entre{' '}
              <code className="bg-muted px-1 rounded">user_roles.imobiliaria_id</code> e o retorno de{' '}
              <code className="bg-muted px-1 rounded">get_user_imobiliaria()</code>.
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}
