import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Building2, ArrowLeft, Check, Ticket, X, UserPlus } from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';
import { toast } from 'sonner';
import { formatPhone } from '@/lib/phone';
import { formatCNPJ } from '@/lib/cnpj';
import { formatCreciJuridico, isValidCreciJuridico } from '@/lib/creci';

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
  
  const [imobiliariaForm, setImobiliariaForm] = useState({
    nome: '',
    cnpj: '',
    creci_juridico: '',
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

  // Cupom de desconto
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

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/empresa');
    }
  }, [user, authLoading, navigate]);

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

  // Auto-preencher cupom via ?ref=
  useEffect(() => {
    if (refParam && !codigoCupom) {
      setCodigoCupom(refParam.toUpperCase());
      setCupomAutoRef(true);
    }
  }, [refParam]);

  // Fetch planos
  useEffect(() => {
    async function fetchPlanos() {
      try {
        const { data, error } = await supabase
          .from('planos')
          .select('*')
          .eq('ativo', true)
          .eq('tipo_cadastro', 'cnpj')
          .order('valor_mensal', { ascending: true });

        if (error) throw error;
        
        // Reordenar: planos "sob consulta" (valor_mensal null) vão para o final
        const planosOrdenados = (data || []).sort((a, b) => {
          if (a.valor_mensal === null) return 1;
          if (b.valor_mensal === null) return -1;
          return a.valor_mensal - b.valor_mensal;
        });
        setPlanos(planosOrdenados);
        
        // Se veio com parâmetro plano=gratuito, seleciona o plano gratuito automaticamente
        if (planoParam === 'gratuito' && data) {
          const planoGratuito = data.find(p => p.nome.toLowerCase() === 'gratuito' || p.valor_mensal === 0);
          if (planoGratuito) {
            setSelectedPlano(planoGratuito.id);
            // Pula direto para o step 2 (dados da imobiliária)
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

    if (imobiliariaForm.creci_juridico && !isValidCreciJuridico(imobiliariaForm.creci_juridico)) {
      toast.error('Formato de CRECI Jurídico inválido. Use o formato J-12345');
      return;
    }

    setSubmitting(true);

    try {
      // Use edge function to create everything with service role
      const { data, error } = await supabase.functions.invoke('registro-imobiliaria', {
        body: {
          imobiliaria: {
            nome: imobiliariaForm.nome,
            cnpj: imobiliariaForm.cnpj || null,
            creci_juridico: imobiliariaForm.creci_juridico || null,
            email: imobiliariaForm.email,
            telefone: imobiliariaForm.telefone || null,
            endereco: imobiliariaForm.endereco || null,
            cidade: imobiliariaForm.cidade || null,
            estado: imobiliariaForm.estado || null,
          },
          admin: {
            nome: adminForm.nome,
            email: adminForm.email,
            senha: adminForm.senha,
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
      
      // Se for plano gratuito, redireciona para página de confirmação
      const planoSelecionado = planos.find(p => p.id === selectedPlano);
      if (planoSelecionado && (planoSelecionado.nome.toLowerCase() === 'gratuito' || planoSelecionado.valor_mensal === 0)) {
        navigate('/cadastro-concluido');
      } else {
        navigate('/auth');
      }
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
                <RadioGroup value={selectedPlano} onValueChange={(value) => {
                  if (value === 'cpf-gratuito') {
                    navigate('/registro-autonomo?plano=gratuito');
                  } else if (value === 'cpf-profissional') {
                    navigate('/registro-autonomo?plano=profissional');
                  } else if (value === 'vincular-imobiliaria') {
                    navigate('/registro-vinculado');
                  } else {
                    setSelectedPlano(value);
                  }
                }}>
                  {/* Opção Gratuito CPF - Card destacado (sempre visível) */}
                  <label
                    className="flex items-start gap-4 p-4 border-2 border-primary rounded-lg cursor-pointer transition-colors hover:bg-primary/5 relative"
                    onClick={() => navigate('/registro-autonomo?plano=gratuito')}
                  >
                    <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      Comece Grátis
                    </div>
                    <RadioGroupItem value="cpf-gratuito" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Gratuito CPF</span>
                        <span className="font-bold text-primary">R$ 0,00</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Para corretores autônomos (pessoa física)</p>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>1 corretor</span>
                        <span>2 registros/mês</span>
                      </div>
                    </div>
                  </label>

                  {/* Opção Profissional CPF - redireciona para registro autônomo */}
                  <label
                    className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors border-border hover:border-primary/50"
                    onClick={() => navigate('/registro-autonomo?plano=profissional')}
                  >
                    <RadioGroupItem value="cpf-profissional" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Profissional</span>
                        <span className="font-bold text-primary">R$ 79,90/mês</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Para corretores autônomos que precisam de mais recursos</p>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>1 corretor</span>
                        <span>15 registros/mês</span>
                      </div>
                    </div>
                  </label>

                  {/* Opção Vincular a Imobiliária - redireciona para registro vinculado */}
                  <label
                    className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors border-border hover:border-primary/50 bg-green-50/50 dark:bg-green-900/10"
                    onClick={() => navigate('/registro-vinculado')}
                  >
                    <RadioGroupItem value="vincular-imobiliaria" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium flex items-center gap-2">
                          <UserPlus className="h-4 w-4 text-green-600" />
                          Vincular a Imobiliária
                        </span>
                        <span className="text-sm text-muted-foreground">Usa plano da empresa</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Já trabalha em uma imobiliária? Vincule-se usando o código dela
                      </p>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Use o código da empresa</span>
                        <span>Acesso ao sistema</span>
                      </div>
                    </div>
                  </label>
                  
                  {planos.map((plano) => {
                    // Calcular preço com desconto
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
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <RadioGroupItem value={plano.id} className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {plano.nome.toLowerCase() === 'gratuito' ? 'Gratuito CNPJ' : plano.nome}
                            </span>
                            <span className="font-bold text-primary">
                              {plano.nome.toLowerCase() === 'gratuito' || (plano.valor_mensal === 0 && plano.nome.toLowerCase() !== 'enterprise')
                                ? 'Grátis' 
                                : plano.nome.toLowerCase() === 'enterprise' || (plano.valor_mensal === 0 && plano.nome.toLowerCase() !== 'gratuito')
                                ? 'Sob consulta'
                                : temDesconto
                                ? (
                                  <div className="text-right">
                                    <div className="flex items-center gap-2 justify-end">
                                      <span className="line-through text-muted-foreground text-sm font-normal">
                                        R$ {precoOriginal.toFixed(2).replace('.', ',')}
                                      </span>
                                      <span className="text-green-600 font-semibold">
                                        R$ {precoComDesconto.toFixed(2).replace('.', ',')}
                                      </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      1º mês • depois R$ {precoOriginal.toFixed(2).replace('.', ',')}/mês
                                    </span>
                                  </div>
                                )
                                : `R$ ${plano.valor_mensal.toFixed(2).replace('.', ',')}/mês`
                              }
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{plano.descricao}</p>
                              <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                                <span>{plano.max_corretores} corretores</span>
                                <span>{plano.max_fichas_mes} registros/mês</span>
                              </div>
                        </div>
                      </label>
                    );
                  })}
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
                      placeholder="00.000.000/0000-00"
                      value={imobiliariaForm.cnpj}
                      onChange={(e) => setImobiliariaForm({ ...imobiliariaForm, cnpj: formatCNPJ(e.target.value) })}
                      maxLength={18}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="creci_juridico">CRECI Jurídico</Label>
                    <Input
                      id="creci_juridico"
                      placeholder="Ex: J-12345"
                      value={imobiliariaForm.creci_juridico}
                      onChange={(e) => setImobiliariaForm({ ...imobiliariaForm, creci_juridico: formatCreciJuridico(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={imobiliariaForm.telefone}
                      onChange={(e) => setImobiliariaForm({ ...imobiliariaForm, telefone: formatPhone(e.target.value) })}
                      placeholder="(00) 00000-0000"
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

                  {/* Campo de cupom de desconto */}
                  <div className="sm:col-span-2 border rounded-lg p-4 space-y-3 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-primary" />
                      <Label htmlFor="cupom">Cupom de desconto (opcional)</Label>
                    </div>
                    <div className="relative">
                      <Input
                        id="cupom"
                        value={codigoCupom}
                        onChange={(e) => setCodigoCupom(e.target.value.toUpperCase())}
                        placeholder="Ex: DESCONTO10"
                        disabled={cupomAutoRef && cupomInfo?.valido === true}
                        className={cupomInfo?.valido === false ? 'border-destructive' : cupomInfo?.valido ? 'border-green-500' : ''}
                      />
                      {validatingCupom && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    {cupomAutoRef && cupomInfo?.valido && (
                      <p className="text-xs text-primary flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Cupom aplicado automaticamente via link de indicação
                      </p>
                    )}
                    {cupomInfo && !cupomInfo.valido && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <X className="h-3 w-3" />
                        {cupomInfo.mensagem}
                      </p>
                    )}
                    {cupomInfo?.valido && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        {cupomInfo.tipo_desconto === 'percentual' 
                          ? `${cupomInfo.valor_desconto}% de desconto no 1º mês!`
                          : `R$ ${Number(cupomInfo.valor_desconto).toFixed(2)} de desconto no 1º mês!`
                        }
                      </p>
                    )}
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
