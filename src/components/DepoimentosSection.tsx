import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

interface Depoimento {
  id: string;
  nome: string;
  cargo: string | null;
  empresa: string | null;
  texto: string;
  nota: number;
  avatar_url: string | null;
}

export function DepoimentosSection() {
  const [depoimentos, setDepoimentos] = useState<Depoimento[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('depoimentos')
        .select('id, nome, cargo, empresa, texto, nota, avatar_url')
        .eq('ativo', true)
        .order('ordem', { ascending: true });
      if (data) setDepoimentos(data);
    };
    fetch();
  }, []);

  const onSelect = useCallback(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    onSelect();
    api.on('select', onSelect);
    return () => { api.off('select', onSelect); };
  }, [api, onSelect]);

  if (depoimentos.length === 0) return null;

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Star className="h-4 w-4" />
            Depoimentos
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            O que nossos clientes dizem
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Veja como o VisitaProva está transformando o dia a dia de corretores e imobiliárias
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Carousel
            setApi={setApi}
            plugins={[Autoplay({ delay: 5000, stopOnInteraction: false })]}
            opts={{ loop: true }}
            className="w-full"
          >
            <CarouselContent>
              {depoimentos.map((d) => (
                <CarouselItem key={d.id}>
                  <div className="px-2">
                    <Card className="relative overflow-hidden">
                      <CardContent className="p-8 text-center">
                        <Quote className="h-10 w-10 text-primary/20 mx-auto mb-6" />
                        <p className="text-muted-foreground italic mb-6 leading-relaxed text-lg">
                          "{d.texto}"
                        </p>
                        <div className="flex items-center justify-center gap-1 mb-6">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < d.nota ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`}
                            />
                          ))}
                        </div>
                        <div className="flex items-center justify-center gap-3">
                          {d.avatar_url ? (
                            <img
                              src={d.avatar_url}
                              alt={d.nome}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                              {getInitials(d.nome)}
                            </div>
                          )}
                          <div className="text-left">
                            <p className="font-semibold">{d.nome}</p>
                            {(d.cargo || d.empresa) && (
                              <p className="text-sm text-muted-foreground">
                                {[d.cargo, d.empresa].filter(Boolean).join(' · ')}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-4 md:-left-12" />
            <CarouselNext className="-right-4 md:-right-12" />
          </Carousel>

          {depoimentos.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {depoimentos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => api?.scrollTo(i)}
                  className={`h-2.5 rounded-full transition-all ${
                    i === current ? 'w-8 bg-primary' : 'w-2.5 bg-primary/25'
                  }`}
                  aria-label={`Ir para depoimento ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
