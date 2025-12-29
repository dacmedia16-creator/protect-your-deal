import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const PoliticaPrivacidade = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="font-heading font-bold text-xl">VisitaSegura</span>
            </Link>
            <Button variant="outline" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-heading font-bold mb-8 text-center">
          POLÍTICA DE RESPONSABILIDADE JURÍDICA
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          {/* Seção 1 */}
          <section>
            <h2 className="text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              1. FINALIDADE
            </h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Esta política tem como objetivo esclarecer os limites da atuação do Visitasegura 
              quanto ao uso jurídico dos documentos gerados na plataforma.
            </p>
          </section>

          {/* Seção 2 */}
          <section>
            <h2 className="text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              2. AUSÊNCIA DE GARANTIA DE RESULTADO
            </h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              O Visitasegura não garante:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Ganho de causa em ações judiciais;</li>
              <li>Recebimento de comissão de corretagem;</li>
              <li>Reconhecimento automático da intermediação por autoridades judiciais ou administrativas.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              As decisões judiciais dependem de interpretação do magistrado, legislação aplicável 
              e conjunto probatório do caso concreto.
            </p>
          </section>

          {/* Seção 3 */}
          <section>
            <h2 className="text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              3. NATUREZA PROBATÓRIA DOS DOCUMENTOS
            </h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Os documentos gerados:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Constituem meio de prova documental;</li>
              <li>Devem ser analisados em conjunto com outros elementos;</li>
              <li>Não substituem contratos, mandatos ou assessoria jurídica especializada.</li>
            </ul>
          </section>

          {/* Seção 4 */}
          <section>
            <h2 className="text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              4. CONDUTA DO USUÁRIO
            </h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              O Visitasegura não se responsabiliza por:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Uso indevido da plataforma;</li>
              <li>Informações falsas ou incompletas;</li>
              <li>Falta de aceite de uma ou mais partes;</li>
              <li>Alterações externas ao sistema;</li>
              <li>Utilização fora das boas práticas imobiliárias.</li>
            </ul>
          </section>

          {/* Seção 5 */}
          <section>
            <h2 className="text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              5. ISENÇÃO DE RESPONSABILIDADE CIVIL
            </h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              O Visitasegura não poderá ser responsabilizado civilmente por prejuízos decorrentes de:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Decisão judicial desfavorável;</li>
              <li>Interpretação diversa do magistrado;</li>
              <li>Conduta de terceiros;</li>
              <li>Falhas na atuação profissional do usuário.</li>
            </ul>
          </section>

          {/* Seção 6 */}
          <section>
            <h2 className="text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              6. CIÊNCIA E ACEITE
            </h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              O uso da plataforma implica ciência expressa de que:
            </p>
            <div className="space-y-3 mt-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-5 h-5 border-2 border-muted-foreground/50 rounded flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-primary" />
                </div>
                <span>O Visitasegura é ferramenta tecnológica</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-5 h-5 border-2 border-muted-foreground/50 rounded flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-primary" />
                </div>
                <span>Não há promessa de resultado jurídico</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-5 h-5 border-2 border-muted-foreground/50 rounded flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-primary" />
                </div>
                <span>O usuário é responsável pela correta utilização</span>
              </div>
            </div>
          </section>

          {/* Nível de Proteção */}
          <section className="mt-12">
            <h2 className="text-xl font-heading font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
              🔐 NÍVEL DE PROTEÇÃO QUE VOCÊ ATINGIU
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Card className="border-green-500/30 bg-green-500/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="text-2xl">🟢</span>
                  <span className="text-foreground font-medium">Blindagem jurídica alta</span>
                </CardContent>
              </Card>
              <Card className="border-green-500/30 bg-green-500/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="text-2xl">🟢</span>
                  <span className="text-foreground font-medium">Risco de ação contra o SaaS baixo</span>
                </CardContent>
              </Card>
              <Card className="border-green-500/30 bg-green-500/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="text-2xl">🟢</span>
                  <span className="text-foreground font-medium">Linguagem compatível com SaaS profissionais</span>
                </CardContent>
              </Card>
              <Card className="border-green-500/30 bg-green-500/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="text-2xl">🟢</span>
                  <span className="text-foreground font-medium">Defesa sólida em eventual processo</span>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>

        {/* Back Button */}
        <div className="mt-12 text-center">
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para a página inicial
            </Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} VisitaSegura. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PoliticaPrivacidade;
