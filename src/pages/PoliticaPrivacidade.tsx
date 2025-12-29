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
      <main className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold mb-6 sm:mb-8 text-center">
          <span className="hidden sm:inline">POLÍTICA DE RESPONSABILIDADE JURÍDICA</span>
          <span className="sm:hidden">RESPONSABILIDADE JURÍDICA</span>
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 sm:space-y-8">
          {/* Seção 1 */}
          <section>
            <h2 className="text-lg sm:text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              1. FINALIDADE
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-3 sm:mt-4">
              <span className="hidden sm:inline">
                Esta política tem como objetivo esclarecer os limites da atuação do Visitasegura 
                quanto ao uso jurídico dos documentos gerados na plataforma.
              </span>
              <span className="sm:hidden">
                Esclarecer limites do uso jurídico dos documentos.
              </span>
            </p>
          </section>

          {/* Seção 2 */}
          <section>
            <h2 className="text-lg sm:text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              <span className="hidden sm:inline">2. AUSÊNCIA DE GARANTIA DE RESULTADO</span>
              <span className="sm:hidden">2. SEM GARANTIA</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-3 sm:mt-4">
              O Visitasegura não garante:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-muted-foreground space-y-1 sm:space-y-2 ml-2 sm:ml-4">
              <li><span className="hidden sm:inline">Ganho de causa em ações judiciais</span><span className="sm:hidden">Ganho de causa</span></li>
              <li><span className="hidden sm:inline">Recebimento de comissão de corretagem</span><span className="sm:hidden">Recebimento de comissão</span></li>
              <li><span className="hidden sm:inline">Reconhecimento automático da intermediação por autoridades judiciais ou administrativas</span><span className="sm:hidden">Reconhecimento automático</span></li>
            </ul>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-3 sm:mt-4">
              <span className="hidden sm:inline">As decisões judiciais dependem de interpretação do magistrado, legislação aplicável e conjunto probatório do caso concreto.</span>
              <span className="sm:hidden">Decisões dependem do magistrado e provas.</span>
            </p>
          </section>

          {/* Seção 3 */}
          <section>
            <h2 className="text-lg sm:text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              <span className="hidden sm:inline">3. NATUREZA PROBATÓRIA DOS DOCUMENTOS</span>
              <span className="sm:hidden">3. DOCUMENTOS</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-3 sm:mt-4">
              Os documentos gerados:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-muted-foreground space-y-1 sm:space-y-2 ml-2 sm:ml-4">
              <li><span className="hidden sm:inline">Constituem meio de prova documental</span><span className="sm:hidden">São meio de prova</span></li>
              <li><span className="hidden sm:inline">Devem ser analisados em conjunto com outros elementos</span><span className="sm:hidden">Analisados com outras provas</span></li>
              <li><span className="hidden sm:inline">Não substituem contratos, mandatos ou assessoria jurídica especializada</span><span className="sm:hidden">Não substituem contratos</span></li>
            </ul>
          </section>

          {/* Seção 4 */}
          <section>
            <h2 className="text-lg sm:text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              4. CONDUTA DO USUÁRIO
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-3 sm:mt-4">
              <span className="hidden sm:inline">O Visitasegura não se responsabiliza por:</span>
              <span className="sm:hidden">Não nos responsabilizamos por:</span>
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-muted-foreground space-y-1 sm:space-y-2 ml-2 sm:ml-4">
              <li>Uso indevido</li>
              <li>Informações falsas</li>
              <li>Falta de aceite</li>
              <li>Alterações externas</li>
              <li><span className="hidden sm:inline">Utilização fora das boas práticas imobiliárias</span><span className="sm:hidden">Más práticas</span></li>
            </ul>
          </section>

          {/* Seção 5 */}
          <section>
            <h2 className="text-lg sm:text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              <span className="hidden sm:inline">5. ISENÇÃO DE RESPONSABILIDADE CIVIL</span>
              <span className="sm:hidden">5. ISENÇÃO</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-3 sm:mt-4">
              <span className="hidden sm:inline">O Visitasegura não poderá ser responsabilizado civilmente por prejuízos decorrentes de:</span>
              <span className="sm:hidden">Não somos responsáveis por:</span>
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-muted-foreground space-y-1 sm:space-y-2 ml-2 sm:ml-4">
              <li>Decisão judicial desfavorável</li>
              <li><span className="hidden sm:inline">Interpretação diversa do magistrado</span><span className="sm:hidden">Interpretação do juiz</span></li>
              <li>Conduta de terceiros</li>
              <li><span className="hidden sm:inline">Falhas na atuação profissional do usuário</span><span className="sm:hidden">Falhas profissionais</span></li>
            </ul>
          </section>

          {/* Seção 6 */}
          <section>
            <h2 className="text-lg sm:text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              6. CIÊNCIA E ACEITE
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-3 sm:mt-4">
              <span className="hidden sm:inline">O uso da plataforma implica ciência expressa de que:</span>
              <span className="sm:hidden">Ao usar, você reconhece:</span>
            </p>
            <div className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
              <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-muted-foreground">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-muted-foreground/50 rounded flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                </div>
                <span><span className="hidden sm:inline">O Visitasegura é ferramenta tecnológica</span><span className="sm:hidden">É ferramenta tecnológica</span></span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-muted-foreground">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-muted-foreground/50 rounded flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                </div>
                <span><span className="hidden sm:inline">Não há promessa de resultado jurídico</span><span className="sm:hidden">Sem promessa de resultado</span></span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-muted-foreground">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-muted-foreground/50 rounded flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                </div>
                <span><span className="hidden sm:inline">O usuário é responsável pela correta utilização</span><span className="sm:hidden">Você é responsável pelo uso</span></span>
              </div>
            </div>
          </section>

          {/* Nível de Proteção */}
          <section className="mt-8 sm:mt-12">
            <h2 className="text-lg sm:text-xl font-heading font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
              🔐 <span className="hidden sm:inline">NÍVEL DE PROTEÇÃO QUE VOCÊ ATINGIU</span><span className="sm:hidden">NÍVEL DE PROTEÇÃO</span>
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-4 sm:mt-6">
              <Card className="border-green-500/30 bg-green-500/5">
                <CardContent className="p-2 sm:p-4 flex items-center gap-2 sm:gap-3">
                  <span className="text-lg sm:text-2xl">🟢</span>
                  <span className="text-xs sm:text-base text-foreground font-medium"><span className="hidden sm:inline">Blindagem jurídica alta</span><span className="sm:hidden">Blindagem alta</span></span>
                </CardContent>
              </Card>
              <Card className="border-green-500/30 bg-green-500/5">
                <CardContent className="p-2 sm:p-4 flex items-center gap-2 sm:gap-3">
                  <span className="text-lg sm:text-2xl">🟢</span>
                  <span className="text-xs sm:text-base text-foreground font-medium"><span className="hidden sm:inline">Risco de ação contra o SaaS baixo</span><span className="sm:hidden">Risco baixo</span></span>
                </CardContent>
              </Card>
              <Card className="border-green-500/30 bg-green-500/5">
                <CardContent className="p-2 sm:p-4 flex items-center gap-2 sm:gap-3">
                  <span className="text-lg sm:text-2xl">🟢</span>
                  <span className="text-xs sm:text-base text-foreground font-medium"><span className="hidden sm:inline">Linguagem compatível com SaaS profissionais</span><span className="sm:hidden">Linguagem profissional</span></span>
                </CardContent>
              </Card>
              <Card className="border-green-500/30 bg-green-500/5">
                <CardContent className="p-2 sm:p-4 flex items-center gap-2 sm:gap-3">
                  <span className="text-lg sm:text-2xl">🟢</span>
                  <span className="text-xs sm:text-base text-foreground font-medium"><span className="hidden sm:inline">Defesa sólida em eventual processo</span><span className="sm:hidden">Defesa sólida</span></span>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>

        {/* Back Button */}
        <div className="mt-8 sm:mt-12 text-center">
          <Button variant="outline" size="sm" asChild className="sm:size-default">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Voltar para a página inicial</span>
              <span className="sm:hidden">Voltar</span>
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
