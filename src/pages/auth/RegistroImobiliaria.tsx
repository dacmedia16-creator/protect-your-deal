import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Shield, Loader2, Building2, ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Plano {
  id: string;
  nome: string;
  descricao: string | null;
  max_corretores: number;
  max_fichas_mes: number;
  valor_mensal: number;
}

export default function RegistroImobiliaria() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlano, setSelectedPlano] = useState<string>('');
  
  const [imobiliariaForm, setImobiliariaForm] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
  });

  const [adminForm, setAdminForm] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
  });

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  // Fetch planos
  useEffect(() => {
    async function fetchPlanos() {
      try {
        const { data, error } = await supabase
          .from('planos')
          .select('*')
          .eq('ativo', true)
          .order('valor_mensal', { ascending: true });

        if (error) throw error;
        setPlanos(data || []);
        if (data && data.length > 0) {
          setSelectedPlano(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching planos:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPlanos();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (adminForm.senha !== adminForm.confirmarSenha) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (adminForm.senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Create the user account with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminForm.email,
        password: adminForm.senha,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { 
            nome: adminForm.nome,
            pending_imobiliaria: {
              nome: imobiliariaForm.nome,
              cnpj: imobiliariaForm.cnpj,
              email: imobiliariaForm.email,
              telefone: imobiliariaForm.telefone,
              endereco: imobiliariaForm.endereco,
              cidade: imobiliariaForm.cidade,
              estado: imobiliariaForm.estado,
              plano_id: selectedPlano,
            }
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Erro ao criar usuário');
      }

      // 2. Create the imobiliaria immediately
      const { data: imobiliaria, error: imobError } = await supabase
        .from('imobiliarias')
        .insert({
          nome: imobiliariaForm.nome,
          cnpj: imobiliariaForm.cnpj || null,
          email: imobiliariaForm.email,
          telefone: imobiliariaForm.telefone || null,
          endereco: imobiliariaForm.endereco || null,
          cidade: imobiliariaForm.cidade || null,
          estado: imobiliariaForm.estado || null,
          status: 'ativo',
        })
        .select()
        .single();

      if (imobError) {
        console.error('Error creating imobiliaria:', imobError);
        // Continue anyway - user was created
      }

      // 3. Create the user_role
      if (imobiliaria) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'imobiliaria_admin',
            imobiliaria_id: imobiliaria.id,
          });

        if (roleError) {
          console.error('Error creating role:', roleError);
        }

        // 4. Update profile with imobiliaria_id
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ imobiliaria_id: imobiliaria.id })
          .eq('user_id', authData.user.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }

        // 5. Create subscription
        if (selectedPlano) {
          const { error: assinError } = await supabase
            .from('assinaturas')
            .insert({
              imobiliaria_id: imobiliaria.id,
              plano_id: selectedPlano,
              status: 'trial',
              data_inicio: new Date().toISOString().split('T')[0],
            });

          if (assinError) {
            console.error('Error creating subscription:', assinError);
          }
        }
      }

      toast.success('Cadastro realizado! Verifique seu email para confirmar a conta.');
      navigate('/auth');
    } catch (error: any) {
      console.error('Error during registration:', error);
      
      if (error.message?.includes('already registered')) {
        toast.error('Este email já está cadastrado');
      } else {
        toast.error(error.message || 'Erro ao realizar cadastro');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-display font-bold text-xl">VisitaSegura</span>
          </div>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-0.5 mx-2 ${step > s ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">
              {step === 1 && 'Escolha seu plano'}
              {step === 2 && 'Dados da imobiliária'}
              {step === 3 && 'Dados do administrador'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Selecione o plano ideal para sua imobiliária'}
              {step === 2 && 'Preencha os dados da sua imobiliária'}
              {step === 3 && 'Crie sua conta de administrador'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Choose plan */}
            {step === 1 && (
              <div className="space-y-4">
                <RadioGroup value={selectedPlano} onValueChange={setSelectedPlano}>
                  {planos.map((plano) => (
                    <label
                      key={plano.id}
                      className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPlano === plano.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value={plano.id} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{plano.nome}</span>
                          <span className="font-bold text-primary">
                            {plano.valor_mensal === 0 
                              ? 'Sob consulta' 
                              : `R$ ${plano.valor_mensal.toFixed(2).replace('.', ',')}/mês`
                            }
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{plano.descricao}</p>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{plano.max_corretores} corretores</span>
                          <span>{plano.max_fichas_mes} fichas/mês</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
                
                <Button 
                  onClick={() => setStep(2)} 
                  className="w-full"
                  disabled={!selectedPlano}
                >
                  Continuar
                </Button>
              </div>
            )}

            {/* Step 2: Imobiliaria data */}
            {step === 2 && (
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="nome">Nome da Imobiliária *</Label>
                    <Input
                      id="nome"
                      value={imobiliariaForm.nome}
                      onChange={(e) => setImobiliariaForm({ ...imobiliariaForm, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={imobiliariaForm.cnpj}
                      onChange={(e) => setImobiliariaForm({ ...imobiliariaForm, cnpj: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={imobiliariaForm.telefone}
                      onChange={(e) => setImobiliariaForm({ ...imobiliariaForm, telefone: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="email_imob">Email da Imobiliária *</Label>
                    <Input
                      id="email_imob"
                      type="email"
                      value={imobiliariaForm.email}
                      onChange={(e) => setImobiliariaForm({ ...imobiliariaForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      value={imobiliariaForm.endereco}
                      onChange={(e) => setImobiliariaForm({ ...imobiliariaForm, endereco: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={imobiliariaForm.cidade}
                      onChange={(e) => setImobiliariaForm({ ...imobiliariaForm, cidade: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      value={imobiliariaForm.estado}
                      onChange={(e) => setImobiliariaForm({ ...imobiliariaForm, estado: e.target.value })}
                      maxLength={2}
                      placeholder="UF"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Voltar
                  </Button>
                  <Button type="submit" className="flex-1">
                    Continuar
                  </Button>
                </div>
              </form>
            )}

            {/* Step 3: Admin account */}
            {step === 3 && (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin_nome">Seu Nome *</Label>
                    <Input
                      id="admin_nome"
                      value={adminForm.nome}
                      onChange={(e) => setAdminForm({ ...adminForm, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin_email">Seu Email *</Label>
                    <Input
                      id="admin_email"
                      type="email"
                      value={adminForm.email}
                      onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha *</Label>
                    <Input
                      id="senha"
                      type="password"
                      value={adminForm.senha}
                      onChange={(e) => setAdminForm({ ...adminForm, senha: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
                    <Input
                      id="confirmarSenha"
                      type="password"
                      value={adminForm.confirmarSenha}
                      onChange={(e) => setAdminForm({ ...adminForm, confirmarSenha: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                    Voltar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Criar Conta
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Ao criar sua conta, você concorda com nossos{' '}
                  <a href="#" className="text-primary hover:underline">Termos de Uso</a>
                  {' '}e{' '}
                  <a href="#" className="text-primary hover:underline">Política de Privacidade</a>.
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
