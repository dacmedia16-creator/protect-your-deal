import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { getRedirectPathByRole } from '@/lib/roleRedirect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Shield, FileCheck, Users, Loader2, Building2, Check } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const signupSchema = loginSchema.extend({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100),
});

interface ImobiliariaData {
  nome: string;
  logo_url: string | null;
}

interface ImobiliariaEncontrada {
  id: string;
  nome: string;
}

export default function Auth() {
  const navigate = useNavigate();
  const { user, signUp, signIn, loading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ email: '', password: '', nome: '' });
  
  // Estado para dados da imobiliária (login)
  const [imobiliariaData, setImobiliariaData] = useState<ImobiliariaData | null>(null);
  const [loadingImobiliaria, setLoadingImobiliaria] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Estado para vinculação à imobiliária (signup)
  const [vincularImobiliaria, setVincularImobiliaria] = useState(false);
  const [codigoImobiliaria, setCodigoImobiliaria] = useState('');
  const [validatingCodigo, setValidatingCodigo] = useState(false);
  const [imobiliariaEncontrada, setImobiliariaEncontrada] = useState<ImobiliariaEncontrada | null>(null);
  const [codigoError, setCodigoError] = useState('');

  useEffect(() => {
    // Quando terminar de carregar e o usuário estiver logado
    if (!loading && !roleLoading && user) {
      if (role) {
        // Usuário tem role, redirecionar para o dashboard apropriado
        navigate(getRedirectPathByRole(role));
      } else {
        // Usuário não tem role, redirecionar para página de pendente
        navigate('/sem-permissao');
      }
    }
  }, [user, loading, role, roleLoading, navigate]);

  // Buscar imobiliária quando o email mudar (com debounce)
  useEffect(() => {
    // Limpar timeout anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Limpar dados se email inválido
    if (!loginData.email || !loginData.email.includes('@') || !loginData.email.includes('.')) {
      setImobiliariaData(null);
      return;
    }

    // Debounce de 600ms
    debounceRef.current = setTimeout(async () => {
      setLoadingImobiliaria(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-imobiliaria-by-email', {
          body: { email: loginData.email },
        });

        if (error) {
          console.error('Erro ao buscar imobiliária:', error);
          setImobiliariaData(null);
        } else {
          setImobiliariaData(data?.imobiliaria || null);
        }
      } catch (error) {
        console.error('Erro ao buscar imobiliária:', error);
        setImobiliariaData(null);
      } finally {
        setLoadingImobiliaria(false);
      }
    }, 600);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [loginData.email]);

  // Validar código da imobiliária no signup (com debounce)
  useEffect(() => {
    if (!vincularImobiliaria || !codigoImobiliaria || codigoImobiliaria.length < 2) {
      setImobiliariaEncontrada(null);
      setCodigoError('');
      return;
    }

    const debounce = setTimeout(async () => {
      setValidatingCodigo(true);
      setCodigoError('');

      try {
        const codigo = parseInt(codigoImobiliaria, 10);
        if (isNaN(codigo)) {
          setCodigoError('Código deve ser um número');
          setImobiliariaEncontrada(null);
          setValidatingCodigo(false);
          return;
        }

        const { data, error } = await supabase
          .from('imobiliarias')
          .select('id, nome, status')
          .eq('codigo', codigo)
          .maybeSingle();

        if (error) {
          setCodigoError('Erro ao validar código');
          setImobiliariaEncontrada(null);
        } else if (!data) {
          setCodigoError('Código não encontrado');
          setImobiliariaEncontrada(null);
        } else if (data.status !== 'ativo') {
          setCodigoError('Esta imobiliária não está ativa');
          setImobiliariaEncontrada(null);
        } else {
          setImobiliariaEncontrada({ id: data.id, nome: data.nome });
          setCodigoError('');
        }
      } catch (error) {
        setCodigoError('Erro ao validar código');
        setImobiliariaEncontrada(null);
      } finally {
        setValidatingCodigo(false);
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [codigoImobiliaria, vincularImobiliaria]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = loginSchema.safeParse(loginData);
    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Erro de validação',
        description: result.error.errors[0].message,
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(loginData.email, loginData.password);
    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao entrar',
        description: error.message === 'Invalid login credentials' 
          ? 'Email ou senha incorretos' 
          : error.message,
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = signupSchema.safeParse(signupData);
    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Erro de validação',
        description: result.error.errors[0].message,
      });
      return;
    }

    // Validar código da imobiliária se marcado
    if (vincularImobiliaria) {
      if (!codigoImobiliaria) {
        toast({
          variant: 'destructive',
          title: 'Código obrigatório',
          description: 'Informe o código da imobiliária ou desmarque a opção.',
        });
        return;
      }
      if (!imobiliariaEncontrada) {
        toast({
          variant: 'destructive',
          title: 'Imobiliária não encontrada',
          description: 'Verifique o código da imobiliária.',
        });
        return;
      }
    }

    setIsLoading(true);
    
    try {
      // Se vinculando à imobiliária, usar a edge function
      if (vincularImobiliaria && imobiliariaEncontrada) {
        const { data, error } = await supabase.functions.invoke('registro-corretor-autonomo', {
          body: {
            nome: signupData.nome,
            email: signupData.email,
            senha: signupData.password,
            codigo_imobiliaria: codigoImobiliaria,
          },
        });

        if (error) {
          throw new Error(error.message || 'Erro ao criar conta');
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        toast({
          title: 'Conta criada com sucesso!',
          description: `Você foi vinculado à ${imobiliariaEncontrada.nome}. Faça login para continuar.`,
        });
        
        // Limpar formulário e mudar para aba de login
        setSignupData({ email: '', password: '', nome: '' });
        setVincularImobiliaria(false);
        setCodigoImobiliaria('');
        setImobiliariaEncontrada(null);
      } else {
        // Cadastro normal sem vinculação
        const { error } = await signUp(signupData.email, signupData.password, signupData.nome);

        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              variant: 'destructive',
              title: 'Email já cadastrado',
              description: 'Este email já está em uso. Tente fazer login.',
            });
          } else {
            toast({
              variant: 'destructive',
              title: 'Erro ao criar conta',
              description: error.message,
            });
          }
        } else {
          toast({
            title: 'Conta criada com sucesso!',
            description: 'Você será redirecionado automaticamente.',
          });
        }
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar conta',
        description: error.message || 'Ocorreu um erro inesperado.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar loading enquanto verifica autenticação inicial
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  // Mostrar loading enquanto verifica o role após login bem-sucedido
  if (user && roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 text-primary-foreground">
            <Shield className="h-10 w-10" />
            <span className="font-display text-2xl font-bold">VisitaSegura</span>
          </div>
        </div>
        
        <div className="space-y-8">
          <h1 className="font-display text-4xl font-bold text-primary-foreground leading-tight">
            Proteja sua comissão com fichas de visita digitais
          </h1>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary-foreground/20">
                <FileCheck className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-foreground">Prova Digital</h3>
                <p className="text-primary-foreground/80 text-sm">
                  Confirmação via OTP garante que a visita foi realizada
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary-foreground/20">
                <Users className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-foreground">CRM Integrado</h3>
                <p className="text-primary-foreground/80 text-sm">
                  Gerencie clientes e acompanhe histórico de visitas
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-primary-foreground/60 text-sm">
          © 2024 VisitaSegura. Todos os direitos reservados.
        </p>
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <Shield className="h-8 w-8 text-primary" />
            <span className="font-display text-xl font-bold">VisitaSegura</span>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card className="border-0 shadow-soft">
                <CardHeader className="space-y-1">
                  {/* Logo da imobiliária quando encontrada */}
                  {imobiliariaData && (
                    <div className="flex flex-col items-center gap-2 pb-4 border-b border-border mb-4">
                      {imobiliariaData.logo_url ? (
                        <img 
                          src={imobiliariaData.logo_url} 
                          alt={imobiliariaData.nome}
                          className="h-16 w-auto max-w-[180px] object-contain"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <span className="text-sm text-muted-foreground font-medium">
                        {imobiliariaData.nome}
                      </span>
                    </div>
                  )}
                  
                  {/* Loading indicator */}
                  {loadingImobiliaria && (
                    <div className="flex justify-center pb-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  
                  <CardTitle className="font-display text-2xl">Bem-vindo de volta</CardTitle>
                  <CardDescription>
                    Entre com suas credenciais para acessar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Entrando...' : 'Entrar'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="signup">
              <Card className="border-0 shadow-soft">
                <CardHeader className="space-y-1">
                  <CardTitle className="font-display text-2xl">Crie sua conta</CardTitle>
                  <CardDescription>
                    Comece a proteger suas comissões hoje
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-nome">Nome completo</Label>
                      <Input
                        id="signup-nome"
                        type="text"
                        placeholder="João Silva"
                        value={signupData.nome}
                        onChange={(e) => setSignupData({ ...signupData, nome: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        required
                      />
                    </div>
                    
                    {/* Vinculação à imobiliária */}
                    <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="vincularImobiliaria"
                          checked={vincularImobiliaria}
                          onCheckedChange={(checked) => {
                            setVincularImobiliaria(!!checked);
                            if (!checked) {
                              setCodigoImobiliaria('');
                              setImobiliariaEncontrada(null);
                              setCodigoError('');
                            }
                          }}
                        />
                        <Label htmlFor="vincularImobiliaria" className="cursor-pointer text-sm">
                          Desejo me vincular a uma imobiliária
                        </Label>
                      </div>

                      {vincularImobiliaria && (
                        <div className="space-y-2">
                          <Label htmlFor="codigoImobiliaria">Código da Imobiliária</Label>
                          <div className="relative">
                            <Input
                              id="codigoImobiliaria"
                              type="text"
                              inputMode="numeric"
                              value={codigoImobiliaria}
                              onChange={(e) => setCodigoImobiliaria(e.target.value.replace(/\D/g, ''))}
                              placeholder="Ex: 100"
                              className={codigoError ? 'border-destructive' : imobiliariaEncontrada ? 'border-green-500' : ''}
                            />
                            {validatingCodigo && (
                              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                          </div>
                          {codigoError && <p className="text-sm text-destructive">{codigoError}</p>}
                          {imobiliariaEncontrada && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <Building2 className="h-4 w-4" />
                              <span>{imobiliariaEncontrada.nome}</span>
                              <Check className="h-4 w-4" />
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Peça o código para o administrador da imobiliária
                          </p>
                        </div>
                      )}
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Criando conta...' : 'Criar conta'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
