import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UserContext {
  nome: string | null;
  role: string | null;
  plano: string | null;
  empresa: string | null;
  isLoggedIn: boolean;
  currentPage: string;
  pageContext: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistente`;

// Map routes to page context and quick replies
const PAGE_CONTEXT_MAP: Record<string, { context: string; quickReplies: string[] }> = {
  '/dashboard': {
    context: 'Dashboard principal - visão geral de fichas e métricas',
    quickReplies: ['Como interpretar as métricas?', 'Exportar relatório', 'Ver fichas pendentes']
  },
  '/fichas': {
    context: 'Lista de fichas de visita',
    quickReplies: ['Como filtrar fichas?', 'Reenviar confirmação', 'Baixar comprovante PDF']
  },
  '/fichas/nova': {
    context: 'Formulário de criação de nova ficha de visita',
    quickReplies: ['Campos obrigatórios?', 'Como funciona o OTP?', 'Posso editar depois?']
  },
  '/clientes': {
    context: 'Lista de clientes cadastrados',
    quickReplies: ['Como adicionar cliente?', 'Diferença comprador/proprietário?', 'Importar clientes']
  },
  '/clientes/novo': {
    context: 'Formulário de cadastro de novo cliente',
    quickReplies: ['CPF é obrigatório?', 'Posso editar depois?', 'Para que servem as tags?']
  },
  '/imoveis': {
    context: 'Lista de imóveis cadastrados',
    quickReplies: ['Como cadastrar imóvel?', 'Vincular proprietário', 'Tipos de imóvel']
  },
  '/imoveis/novo': {
    context: 'Formulário de cadastro de novo imóvel',
    quickReplies: ['Campos obrigatórios?', 'Posso vincular proprietário?', 'Adicionar notas']
  },
  '/perfil': {
    context: 'Página de perfil do usuário',
    quickReplies: ['Alterar minha foto', 'Atualizar CRECI', 'Alterar senha']
  },
  '/relatorios': {
    context: 'Página de relatórios e métricas',
    quickReplies: ['Exportar dados', 'Período personalizado', 'Métricas disponíveis']
  },
  '/templates': {
    context: 'Página de templates de mensagem',
    quickReplies: ['Criar template', 'Variáveis disponíveis', 'Template padrão']
  },
  '/assinatura': {
    context: 'Página de gerenciamento de assinatura',
    quickReplies: ['Alterar plano', 'Formas de pagamento', 'Cancelar assinatura']
  },
  '/empresa/corretores': {
    context: 'Gerenciamento de corretores da imobiliária',
    quickReplies: ['Adicionar corretor', 'Resetar senha', 'Limite de corretores']
  },
  '/empresa/dashboard': {
    context: 'Dashboard da imobiliária',
    quickReplies: ['Métricas por corretor', 'Relatório consolidado', 'Fichas da equipe']
  },
  '/instalar': {
    context: 'Página de instalação do app PWA',
    quickReplies: ['Como instalar no Android?', 'Como instalar no iPhone?', 'Funciona offline?']
  }
};

const DEFAULT_QUICK_REPLIES_USER = [
  "Como criar uma ficha?",
  "Como enviar confirmação?",
  "Problemas com WhatsApp",
  "Alterar meu plano"
];

const QUICK_REPLIES_VISITOR = [
  "Como funciona o sistema?",
  "Quais são os planos?",
  "Como instalar o app?",
  "Formas de pagamento"
];

export function ChatAssistente() {
  const { user } = useAuth();
  const { role, imobiliaria, assinatura, loading: roleLoading } = useUserRole();
  const location = useLocation();
  const [profileName, setProfileName] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get current page context
  const currentPageInfo = useMemo(() => {
    const path = location.pathname;
    // Try exact match first
    if (PAGE_CONTEXT_MAP[path]) {
      return PAGE_CONTEXT_MAP[path];
    }
    // Try prefix match for dynamic routes (e.g., /fichas/123)
    const matchingKey = Object.keys(PAGE_CONTEXT_MAP).find(key => 
      path.startsWith(key) && key !== '/'
    );
    if (matchingKey) {
      return PAGE_CONTEXT_MAP[matchingKey];
    }
    return null;
  }, [location.pathname]);

  // Fetch profile name when user is available
  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setProfileName(null);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('nome')
        .eq('user_id', user.id)
        .maybeSingle();
      setProfileName(data?.nome || null);
    }
    fetchProfile();
  }, [user]);

  // Build user context with page info
  const userContext: UserContext = useMemo(() => ({
    nome: profileName,
    role: role,
    plano: assinatura?.plano?.nome || null,
    empresa: imobiliaria?.nome || null,
    isLoggedIn: !!user,
    currentPage: location.pathname,
    pageContext: currentPageInfo?.context || 'Navegação geral'
  }), [profileName, role, assinatura, imobiliaria, user, location.pathname, currentPageInfo]);

  // Generate personalized greeting
  const getGreeting = () => {
    if (userContext.isLoggedIn && userContext.nome) {
      const firstName = userContext.nome.split(' ')[0];
      return `Olá, ${firstName}! 👋 Sou a Sofia, sua assistente virtual do VisitaSegura. Como posso te ajudar hoje?`;
    }
    return 'Olá! 👋 Sou a Sofia, assistente virtual do VisitaSegura. Posso te ajudar com dúvidas sobre o sistema, mostrar como funciona ou dar suporte técnico. Como posso te ajudar hoje?';
  };

  // Initialize messages with personalized greeting
  useEffect(() => {
    if (!roleLoading) {
      setMessages([{ role: 'assistant', content: getGreeting() }]);
    }
  }, [roleLoading, userContext.nome]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const streamChat = async (userMessage: string) => {
    const userMsg: Message = { role: 'user', content: userMessage };
    const allMessages = [...messages, userMsg];
    
    setMessages(allMessages);
    setIsLoading(true);
    setInput('');

    let assistantContent = '';

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          userContext
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao conectar com o assistente');
      }

      if (!resp.body) {
        throw new Error('Resposta vazia do servidor');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      // Add empty assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            }
          } catch {
            // Incomplete JSON, put back and wait
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            }
          } catch { /* ignore */ }
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev.filter(m => m.role !== 'assistant' || m.content !== ''),
        { 
          role: 'assistant', 
          content: error instanceof Error ? error.message : 'Desculpe, ocorreu um erro. Tente novamente.' 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    streamChat(input.trim());
  };

  const handleQuickReply = (reply: string) => {
    if (isLoading) return;
    streamChat(reply);
  };

  // Get context-aware quick replies
  const quickReplies = useMemo(() => {
    if (!userContext.isLoggedIn) {
      return QUICK_REPLIES_VISITOR;
    }
    return currentPageInfo?.quickReplies || DEFAULT_QUICK_REPLIES_USER;
  }, [userContext.isLoggedIn, currentPageInfo]);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 bg-background border rounded-2xl shadow-2xl transition-all duration-300",
        isMinimized 
          ? "w-72 h-14" 
          : "w-[380px] h-[550px] max-h-[80vh] flex flex-col"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <MessageCircle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Sofia - Assistente</h3>
            {!isMinimized && (
              <p className="text-xs opacity-80">VisitaSegura</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-primary-foreground/20 text-primary-foreground"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-primary-foreground/20 text-primary-foreground"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && messages[messages.length - 1]?.content === '' && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length <= 2 && !isLoading && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {quickReplies.map((reply, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickReply(reply)}
                  className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-full transition-colors"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua mensagem..."
                disabled={isLoading}
                className="flex-1 bg-muted rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="h-10 w-10 rounded-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
