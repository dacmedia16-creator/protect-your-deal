import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, HardHat, ArrowLeft, Check, Ticket, X } from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';
import { toast } from 'sonner';
import { formatPhone } from '@/lib/phone';
import { formatCNPJ } from '@/lib/cnpj';
import { PasswordInput } from '@/components/PasswordInput';

interface Plano {
  id: string;
  nome: string;
  descricao: string | null;
  max_corretores: number;
  max_fichas_mes: number;
  valor_mensal: number;
}

const estadosBrasileiros = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO'
];

export default function RegistroConstrutora() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlano, setSelectedPlano] = useState<string>('');

  const planoParam = searchParams.get('plano');
  const refParam = searchParams.get('ref');
  const affParam = searchParams.get('aff');
  const indParam = searchParams.get('ind');

  const [constutoraForm, setConstutoraForm] = useState({
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

  // Cupom
  const [codigoCupom, setCodigoCupom] = useState('');
  const [cupomAutoRef, setCupomAutoRef] = useState(false);
  const [validatingCupom, setValidatingCupom] = useState(false);
  const [cupomInfo, setCupomInfo] = useState<{
    cupom_id: string;
    tipo_desconto: string;
    valor_desconto: number;
    valido: boolean;
    mensagem: string;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/construtora');
    }
  }, [user, authLoading, navigate]);

  // Validate coupon
  useEffect(() => {
    async function validarCupom() {
      if (!codigoCupom || codigoCupom.length < 2) {
        setCupomInfo(null);
        return;
      }
      setValidatingCupom(true);
      try {
        const { data, error } = await supabase.rpc('validar_cupom', {
          codigo_cupom: codigoCupom,
        });
        if (error) throw error;
        if (data && data.length > 0) {
          const result = data[0];
          setCupomInfo({
            cupom_id: result.cupom_id,
            tipo_desconto: result.tipo_desconto,
            valor_desconto: result.valor_desconto,
            valido: result.valido,
            mensagem: result.mensagem,
          });
        } else {
          setCupomInfo(null);
        }
      } catch {
        setCupomInfo(null);
      } finally {
        setValidatingCupom(false);
      }
    }
    const debounce = setTimeout(validarCupom, 500);
    return () => clearTimeout(debounce);
  }, [codigoCupom]);

  // Auto-fill coupon via ?ref=
  useEffect(() => {
    if (refParam && !codigoCupom) {
      setCodigoCupom(refParam.toUpperCase());
      setCupomAutoRef(true);
    }
  }, [refParam]);

  // Auto-fill coupon via ?aff=
  useEffect(() => {
    if (affParam && !refParam && !codigoCupom) {
      (async () => {
        try {
          const { data, error } = await supabase.rpc('get_cupom_by_afiliado', {
            afiliado_uuid: affParam,
          });
          if (!error && data) {
            setCodigoCupom(data);
            setCupomAutoRef(true);
          }
        } catch (err) {
          console.error('Error fetching affiliate coupon:', err);
        }
      })();
    }
  }, [affParam, refParam]);

  // Fetch planos
  useEffect(() => {
    async function fetchPlanos() {
      try {
        const { data, error } = await supabase
          .from('planos')
          .select('*')
          .eq('ativo', true)
          .eq('exibir_no_site', true)
          .eq('tipo_cadastro', 'construtora')
          .order('valor_mensal', { ascending: true });

        if (error) throw error;

        const planosOrdenados = (data || []).sort((a: any, b: any) => {
          if (a.valor_mensal === null) return 1;
          if (b.valor_mensal === null) return -1;
          return a.valor_mensal - b.valor_mensal;
        });
        setPlanos(planosOrdenados);

        if (planoParam === 'gratuito' && data) {
          const planoGratuito = data.find((p: any) => p.nome.toLowerCase() === 'gratuito' || p.valor_mensal === 0);
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
      } finally {
        setLoading(false);
      }
    }
    fetchPlanos();
  }, [planoParam]);

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
      const { data, error } = await supabase.functions.invoke('registro-construtora', {
        body: {
          construtora: {
            nome: constutoraForm.nome,
            cnpj: constutoraForm.cnpj || null,
            email: constutoraForm.email,
            telefone: constutoraForm.telefone || null,
            endereco: constutoraForm.endereco || null,
            cidade: constutoraForm.cidade || null,
            estado: constutoraForm.estado || null,
          },
          admin: {
            nome: adminForm.nome,
            email: adminForm.email,
            senha: adminForm.senha,
          },
          plano_id: selectedPlano,
          codigo_cupom: cupomInfo?.valido ? codigoCupom : null,
          codigo_indicacao: indParam || null,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast.success('Cadastro realizado com sucesso!');
      navigate('/auth');
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
          <Link to="/registro-tipo" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div className="flex items-center gap-2">
            <LogoIcon size={24} />
            <span className="font-display font-bold text-xl">VisitaProva</span>
          </div>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s
                  ? 'bg-orange-500 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-0.5 mx-2 ${step > s ? 'bg-orange-500' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <HardHat className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {step === 1 && 'Escolha seu plano'}
                  {step === 2 && 'Dados da construtora'}
                  {step === 3 && 'Dados do administrador'}
                </CardTitle>
                <CardDescription>
                  {step === 1 && 'Selecione o plano ideal para sua construtora'}
                  {step === 2 && 'Preencha os dados da sua construtora ou incorporadora'}
                  {step === 3 && 'Crie sua conta de administrador'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Step 1: Choose plan */}
            {step === 1 && (
              <div className="space-y-4">
                {planos.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum plano disponível para construtoras no momento. Entre em contato conosco.
                  </p>
                ) : (
                  <RadioGroup value={selectedPlano} onValueChange={setSelectedPlano}>
                    {planos.map((plano) => {
                      let precoOriginal = plano.valor_mensal;
                      let precoComDesconto = precoOriginal;

                      if (cupomInfo?.valido && precoOriginal > 0) {
                        if (cupomInfo.tipo_desconto === 'percentual') {
                          precoComDesconto = precoOriginal * (1 - cupomInfo.valor_desconto / 100);
                        } else {
                          precoComDesconto = Math.max(0, precoOriginal - cupomInfo.valor_desconto);
                        }
                      }

                      const temDesconto = cupomInfo?.valido && precoOriginal > 0 && precoComDesconto !== precoOriginal;

                      return (
                        <label
                          key={plano.id}
                          className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedPlano === plano.id
                              ? 'border-orange-500 bg-orange-500/5'
                              : 'border-border hover:border-orange-500/50'
                          }`}
                        >
                          <RadioGroupItem value={plano.id} className="mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{plano.nome}</span>
                              <span className="font-bold text-orange-500">
                                {plano.valor_mensal === 0
                                  ? 'Grátis'
                                  : temDesconto
                                  ? (
                                    <span className="flex items-center gap-2">
                                      <span className="line-through text-muted-foreground text-sm font-normal">
                                        R$ {precoOriginal.toFixed(2).replace('.', ',')}
                                      </span>
                                      R$ {precoComDesconto.toFixed(2).replace('.', ',')}/mês
                                    </span>
                                  )
                                  : `R$ ${precoOriginal.toFixed(2).replace('.', ',')}/mês`
                                }
                              </span>
                            </div>
                            {plano.descricao && (
                              <p className="text-sm text-muted-foreground mt-1">{plano.descricao}</p>
                            )}
                            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                              <span>{plano.max_corretores} usuários</span>
                              <span>{plano.max_fichas_mes} registros/mês</span>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </RadioGroup>
                )}

                {/* Coupon */}
                <div className="pt-4 border-t">
                  <Label className="flex items-center gap-2 mb-2">
                    <Ticket className="h-4 w-4" />
                    Cupom de desconto
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite o código do cupom"
                      value={codigoCupom}
                      onChange={(e) => {
                        setCodigoCupom(e.target.value.toUpperCase());
                        setCupomAutoRef(false);
                      }}
                      disabled={cupomAutoRef}
                    />
                    {cupomAutoRef && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCodigoCupom('');
                          setCupomAutoRef(false);
                          setCupomInfo(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {validatingCupom && (
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Validando...
                    </p>
                  )}
                  {cupomInfo && (
                    <p className={`text-sm mt-1 ${cupomInfo.valido ? 'text-green-600' : 'text-destructive'}`}>
                      {cupomInfo.mensagem}
                      {cupomInfo.valido && cupomInfo.valor_desconto > 0 && (
                        <span className="ml-1">
                          ({cupomInfo.tipo_desconto === 'percentual'
                            ? `${cupomInfo.valor_desconto}% de desconto`
                            : `R$ ${cupomInfo.valor_desconto.toFixed(2).replace('.', ',')} de desconto`
                          })
                        </span>
                      )}
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!selectedPlano && planos.length > 0}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Company data */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label>Nome da Construtora *</Label>
                    <Input
                      placeholder="Nome da construtora"
                      value={constutoraForm.nome}
                      onChange={(e) => setConstutoraForm({ ...constutoraForm, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>CNPJ</Label>
                    <Input
                      placeholder="00.000.000/0000-00"
                      value={constutoraForm.cnpj}
                      onChange={(e) => setConstutoraForm({ ...constutoraForm, cnpj: formatCNPJ(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Email da Construtora *</Label>
                    <Input
                      type="email"
                      placeholder="contato@construtora.com"
                      value={constutoraForm.email}
                      onChange={(e) => setConstutoraForm({ ...constutoraForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      placeholder="(00) 00000-0000"
                      value={constutoraForm.telefone}
                      onChange={(e) => setConstutoraForm({ ...constutoraForm, telefone: formatPhone(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={constutoraForm.estado}
                      onChange={(e) => setConstutoraForm({ ...constutoraForm, estado: e.target.value })}
                    >
                      <option value="">Selecione</option>
                      {estadosBrasileiros.map((uf) => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Cidade</Label>
                    <Input
                      placeholder="Cidade"
                      value={constutoraForm.cidade}
                      onChange={(e) => setConstutoraForm({ ...constutoraForm, cidade: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Endereço</Label>
                    <Input
                      placeholder="Rua, número, bairro"
                      value={constutoraForm.endereco}
                      onChange={(e) => setConstutoraForm({ ...constutoraForm, endereco: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
                  <Button
                    onClick={() => {
                      if (!constutoraForm.nome || !constutoraForm.email) {
                        toast.error('Preencha o nome e email da construtora');
                        return;
                      }
                      setStep(3);
                    }}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Admin data */}
            {step === 3 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label>Nome completo *</Label>
                    <Input
                      placeholder="Seu nome completo"
                      value={adminForm.nome}
                      onChange={(e) => setAdminForm({ ...adminForm, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={adminForm.email}
                      onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Senha *</Label>
                    <PasswordInput
                      placeholder="Mínimo 6 caracteres"
                      value={adminForm.senha}
                      onChange={(value) => setAdminForm({ ...adminForm, senha: value })}
                    />
                  </div>
                  <div>
                    <Label>Confirmar senha *</Label>
                    <PasswordInput
                      placeholder="Repita a senha"
                      value={adminForm.confirmarSenha}
                      onChange={(value) => setAdminForm({ ...adminForm, confirmarSenha: value })}
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setStep(2)}>Voltar</Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Criar Conta
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Já tem uma conta?{' '}
          <Link to="/auth" className="text-orange-500 hover:underline font-medium">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}
