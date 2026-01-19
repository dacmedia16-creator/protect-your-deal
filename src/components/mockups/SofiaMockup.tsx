import { MessageCircle, Sparkles } from 'lucide-react';

const SofiaMockup = () => {
  const sugestoes = [
    'Como criar uma ficha?',
    'Como enviar o código?',
    'Ver meus relatórios',
  ];

  return (
    <div className="bg-background rounded-lg p-4 space-y-4">
      {/* Chat container */}
      <div className="space-y-3">
        {/* Sofia message */}
        <div className="flex gap-2">
          <div className="shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold">Sofia</span>
              <span className="text-[10px] text-muted-foreground">Assistente IA</span>
            </div>
            <div className="bg-muted rounded-lg rounded-tl-none p-3">
              <p className="text-xs leading-relaxed">
                Olá! 👋 Eu sou a <strong>Sofia</strong>, sua assistente virtual. 
                Estou aqui para ajudar você a usar o VisitaSegura. 
                O que você gostaria de saber?
              </p>
            </div>
          </div>
        </div>

        {/* User message */}
        <div className="flex gap-2 justify-end">
          <div className="max-w-[80%]">
            <div className="bg-primary text-primary-foreground rounded-lg rounded-tr-none p-3">
              <p className="text-xs">Como faço para enviar o código OTP?</p>
            </div>
          </div>
        </div>

        {/* Sofia response */}
        <div className="flex gap-2">
          <div className="shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="bg-muted rounded-lg rounded-tl-none p-3">
              <p className="text-xs leading-relaxed">
                Para enviar o código OTP, abra a ficha desejada e clique no botão 
                <strong> "Enviar Código"</strong>. O WhatsApp será aberto automaticamente! 📱
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick replies */}
      <div className="space-y-2">
        <p className="text-[10px] text-muted-foreground text-center">Sugestões rápidas:</p>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {sugestoes.map((sugestao) => (
            <button
              key={sugestao}
              className="px-2.5 py-1 text-[10px] rounded-full bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
            >
              {sugestao}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2 items-center">
        <div className="flex-1 bg-muted rounded-lg px-3 py-2">
          <p className="text-xs text-muted-foreground">Digite sua mensagem...</p>
        </div>
        <button className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <MessageCircle className="h-4 w-4 text-primary-foreground" />
        </button>
      </div>
    </div>
  );
};

export default SofiaMockup;
