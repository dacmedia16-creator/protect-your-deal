import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {depoimentos.map((d) => (
            <Card key={d.id} className="relative overflow-hidden">
              <CardContent className="p-6">
                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                <p className="text-muted-foreground italic mb-6 leading-relaxed">
                  "{d.texto}"
                </p>
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < d.nota ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  {d.avatar_url ? (
                    <img
                      src={d.avatar_url}
                      alt={d.nome}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                      {getInitials(d.nome)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm">{d.nome}</p>
                    {(d.cargo || d.empresa) && (
                      <p className="text-xs text-muted-foreground">
                        {[d.cargo, d.empresa].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
