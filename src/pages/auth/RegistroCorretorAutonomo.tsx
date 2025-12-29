import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Loader2, ArrowLeft, Check, User, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatPhone } from '@/lib/phone';

interface Plano {
  id: string;
  nome: string;
  descricao: string | null;
  max_corretores: number;
  max_fichas_mes: number;
  max_clientes: number;
  max_imoveis: number;
  valor_mensal: number;
}

export default function RegistroCorretorAutonomo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlano, setSelectedPlano] = useState<string>('');
  
  const planoParam = searchParams.get('plano');
  
  const [corretorForm, setCorretorForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    creci: '',
    senha: '',
    confirmarSenha: '',
  });
  
  // Vinculação à imobiliária
  const [vincularImobiliaria, setVincularImobiliaria] = useState(false);
  const [codigoImobiliaria, setCodigoImobiliaria] = useState('');
  const [validatingCodigo, setValidatingCodigo] = useState(false);
  const [imobiliariaEncontrada, setImobiliariaEncontrada] = useState<{ id: string; nome: string } | null>(null);
  const [codigoError, setCodigoError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  // Fetch planos para corretor autônomo (max_corretores = 1)
  useEffect(() => {
    async function fetchPlanos() {
      try {
        const { data, error } = await supabase
          .from('planos')
          .select('*')
          .eq('ativo', true)
          .eq('max_corretores', 1)
          .order('valor_mensal', { ascending: true });

        if (error) throw error;
        setPlanos(data || []);
        
        // Se veio com parâmetro plano=gratuito, seleciona o plano gratuito automaticamente
        if (planoParam === 'gratuito' && data) {
          const planoGratuito = data.find(p => p.nome.toLowerCase() === 'gratuito' || p.valor_mensal === 0);
          if (planoGratuito) {
            setSelectedPlano(planoGratuito.id);
            // Pula direto para o step 2 (dados pessoais)
            setStep(2);
          } else if (data.length > 0) {
            setSelectedPlano(data[0].id);
          }
        } else if (data && data.length > 0) {
          setSelectedPlano(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching planos:', error);
        toast.error('Erro ao carregar planos');
      } finally {
        setLoading(false);
      }
    }

    fetchPlanos();
  }, [planoParam]);

  // Validar código da imobiliária
  useEffect(() => {
    async function validarCodigo() {
      if (!vincularImobiliaria || !codigoImobiliaria || codigoImobiliaria.length < 2) {
        setImobiliariaEncontrada(null);
        setCodigoError('');
        return;
      }

      setValidatingCodigo(true);
      setCodigoError('');

      try {
        const codigo = parseInt(codigoImobiliaria, 10);
        if (isNaN(codigo)) {
          setCodigoError('Código deve ser um número');
          setImobiliariaEncontrada(null);
          return;
        }

        const { data, error } = await supabase
          .from('imobiliarias')
          .select('id, nome, status')
          .eq('codigo', codigo)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
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
        console.error('Error validating codigo:', error);
        setCodigoError('Erro ao validar código');
        setImobiliariaEncontrada(null);
      } finally {
        setValidatingCodigo(false);
      }
    }

    const debounce = setTimeout(validarCodigo, 500);
    return () => clearTimeout(debounce);
  }, [codigoImobiliaria, vincularImobiliaria]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (corretorForm.senha !== corretorForm.confirmarSenha) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (corretorForm.senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    // Validar código da imobiliária se marcado
    if (vincularImobiliaria && !imobiliariaEncontrada) {
      toast.error('Código da imobiliária inválido');
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('registro-corretor-autonomo', {
        body: {
          corretor: {
            nome: corretorForm.nome,
            email: corretorForm.email,
            telefone: corretorForm.telefone || null,
            creci: corretorForm.creci || null,
            senha: corretorForm.senha,
          },
          plano_id: selectedPlano,
          codigo_imobiliaria: vincularImobiliaria && codigoImobiliaria ? parseInt(codigoImobiliaria, 10) : null,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('Cadastro realizado com sucesso!');
      navigate('/cadastro-concluido');
    } catch (error: any) {
      console.error('Error during registration:', error);
      
      if (error.message?.includes('already') || error.message?.includes('cadastrado')) {
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
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 2 && (
                <div className={`w-12 h-0.5 mx-2 ${step > s ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <User className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Corretor Autônomo</span>
            </div>
            <CardTitle className="text-2xl">
              {step === 1 && 'Escolha seu plano'}
              {step === 2 && 'Seus dados'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Selecione o plano ideal para você'}
              {step === 2 && 'Preencha seus dados pessoais para criar sua conta'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Choose plan */}
            {step === 1 && (
              <div className="space-y-4">
                {planos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum plano disponível para corretor autônomo no momento.
                  </p>
                ) : (
                  <RadioGroup value={selectedPlano} onValueChange={setSelectedPlano}>
                    {planos.map((plano) => {
                      const isFreePlan = plano.nome.toLowerCase() === 'gratuito' || plano.valor_mensal === 0;
                      return (
                        <label
                          key={plano.id}
                          className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedPlano === plano.id
                              ? isFreePlan 
                                ? 'border-emerald-500 bg-emerald-500/5' 
                                : 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <RadioGroupItem value={plano.id} className="mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {plano.nome.toLowerCase() === 'gratuito' ? 'Gratuito CPF' : plano.nome}
                              </span>
                              <span className={`font-bold ${isFreePlan ? 'text-emerald-600' : 'text-primary'}`}>
                                {isFreePlan 
                                  ? 'Grátis' 
                                  : `R$ ${plano.valor_mensal.toFixed(2).replace('.', ',')}/mês`
                                }
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{plano.descricao}</p>
                            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                              <span>{plano.max_fichas_mes} fichas/mês</span>
                              <span>{plano.max_clientes} clientes</span>
                              <span>{plano.max_imoveis} imóveis</span>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </RadioGroup>
                )}
                
                <Button 
                  onClick={() => setStep(2)} 
                  className="w-full"
                  disabled={!selectedPlano}
                >
                  Continuar
                </Button>

                <p className="text-sm text-center text-muted-foreground">
                  É uma imobiliária?{' '}
                  <Link to="/registro" className="text-primary hover:underline">
                    Cadastre sua empresa aqui
                  </Link>
                </p>
              </div>
            )}

            {/* Step 2: Personal data */}
            {step === 2 && (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={corretorForm.nome}
                      onChange={(e) => setCorretorForm({ ...corretorForm, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={corretorForm.email}
                      onChange={(e) => setCorretorForm({ ...corretorForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={corretorForm.telefone}
                      onChange={(e) => setCorretorForm({ ...corretorForm, telefone: formatPhone(e.target.value) })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="creci">CRECI</Label>
                    <Input
                      id="creci"
                      value={corretorForm.creci}
                      onChange={(e) => setCorretorForm({ ...corretorForm, creci: e.target.value })}
                      placeholder="Opcional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha *</Label>
                    <Input
                      id="senha"
                      type="password"
                      value={corretorForm.senha}
                      onChange={(e) => setCorretorForm({ ...corretorForm, senha: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
                    <Input
                      id="confirmarSenha"
                      type="password"
                      value={corretorForm.confirmarSenha}
                      onChange={(e) => setCorretorForm({ ...corretorForm, confirmarSenha: e.target.value })}
                      required
                    />
                  </div>
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
                    <Label htmlFor="vincularImobiliaria" className="cursor-pointer">
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
                          className={codigoError ? 'border-destructive' : imobiliariaEncontrada ? 'border-success' : ''}
                        />
                        {validatingCodigo && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                      {codigoError && (
                        <p className="text-sm text-destructive">{codigoError}</p>
                      )}
                      {imobiliariaEncontrada && (
                        <div className="flex items-center gap-2 text-sm text-success">
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

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Voltar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Criar Conta
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Ao criar sua conta, você concorda com nossos{' '}
                  <Link to="/termos-de-uso" target="_blank" className="text-primary hover:underline">Termos de Uso</Link>
                  {' '}e{' '}
                  <Link to="/politica-privacidade" target="_blank" className="text-primary hover:underline">Política de Privacidade</Link>.
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
