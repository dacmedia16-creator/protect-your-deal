import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Shield, Loader2, ArrowLeft, Check, Building2, Ticket, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatPhone } from '@/lib/phone';
import { formatCNPJ, isValidCNPJ } from '@/lib/cnpj';

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

export default function RegistroPessoaJuridica() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlano, setSelectedPlano] = useState<string>('');
  
  const planoParam = searchParams.get('plano');
  
  const [form, setForm] = useState({
    nomeResponsavel: '',
    razaoSocial: '',
    cnpj: '',
    email: '',
    telefone: '',
    senha: '',
    confirmarSenha: '',
  });

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

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  // Fetch planos para CNPJ individual
  useEffect(() => {
    async function fetchPlanos() {
      try {
        const { data, error } = await supabase
          .from('planos')
          .select('*')
          .eq('ativo', true)
          .eq('tipo_cadastro', 'cnpj_individual')
          .order('valor_mensal', { ascending: true });

        if (error) throw error;
        setPlanos(data || []);
        
        // Se veio com parâmetro plano=gratuito, seleciona o plano gratuito automaticamente
        if (planoParam === 'gratuito' && data) {
          const planoGratuito = data.find(p => p.nome.toLowerCase().includes('gratuito') || p.valor_mensal === 0);
          if (planoGratuito) {
            setSelectedPlano(planoGratuito.id);
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

  // Validar cupom de desconto
  useEffect(() => {
    async function validarCupom() {
      if (!codigoCupom || codigoCupom.length < 2) {
        setCupomInfo(null);
        return;
      }

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
    }

    const debounce = setTimeout(validarCupom, 500);
    return () => clearTimeout(debounce);
  }, [codigoCupom]);

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

    // Validar CNPJ
    const cnpjLimpo = form.cnpj.replace(/\D/g, '');
    if (!isValidCNPJ(cnpjLimpo)) {
      toast.error('CNPJ inválido');
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('registro-pessoa-juridica', {
        body: {
          empresa: {
            razao_social: form.razaoSocial,
            cnpj: cnpjLimpo,
            email: form.email,
            telefone: form.telefone || null,
          },
          responsavel: {
            nome: form.nomeResponsavel,
            email: form.email,
            senha: form.senha,
          },
          plano_id: selectedPlano,
          codigo_cupom: cupomInfo?.valido ? codigoCupom : null,
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
          <Link to="/registro/tipo" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
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
              <Building2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Pessoa Jurídica</span>
            </div>
            <CardTitle className="text-2xl">
              {step === 1 && 'Escolha seu plano'}
              {step === 2 && 'Dados da empresa'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Selecione o plano ideal para sua empresa'}
              {step === 2 && 'Preencha os dados da empresa e do responsável'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Choose plan */}
            {step === 1 && (
              <div className="space-y-4">
                {planos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum plano disponível no momento.
                  </p>
                ) : (
                  <RadioGroup value={selectedPlano} onValueChange={setSelectedPlano}>
                    {planos.map((plano) => {
                      const isFreePlan = plano.nome.toLowerCase().includes('gratuito') || plano.valor_mensal === 0;
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
                              <span className="font-medium">{plano.nome}</span>
                              <span className={`font-bold ${isFreePlan ? 'text-emerald-600' : 'text-primary'}`}>
                                {isFreePlan 
                                  ? 'Grátis' 
                                  : `R$ ${plano.valor_mensal.toFixed(2).replace('.', ',')}/mês`
                                }
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{plano.descricao}</p>
                            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                              <span>{plano.max_fichas_mes} registros/mês</span>
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
                  Precisa de mais recursos?{' '}
                  <Link to="/registro" className="text-primary hover:underline">
                    Veja nossos planos para imobiliárias
                  </Link>
                </p>
              </div>
            )}

            {/* Step 2: Company data */}
            {step === 2 && (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="razaoSocial">Razão Social / Nome da Empresa *</Label>
                    <Input
                      id="razaoSocial"
                      value={form.razaoSocial}
                      onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <Input
                      id="cnpj"
                      value={form.cnpj}
                      onChange={(e) => setForm({ ...form, cnpj: formatCNPJ(e.target.value) })}
                      placeholder="00.000.000/0000-00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={form.telefone}
                      onChange={(e) => setForm({ ...form, telefone: formatPhone(e.target.value) })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="nomeResponsavel">Nome do Responsável *</Label>
                    <Input
                      id="nomeResponsavel"
                      value={form.nomeResponsavel}
                      onChange={(e) => setForm({ ...form, nomeResponsavel: e.target.value })}
                      required
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha *</Label>
                    <Input
                      id="senha"
                      type="password"
                      value={form.senha}
                      onChange={(e) => setForm({ ...form, senha: e.target.value })}
                      required
                      minLength={6}
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

                {/* Cupom de desconto */}
                <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="codigoCupom" className="text-sm font-medium">Cupom de Desconto</Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="codigoCupom"
                      value={codigoCupom}
                      onChange={(e) => setCodigoCupom(e.target.value.toUpperCase())}
                      placeholder="Digite o código do cupom"
                      className="pr-10"
                    />
                    {validatingCupom && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {!validatingCupom && cupomInfo && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {cupomInfo.valido ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <X className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    )}
                  </div>
                  {cupomInfo && (
                    <p className={`text-sm ${cupomInfo.valido ? 'text-emerald-600' : 'text-destructive'}`}>
                      {cupomInfo.mensagem}
                      {cupomInfo.valido && cupomInfo.tipo_desconto === 'percentual' && (
                        <span className="font-medium"> ({cupomInfo.valor_desconto}% de desconto)</span>
                      )}
                      {cupomInfo.valido && cupomInfo.tipo_desconto === 'fixo' && (
                        <span className="font-medium"> (R$ {cupomInfo.valor_desconto.toFixed(2)} de desconto)</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Terms */}
                <p className="text-sm text-muted-foreground text-center">
                  Ao criar sua conta, você concorda com nossos{' '}
                  <Link to="/termos-de-uso" className="text-primary hover:underline">
                    Termos de Uso
                  </Link>{' '}
                  e{' '}
                  <Link to="/politica-privacidade" className="text-primary hover:underline">
                    Política de Privacidade
                  </Link>.
                </p>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      'Criar conta'
                    )}
                  </Button>
                </div>

                <p className="text-sm text-center text-muted-foreground">
                  Já tem uma conta?{' '}
                  <Link to="/auth" className="text-primary hover:underline">
                    Faça login
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}