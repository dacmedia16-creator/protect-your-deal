import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { APP_URL } from '@/lib/appConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Loader2, CheckCircle2, XCircle, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface Convite {
  id: string;
  nome: string;
  email: string;
  role: string;
  status: string;
  expira_em: string;
  imobiliaria: {
    id: string;
    nome: string;
  };
}

export default function AceitarConvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [convite, setConvite] = useState<Convite | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    senha: '',
    confirmarSenha: '',
  });

  useEffect(() => {
    async function fetchConvite() {
      if (!token) {
        setError('Token inválido');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('convites')
          .select(`
            id,
            nome,
            email,
            role,
            status,
            expira_em,
            imobiliaria:imobiliarias (
              id,
              nome
            )
          `)
          .eq('token', token)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setError('Convite não encontrado');
          return;
        }

        if (data.status === 'aceito') {
          setError('Este convite já foi utilizado');
          return;
        }

        if (data.status === 'cancelado') {
          setError('Este convite foi cancelado');
          return;
        }

        if (new Date(data.expira_em) < new Date()) {
          setError('Este convite expirou');
          return;
        }

        setConvite({
          ...data,
          imobiliaria: Array.isArray(data.imobiliaria) ? data.imobiliaria[0] : data.imobiliaria
        });
      } catch (error) {
        console.error('Error fetching convite:', error);
        setError('Erro ao carregar convite');
      } finally {
        setLoading(false);
      }
    }

    fetchConvite();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.senha !== form.confirmarSenha) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (form.senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (!convite) return;

    setSubmitting(true);

    try {
      // 1. Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: convite.email,
        password: form.senha,
        options: {
          emailRedirectTo: `${APP_URL}/dashboard`,
          data: { nome: convite.nome }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Erro ao criar usuário');
      }

      // 2. Create the user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: convite.role as 'corretor' | 'imobiliaria_admin' | 'super_admin',
          imobiliaria_id: convite.imobiliaria.id,
        });

      if (roleError) throw roleError;

      // 3. Update profile with imobiliaria_id and ensure ativo = true
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          imobiliaria_id: convite.imobiliaria.id,
          ativo: true 
        })
        .eq('user_id', authData.user.id);

      if (profileError) console.error('Profile update error:', profileError);

      // 4. Mark the invite as accepted
      const { error: conviteError } = await supabase
        .from('convites')
        .update({ 
          status: 'aceito',
          aceito_em: new Date().toISOString()
        })
        .eq('id', convite.id);

      if (conviteError) console.error('Convite update error:', conviteError);

      toast.success('Conta criada com sucesso!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error accepting invite:', error);
      
      if (error.message?.includes('already registered')) {
        toast.error('Este email já está cadastrado. Faça login.');
        navigate('/auth');
      } else {
        toast.error(error.message || 'Erro ao criar conta');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">VisitaProva</CardTitle>
          {error ? (
            <CardDescription className="text-destructive flex items-center justify-center gap-2">
              <XCircle className="h-4 w-4" />
              {error}
            </CardDescription>
          ) : (
            <CardDescription>
              Você foi convidado para fazer parte de uma equipe
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Entre em contato com o administrador da sua imobiliária para solicitar um novo convite.
              </p>
              <Link to="/auth">
                <Button variant="outline" className="w-full">
                  Ir para login
                </Button>
              </Link>
            </div>
          ) : convite ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{convite.imobiliaria.nome}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Você está se cadastrando como <span className="font-medium">
                    {convite.role === 'corretor' ? 'Corretor' : 'Administrador'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={convite.nome} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={convite.email} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha">Criar Senha *</Label>
                  <Input
                    id="senha"
                    type="password"
                    value={form.senha}
                    onChange={(e) => setForm({ ...form, senha: e.target.value })}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
                  <Input
                    id="confirmarSenha"
                    type="password"
                    value={form.confirmarSenha}
                    onChange={(e) => setForm({ ...form, confirmarSenha: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Criar Minha Conta
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Ao criar sua conta, você concorda com nossos{' '}
                <Link to="/termos-de-uso" target="_blank" className="text-primary hover:underline">Termos de Uso</Link>
                {' '}e{' '}
                <Link to="/politica-privacidade" target="_blank" className="text-primary hover:underline">Política de Privacidade</Link>.
              </p>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
