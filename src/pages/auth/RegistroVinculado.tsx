import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, Check, Building2, UserPlus, AlertCircle } from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';
import { toast } from 'sonner';
import { formatPhone } from '@/lib/phone';
import { formatCPF } from '@/lib/cpf';

export default function RegistroVinculado() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  
  // Step 1 - Código da imobiliária
  const [codigoImobiliaria, setCodigoImobiliaria] = useState('');
  const [validatingCodigo, setValidatingCodigo] = useState(false);
  const [imobiliariaEncontrada, setImobiliariaEncontrada] = useState<{ id: string; nome: string } | null>(null);
  const [codigoError, setCodigoError] = useState('');

  // Phone validation
  const [telefoneError, setTelefoneError] = useState('');
  const [validatingTelefone, setValidatingTelefone] = useState(false);

  // Step 2 - Dados do corretor
  const [corretorForm, setCorretorForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    creci: '',
    senha: '',
    confirmarSenha: '',
  });

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  // Validar código da imobiliária
  useEffect(() => {
    async function validarCodigo() {
      if (!codigoImobiliaria || codigoImobiliaria.length < 2) {
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

        const { data: imobiliarias, error } = await supabase
          .rpc('get_imobiliarias_publicas');

        if (error) throw error;

        // Filtrar pelo código no resultado
        const imobiliaria = imobiliarias?.find(
          (i: { codigo: number }) => i.codigo === codigo
        );

        if (!imobiliaria) {
          setCodigoError('Código não encontrado');
          setImobiliariaEncontrada(null);
        } else {
          setImobiliariaEncontrada({ id: imobiliaria.id, nome: imobiliaria.nome });
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
  }, [codigoImobiliaria]);

  // Validar telefone duplicado
  useEffect(() => {
    async function validarTelefone() {
      const telefoneNormalizado = corretorForm.telefone.replace(/\D/g, '');
      if (!telefoneNormalizado || telefoneNormalizado.length < 10) {
        setTelefoneError('');
        return;
      }

      setValidatingTelefone(true);
      try {
        const { data, error } = await supabase.rpc('check_phone_available', {
          phone_number: telefoneNormalizado
        });
        
        if (error) {
          console.error('Error checking phone:', error);
          setTelefoneError('');
          return;
        }
        
        if (!data) {
          setTelefoneError('Este telefone já está em uso');
        } else {
          setTelefoneError('');
        }
      } catch (err) {
        console.error('Error validating phone:', err);
        setTelefoneError('');
      } finally {
        setValidatingTelefone(false);
      }
    }

    const debounce = setTimeout(validarTelefone, 500);
    return () => clearTimeout(debounce);
  }, [corretorForm.telefone]);

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

    if (!imobiliariaEncontrada) {
      toast.error('Código da imobiliária inválido');
      return;
    }

    if (telefoneError) {
      toast.error('Corrija o telefone antes de continuar');
      return;
    }

    setSubmitting(true);

    try {
      // Buscar plano gratuito para corretor vinculado
      const { data: planos } = await supabase
        .from('planos')
        .select('id')
        .eq('ativo', true)
        .eq('tipo_cadastro', 'cpf')
        .order('valor_mensal', { ascending: true })
        .limit(1);

      const planoId = planos?.[0]?.id;

      if (!planoId) {
        throw new Error('Nenhum plano disponível');
      }

      const { data, error } = await supabase.functions.invoke('registro-corretor-autonomo', {
        body: {
          corretor: {
            nome: corretorForm.nome,
            email: corretorForm.email,
            telefone: corretorForm.telefone || null,
            cpf: corretorForm.cpf?.replace(/\D/g, '') || null,
            creci: corretorForm.creci || null,
            senha: corretorForm.senha,
          },
          plano_id: planoId,
          codigo_imobiliaria: parseInt(codigoImobiliaria, 10),
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('Cadastro realizado com sucesso! Aguarde a ativação pelo administrador da imobiliária.', { duration: 6000 });
      
      // Redirecionar para seleção de equipe passando user_id (sem precisar de login)
      const userId = data?.user_id;
      if (userId) {
        navigate(`/selecionar-equipe?vinculado=true&user_id=${userId}&imobiliaria_id=${imobiliariaEncontrada.id}&imobiliaria=${encodeURIComponent(imobiliariaEncontrada.nome)}`);
      } else {
        // Fallback se não retornar user_id
        navigate(`/cadastro-concluido?vinculado=true&imobiliaria=${encodeURIComponent(imobiliariaEncontrada.nome)}`);
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

  if (authLoading) {
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
            <LogoIcon size={24} />
            <span className="font-display font-bold text-xl">VisitaProva</span>
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
              <UserPlus className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">Vincular a Imobiliária</span>
            </div>
            <CardTitle className="text-2xl">
              {step === 1 && 'Código da Imobiliária'}
              {step === 2 && 'Seus dados'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Digite o código fornecido pela sua imobiliária'}
              {step === 2 && 'Preencha seus dados pessoais para criar sua conta'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Código da imobiliária */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="codigoImobiliaria">Código da Imobiliária *</Label>
                  <div className="relative">
                    <Input
                      id="codigoImobiliaria"
                      type="text"
                      value={codigoImobiliaria}
                      onChange={(e) => setCodigoImobiliaria(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ex: 12345"
                      className={`pr-10 ${codigoError ? 'border-destructive' : imobiliariaEncontrada ? 'border-green-500' : ''}`}
                    />
                    {validatingCodigo && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {!validatingCodigo && imobiliariaEncontrada && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  {codigoError && (
                    <p className="text-sm text-destructive">{codigoError}</p>
                  )}
                </div>

                {imobiliariaEncontrada && (
                  <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                    <Building2 className="h-10 w-10 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium text-primary">Imobiliária encontrada!</p>
                      <p className="text-lg font-semibold">{imobiliariaEncontrada.nome}</p>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Onde encontrar o código?</h4>
                  <p className="text-sm text-muted-foreground">
                    O código da imobiliária é fornecido pelo administrador da empresa. 
                    Se você não possui o código, entre em contato com sua imobiliária.
                  </p>
                </div>
                
                <Button 
                  onClick={() => setStep(2)} 
                  className="w-full"
                  disabled={!imobiliariaEncontrada}
                >
                  Continuar
                </Button>

                <p className="text-sm text-center text-muted-foreground">
                  Não tem uma imobiliária?{' '}
                  <Link to="/registro-autonomo" className="text-primary hover:underline">
                    Cadastre-se como autônomo
                  </Link>
                </p>
              </div>
            )}

            {/* Step 2: Dados do corretor */}
            {step === 2 && (
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Resumo da imobiliária */}
                <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/30 rounded-lg mb-4">
                  <Building2 className="h-6 w-6 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Vinculando a:</p>
                    <p className="font-medium">{imobiliariaEncontrada?.nome}</p>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setStep(1)}
                  >
                    Alterar
                  </Button>
                </div>

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
                    <div className="relative">
                      <Input
                        id="telefone"
                        value={corretorForm.telefone}
                        onChange={(e) => setCorretorForm({ ...corretorForm, telefone: formatPhone(e.target.value) })}
                        placeholder="(00) 00000-0000"
                        className={telefoneError ? 'border-destructive pr-10' : ''}
                      />
                      {validatingTelefone && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {!validatingTelefone && telefoneError && (
                        <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                      )}
                    </div>
                    {telefoneError && (
                      <p className="text-sm text-destructive">{telefoneError}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      inputMode="numeric"
                      value={corretorForm.cpf}
                      onChange={(e) => setCorretorForm({ ...corretorForm, cpf: formatCPF(e.target.value) })}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
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

                <p className="text-sm text-muted-foreground">
                  Ao se cadastrar, você concorda com os{' '}
                  <Link to="/termos-de-uso" target="_blank" className="text-primary hover:underline">
                    Termos de Uso
                  </Link>{' '}
                  e{' '}
                  <Link to="/politica-privacidade" target="_blank" className="text-primary hover:underline">
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
                    className="flex-1"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      'Criar Conta'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
