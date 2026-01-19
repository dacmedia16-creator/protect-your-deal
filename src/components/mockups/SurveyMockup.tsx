import { Star } from 'lucide-react';

const SurveyMockup = () => {
  const criterios = [
    { nome: 'Localização', nota: 5 },
    { nome: 'Tamanho', nota: 4 },
    { nome: 'Layout', nota: 5 },
    { nome: 'Acabamento', nota: 4 },
    { nome: 'Manutenção', nota: 3 },
    { nome: 'Áreas Comuns', nota: 4 },
    { nome: 'Preço', nota: 3 },
  ];

  return (
    <div className="bg-background rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
          <Star className="h-3 w-3" />
          Pesquisa Pós-Visita
        </div>
        <h3 className="font-semibold text-sm">Como foi sua experiência?</h3>
        <p className="text-xs text-muted-foreground">Avalie o imóvel visitado</p>
      </div>

      {/* Criterios */}
      <div className="space-y-2">
        {criterios.map((criterio) => (
          <div key={criterio.nome} className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/50">
            <span className="text-xs font-medium">{criterio.nome}</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3.5 w-3.5 ${
                    star <= criterio.nota
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pergunta intenção */}
      <div className="border-t pt-3 space-y-2">
        <p className="text-xs font-medium text-center">Compraria este imóvel?</p>
        <div className="flex gap-2 justify-center">
          <button className="px-4 py-1.5 text-xs rounded-full bg-emerald-500/10 text-emerald-600 font-medium border border-emerald-500/30">
            ✓ Sim
          </button>
          <button className="px-4 py-1.5 text-xs rounded-full bg-muted text-muted-foreground font-medium border border-border">
            Não
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-2">
        <button className="w-full py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground">
          Enviar Avaliação
        </button>
      </div>
    </div>
  );
};

export default SurveyMockup;
