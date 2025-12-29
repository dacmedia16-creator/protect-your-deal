import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TermosDeUso = () => {
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
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold mb-6 sm:mb-8 text-center">
          <span className="hidden sm:inline">TERMOS DE USO DA PLATAFORMA VISITASEGURA</span>
          <span className="sm:hidden">TERMOS DE USO</span>
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 sm:space-y-8">
          {/* Seção 1 */}
          <section>
            <h2 className="text-lg sm:text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              1. OBJETO
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-3 sm:mt-4">
              <span className="hidden sm:inline">
                O Visitasegura é uma plataforma tecnológica destinada ao registro, organização e 
                armazenamento de informações relacionadas à visita imobiliária, permitindo a geração 
                de documentos eletrônicos com aceite das partes envolvidas.
              </span>
              <span className="sm:hidden">
                Plataforma para registro de visitas imobiliárias e geração de documentos eletrônicos.
              </span>
            </p>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              <span className="hidden sm:inline">
                A plataforma não presta serviços jurídicos, não realiza intermediação imobiliária 
                e não substitui a atuação de advogados ou corretores.
              </span>
              <span className="sm:hidden">
                Não substitui advogados ou corretores.
              </span>
            </p>
          </section>

          {/* Seção 2 */}
          <section>
            <h2 className="text-lg sm:text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              2. NATUREZA DA FERRAMENTA
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-3 sm:mt-4">
              O usuário declara estar ciente de que:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-muted-foreground space-y-1 sm:space-y-2 ml-2 sm:ml-4">
              <li><span className="hidden sm:inline">O Visitasegura atua exclusivamente como ferramenta tecnológica</span><span className="sm:hidden">Atua como ferramenta tecnológica</span></li>
              <li><span className="hidden sm:inline">Os documentos gerados constituem meio de prova, devendo ser analisados em conjunto com outros elementos</span><span className="sm:hidden">Documentos são meio de prova</span></li>
              <li><span className="hidden sm:inline">Não há garantia de resultado jurídico, êxito em ações judiciais ou recebimento de comissão</span><span className="sm:hidden">Sem garantia de resultado jurídico</span></li>
            </ul>
          </section>

          {/* Seção 3 */}
          <section>
            <h2 className="text-lg sm:text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              3. RESPONSABILIDADE DO USUÁRIO
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-3 sm:mt-4">
              <span className="hidden sm:inline">É de responsabilidade exclusiva do usuário:</span>
              <span className="sm:hidden">Suas responsabilidades:</span>
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-muted-foreground space-y-1 sm:space-y-2 ml-2 sm:ml-4">
              <li><span className="hidden sm:inline">Inserir informações verdadeiras, completas e atualizadas</span><span className="sm:hidden">Informações verdadeiras</span></li>
              <li><span className="hidden sm:inline">Coletar corretamente os aceites das partes</span><span className="sm:hidden">Coletar aceites</span></li>
              <li><span className="hidden sm:inline">Utilizar a plataforma conforme sua finalidade</span><span className="sm:hidden">Uso correto da plataforma</span></li>
              <li><span className="hidden sm:inline">Zelar pela guarda dos documentos e comprovantes</span><span className="sm:hidden">Guardar documentos</span></li>
            </ul>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-3 sm:mt-4">
              <span className="hidden sm:inline">O Visitasegura não se responsabiliza por erros, omissões ou uso inadequado da plataforma.</span>
              <span className="sm:hidden">Não nos responsabilizamos por erros ou uso inadequado.</span>
            </p>
          </section>

          {/* Seção 4 */}
          <section>
            <h2 className="text-lg sm:text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              4. LIMITAÇÃO DE RESPONSABILIDADE
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-3 sm:mt-4">
              <span className="hidden sm:inline">Em nenhuma hipótese o Visitasegura será responsável por:</span>
              <span className="sm:hidden">Não somos responsáveis por:</span>
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-muted-foreground space-y-1 sm:space-y-2 ml-2 sm:ml-4">
              <li>Perda de comissão</li>
              <li>Lucros cessantes</li>
              <li>Danos indiretos</li>
              <li>Perda de chance</li>
              <li><span className="hidden sm:inline">Decisões judiciais desfavoráveis ao usuário</span><span className="sm:hidden">Decisões judiciais</span></li>
            </ul>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-3 sm:mt-4">
              <span className="hidden sm:inline">A responsabilidade do Visitasegura limita-se à disponibilização técnica da plataforma, conforme contratada.</span>
              <span className="sm:hidden">Responsabilidade limitada à disponibilização técnica.</span>
            </p>
          </section>

          {/* Seção 5 */}
          <section>
            <h2 className="text-lg sm:text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              5. DISPONIBILIDADE
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-3 sm:mt-4">
              <span className="hidden sm:inline">O Visitasegura poderá passar por manutenções, atualizações ou indisponibilidades temporárias, sem que isso gere direito a indenização.</span>
              <span className="sm:hidden">Pode haver manutenções ou indisponibilidades temporárias.</span>
            </p>
          </section>

          {/* Seção 6 */}
          <section>
            <h2 className="text-lg sm:text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              6. PROPRIEDADE INTELECTUAL
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-3 sm:mt-4">
              <span className="hidden sm:inline">Todo o sistema, layout, textos, códigos e funcionalidades pertencem exclusivamente ao Visitasegura, sendo vedada a cópia ou uso indevido.</span>
              <span className="sm:hidden">Todo conteúdo pertence ao Visitasegura.</span>
            </p>
          </section>

          {/* Seção 7 */}
          <section>
            <h2 className="text-lg sm:text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              7. ACEITE
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-3 sm:mt-4">
              <span className="hidden sm:inline">Ao utilizar a plataforma, o usuário declara que leu, compreendeu e concorda integralmente com estes Termos de Uso.</span>
              <span className="sm:hidden">Uso implica concordância com os Termos.</span>
            </p>
          </section>

          {/* Seção 8 */}
          <section>
            <h2 className="text-lg sm:text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              8. FORO
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-3 sm:mt-4">
              Foro: <strong>Sorocaba/SP</strong>
            </p>
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

export default TermosDeUso;
