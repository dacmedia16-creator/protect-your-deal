import { useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Building2, UserPlus, ArrowLeft } from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';

const RegistroTipo = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plano = searchParams.get('plano') || 'gratuito';
  const ref = searchParams.get('ref') || '';
  const aff = searchParams.get('aff') || '';

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <LogoIcon size={28} />
            <span className="font-heading text-xl font-bold">VisitaProva</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
              Como você quer se cadastrar?
            </h1>
            <p className="text-muted-foreground">
              Escolha o tipo de cadastro que melhor se adequa ao seu perfil
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Pessoa Física */}
            <Card 
              className="group cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-300"
              onClick={() => navigate(`/registro-autonomo?plano=${plano}${ref ? `&ref=${ref}` : ''}`)}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Pessoa Física</CardTitle>
                <CardDescription>Corretor Autônomo</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Para corretores independentes que trabalham por conta própria, sem vínculo com imobiliária.
                </p>
                <ul className="text-sm text-left space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Cadastro com CPF
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Acesso individual
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Gestão simplificada
                  </li>
                </ul>
                <Button className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground">
                  Cadastrar como Pessoa Física
                </Button>
              </CardContent>
            </Card>

            {/* Vincular a Imobiliária */}
            <Card 
              className="group cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-300"
              onClick={() => navigate('/registro-vinculado')}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <UserPlus className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Vincular a Imobiliária</CardTitle>
                <CardDescription>Corretor de Imobiliária</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Para corretores que já possuem uma imobiliária cadastrada e desejam se vincular.
                </p>
                <ul className="text-sm text-left space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Usa código da imobiliária
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Acesso ao sistema da empresa
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Sem custos adicionais
                  </li>
                </ul>
                <Button variant="outline" className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary">
                  Vincular a uma Imobiliária
                </Button>
              </CardContent>
            </Card>

            {/* Pessoa Jurídica */}
            <Card 
              className="group cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-300"
              onClick={() => navigate(`/registro?plano=${plano}${ref ? `&ref=${ref}` : ''}`)}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Pessoa Jurídica</CardTitle>
                <CardDescription>Imobiliária ou Empresa</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Para imobiliárias, empresas ou profissionais que precisam de CNPJ e múltiplos usuários.
                </p>
                <ul className="text-sm text-left space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Cadastro com CNPJ
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Múltiplos corretores
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Gestão de equipe
                  </li>
                </ul>
                <Button variant="outline" className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground">
                  Cadastrar como Pessoa Jurídica
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <Button variant="ghost" asChild>
              <Link to="/" className="text-muted-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para o início
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistroTipo;
