import AnimatedSection from "@/components/AnimatedSection";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "O VisitaProva é só para registro de visitas?",
    a: "Não. Para construtoras, ele funciona como uma camada de organização e leitura da operação comercial, permitindo acompanhar parceiros, empreendimentos, corretores e indicadores em um só lugar.",
  },
  {
    q: "Consigo acompanhar imobiliárias parceiras separadamente?",
    a: "Sim. A plataforma permite analisar performance por parceira, com indicadores de volume, confirmação, conversão e valor vendido.",
  },
  {
    q: "É possível comparar empreendimentos?",
    a: "Sim. O sistema mostra performance por projeto, ajudando a identificar quais empreendimentos estão puxando resultado e quais precisam de atenção.",
  },
  {
    q: "Os dados podem ser filtrados?",
    a: "Sim. É possível filtrar por período, status, empreendimento, imobiliária parceira e corretor.",
  },
  {
    q: "Posso exportar os relatórios?",
    a: "Sim. Os dados filtrados podem ser exportados em CSV para análise complementar.",
  },
  {
    q: "Essa página precisa vender segurança?",
    a: "Não. Nesta landing, o foco está em organização comercial, gestão e visibilidade operacional. A segurança jurídica é um benefício adicional, não o argumento principal.",
  },
];

const FAQSection = () => (
  <section className="bg-[#0B1120] py-20">
    <div className="container mx-auto px-4">
      <AnimatedSection>
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Perguntas <span className="text-[#60A5FA]">frequentes</span>
        </h2>
      </AnimatedSection>

      <AnimatedSection>
        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-white/[0.03] border border-white/10 rounded-xl px-5 data-[state=open]:border-[#60A5FA]/20"
              >
                <AccordionTrigger className="text-sm text-white/80 font-medium hover:no-underline py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-white/50 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </AnimatedSection>
    </div>
  </section>
);

export default FAQSection;
