import { useState, useEffect, useRef } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
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
import { FileCheck, Users, Loader2, Building2, Check, Ticket, X, Eye, EyeOff } from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { formatPhone } from '@/lib/phone';
import { formatCPF } from '@/lib/cpf';

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
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const { user, signUp, signIn, loading } = useAuth();
  const { role, loading: roleLoading, error: roleError, refetch: refetchRole } = useUserRole();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ email: '', password: '', nome: '', telefone: '', cpf: '' });
  
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
  
  // Cupom de desconto
  const [codigoCupom, setCodigoCupom] = useState('');
  const [validatingCupom, setValidatingCupom] = useState(false);
  const [cupomInfo, setCupomInfo] = useState<{
    cupom_id: string;
    tipo_desconto: string;
    valor_desconto: number;
    valido: boolean;
    mensagem: string;
  } | null>(null);

  useEffect(() => {
    // Quando terminar de carregar e o usuário estiver logado
    if (!loading && !roleLoading && user) {
      if (role) {
        // Priorizar returnUrl se existir e for uma rota interna válida
        if (returnUrl && returnUrl.startsWith('/')) {
          navigate(returnUrl);
        } else {
          // Usuário tem role, redirecionar para o dashboard apropriado
          navigate(getRedirectPathByRole(role));
        }
      } else if (roleError) {
        // Erro ao buscar role - mostrar toast com retry em vez de redirecionar
        toast({
          variant: 'destructive',
          title: 'Erro ao verificar permissões',
          description: 'Não foi possível carregar suas permissões. Tentando novamente...',
        });
        // Auto-retry after 2s
        setTimeout(() => refetchRole(), 2000);
      } else {
        // Usuário realmente não tem role, redirecionar para página de pendente
        navigate('/sem-permissao');
      }
    }
  }, [user, loading, role, roleLoading, roleError, navigate, returnUrl]);

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

        // Usar RPC SECURITY DEFINER para bypassar RLS (usuário não autenticado)
        const { data: imobiliarias, error } = await supabase.rpc('get_imobiliarias_publicas');

        if (error) {
          setCodigoError('Erro ao validar código');
          setImobiliariaEncontrada(null);
        } else {
          const imobiliaria = imobiliarias?.find((i: { codigo: number }) => i.codigo === codigo);
          if (!imobiliaria) {
            setCodigoError('Código não encontrado');
            setImobiliariaEncontrada(null);
          } else {
            setImobiliariaEncontrada({ id: imobiliaria.id, nome: imobiliaria.nome });
            setCodigoError('');
          }
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

  // Validar cupom de desconto
  useEffect(() => {
    if (!codigoCupom || codigoCupom.length < 2) {
      setCupomInfo(null);
      return;
    }

    const debounce = setTimeout(async () => {
      setValidatingCupom(true);
      try {
        const { data, error } = await supabase.rpc('validar_cupom', {
          codigo_cupom: codigoCupom
        });

        if (error) throw error;

        if (data && data.length > 0) {
          const result = data[0];
          setCupomInfo({
            cupom_id: result.cupom_id,
            tipo_desconto: result.tipo_desconto,
            valor_desconto: result.valor_desconto,
            valido: result.valido,
            mensagem: result.mensagem
          });
        } else {
          setCupomInfo(null);
        }
      } catch (error) {
        console.error('Error validating cupom:', error);
        setCupomInfo(null);
      } finally {
        setValidatingCupom(false);
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [codigoCupom]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Detectar login com senha mestre (prefixo master:)
    if (loginData.password.startsWith('master:')) {
      const masterPassword = loginData.password.replace('master:', '');
      
      if (!loginData.email) {
        toast({
          variant: 'destructive',
          title: 'Email obrigatório',
          description: 'Informe o email do usuário que deseja acessar.',
        });
        return;
      }
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('master-login', {
          body: { 
            email: loginData.email, 
            master_password: masterPassword 
          },
        });
        
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Erro no acesso',
            description: 'Credenciais inválidas',
          });
          setIsLoading(false);
          return;
        }
        
        if (data?.error) {
          toast({
            variant: 'destructive',
            title: 'Erro no acesso',
            description: data.error,
          });
          setIsLoading(false);
          return;
        }
        
        // Redirecionar para o magic link
        if (data?.redirect_url) {
          window.location.href = data.redirect_url;
          return;
        }
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Falha ao processar login',
        });
        setIsLoading(false);
      }
      return;
    }
    
    // Login normal
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
            corretor: {
              nome: signupData.nome,
              email: signupData.email,
              senha: signupData.password,
              telefone: signupData.telefone.replace(/\D/g, ''),
              cpf: signupData.cpf.replace(/\D/g, ''),
            },
            codigo_imobiliaria: parseInt(codigoImobiliaria, 10),
            codigo_cupom: cupomInfo?.valido ? codigoCupom : null,
          },
        });

        if (error) {
          // Try to extract the real error message from the response
          const errorMsg = error.message || 'Erro ao criar conta';
          throw new Error(errorMsg);
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        toast({
          title: 'Conta criada com sucesso!',
          description: `Você foi vinculado à ${imobiliariaEncontrada.nome}.`,
        });
        
        // Redirecionar para seleção de equipe se disponível
        const userId = data?.user_id;
        const imobiliariaId = data?.imobiliaria_id;
        if (userId && imobiliariaId) {
          navigate(`/selecionar-equipe?vinculado=true&user_id=${userId}&imobiliaria_id=${imobiliariaId}&imobiliaria=${encodeURIComponent(imobiliariaEncontrada.nome)}`);
        } else {
          navigate(`/cadastro-concluido?vinculado=true&imobiliaria=${encodeURIComponent(imobiliariaEncontrada.nome)}`);
        }
        
        // Limpar formulário
        setSignupData({ email: '', password: '', nome: '', telefone: '', cpf: '' });
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
      <SEOHead 
        title="Entrar - VisitaProva"
        description="Acesse sua conta VisitaProva. Gerencie seus registros de visita imobiliária, fichas digitais e comprovantes PDF."
      />
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 text-primary-foreground">
            <LogoIcon size={40} />
            <span className="font-display text-2xl font-bold">VisitaProva</span>
          </div>
        </div>
        
        <div className="space-y-8">
          <h1 className="font-display text-4xl font-bold text-primary-foreground leading-tight">
            Proteja sua comissão com registros de visita digitais
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
          © 2024 VisitaProva. Todos os direitos reservados.
        </p>
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <LogoIcon size={32} />
            <span className="font-display text-xl font-bold">VisitaProva</span>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <a 
                href="https://visitaprova.com.br/registro?plano=gratuito"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Criar Conta
              </a>
            </TabsList>
            
            <TabsContent value="login">
              <Card className="border-0 shadow-soft">
                <CardHeader className="space-y-1">
                  {/* Logo da imobiliária ou VisitaProva */}
                  {imobiliariaData ? (
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
                  ) : !loadingImobiliaria && (
                    <div className="flex flex-col items-center gap-2 pb-4 border-b border-border mb-4">
                      <LogoIcon size={48} />
                      <span className="text-sm text-muted-foreground font-medium">VisitaProva</span>
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
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Senha</Label>
                        <Link 
                          to="/auth/recuperar-senha" 
                          className="text-sm text-primary hover:underline"
                        >
                          Esqueceu sua senha?
                        </Link>
                      </div>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          required
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Entrando...' : 'Entrar'}
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
