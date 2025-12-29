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
        <h1 className="text-3xl md:text-4xl font-heading font-bold mb-8 text-center">
          TERMOS DE USO DA PLATAFORMA VISITASEGURA
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          {/* Seção 1 */}
          <section>
            <h2 className="text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              1. OBJETO
            </h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              O Visitasegura é uma plataforma tecnológica destinada ao registro, organização e 
              armazenamento de informações relacionadas à visita imobiliária, permitindo a geração 
              de documentos eletrônicos com aceite das partes envolvidas.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              A plataforma não presta serviços jurídicos, não realiza intermediação imobiliária 
              e não substitui a atuação de advogados ou corretores.
            </p>
          </section>

          {/* Seção 2 */}
          <section>
            <h2 className="text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              2. NATUREZA DA FERRAMENTA
            </h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              O usuário declara estar ciente de que:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>O Visitasegura atua exclusivamente como ferramenta tecnológica;</li>
              <li>Os documentos gerados constituem meio de prova, devendo ser analisados em conjunto com outros elementos;</li>
              <li>Não há garantia de resultado jurídico, êxito em ações judiciais ou recebimento de comissão.</li>
            </ul>
          </section>

          {/* Seção 3 */}
          <section>
            <h2 className="text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              3. RESPONSABILIDADE DO USUÁRIO
            </h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              É de responsabilidade exclusiva do usuário:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Inserir informações verdadeiras, completas e atualizadas;</li>
              <li>Coletar corretamente os aceites das partes;</li>
              <li>Utilizar a plataforma conforme sua finalidade;</li>
              <li>Zelar pela guarda dos documentos e comprovantes.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              O Visitasegura não se responsabiliza por erros, omissões ou uso inadequado da plataforma.
            </p>
          </section>

          {/* Seção 4 */}
          <section>
            <h2 className="text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              4. LIMITAÇÃO DE RESPONSABILIDADE
            </h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Em nenhuma hipótese o Visitasegura será responsável por:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Perda de comissão;</li>
              <li>Lucros cessantes;</li>
              <li>Danos indiretos;</li>
              <li>Perda de chance;</li>
              <li>Decisões judiciais desfavoráveis ao usuário.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              A responsabilidade do Visitasegura limita-se à disponibilização técnica da plataforma, 
              conforme contratada.
            </p>
          </section>

          {/* Seção 5 */}
          <section>
            <h2 className="text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              5. DISPONIBILIDADE DO SERVIÇO
            </h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              O Visitasegura poderá passar por manutenções, atualizações ou indisponibilidades 
              temporárias, sem que isso gere direito a indenização.
            </p>
          </section>

          {/* Seção 6 */}
          <section>
            <h2 className="text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              6. PROPRIEDADE INTELECTUAL
            </h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Todo o sistema, layout, textos, códigos e funcionalidades pertencem exclusivamente 
              ao Visitasegura, sendo vedada a cópia ou uso indevido.
            </p>
          </section>

          {/* Seção 7 */}
          <section>
            <h2 className="text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              7. ACEITE
            </h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Ao utilizar a plataforma, o usuário declara que leu, compreendeu e concorda 
              integralmente com estes Termos de Uso.
            </p>
          </section>

          {/* Seção 8 */}
          <section>
            <h2 className="text-xl font-heading font-semibold text-foreground border-b border-border pb-2">
              8. FORO
            </h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Fica eleito o foro da comarca de <strong>Sorocaba/SP</strong>, com renúncia a 
              qualquer outro, por mais privilegiado que seja.
            </p>
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

export default TermosDeUso;
