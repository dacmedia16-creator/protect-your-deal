import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
}

// Help images mapping - Sofia can reference these by key
const HELP_IMAGES: Record<string, string> = {
  // Imagens básicas
  'criar-ficha': '/help-images/como-criar-ficha.png',
  'enviar-otp': '/help-images/como-enviar-otp.png',
  'convidar-parceiro': '/help-images/como-convidar-parceiro.png',
  'menu': '/help-images/menu-navegacao.png',
  'whatsapp': '/help-images/confirmacao-whatsapp.png',
  'pdf': '/help-images/comprovante-pdf.png',
  'instalar-app': '/help-images/instalar-app.png',
  'lista-fichas': '/help-images/lista-fichas.png',
  'dashboard': '/help-images/dashboard.png',
  'clientes': '/help-images/clientes.png',
  'imoveis': '/help-images/imoveis.png',
  'home': '/help-images/home.png',
  'funcionalidades': '/help-images/funcionalidades.png',
  'como-funciona': '/help-images/como-funciona.png',
  'login': '/help-images/login.png',
  
  // Passo-a-passo: Envio de OTP
  'otp-passo-1': '/help-images/otp-passo-1-enviar.png',
  'otp-passo-2': '/help-images/otp-passo-2-receber.png',
  'otp-passo-3': '/help-images/otp-passo-3-confirmar.png',
  
  // Passo-a-passo: Parceria
  'parceiro-passo-1': '/help-images/parceiro-passo-1-convidar.png',
  'parceiro-passo-2': '/help-images/parceiro-passo-2-whatsapp.png',
  'parceiro-passo-3': '/help-images/parceiro-passo-3-aceitar.png',
  
  // Passo-a-passo: Criar Ficha
  'ficha-passo-1': '/help-images/ficha-passo-1-imovel.png',
  'ficha-passo-2': '/help-images/ficha-passo-2-comprador.png',
  'ficha-passo-3': '/help-images/ficha-passo-3-proprietario.png',
  'ficha-passo-4': '/help-images/ficha-passo-4-sucesso.png',
};

// Fix spacing issues from AI model (sometimes returns "glued" text like "Olá,Denis!")
const fixTextSpacing = (text: string): string => {
  return text
    // Add space after punctuation followed by letter (e.g., "Olá,Denis" -> "Olá, Denis")
    .replace(/([.,!?:])([A-Za-záàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ])/g, '$1 $2')
    // Add space between lowercase and uppercase (e.g., "tudoBem" -> "tudo Bem")
    .replace(/([a-záàâãéèêíìîóòôõúùûç])([A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ])/g, '$1 $2')
    // Normalize multiple spaces to single space
    .replace(/  +/g, ' ');
};

// Process message content to extract image markers
// TEMPORARIAMENTE DESATIVADO: Imagens desativadas até que screenshots corretos sejam adicionados
const processMessageWithImages = (content: string): { text: string; images: string[] } => {
  // Remove image markers from text but don't add images (temporarily disabled)
  const imagePattern = /\[\s*IMAGEM\s*:\s*([^\]]+?)\s*\]/gi;
  
  let text = content.replace(imagePattern, () => {
    // Images temporarily disabled - just remove the markers
    return '';
  });
  
  // Apply spacing fix to the text
  text = fixTextSpacing(text);
  
  // Return empty images array - functionality temporarily disabled
  return { text: text.trim(), images: [] };
};

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

// Routes where Sofia should be hidden
const HIDDEN_ROUTES = ['/auth', '/registro', '/registro-autonomo', '/convite/', '/confirmar/', '/verificar/', '/aceitar-termos', '/cadastro-concluido'];

// Home paths for proactive messaging
const HOME_PATHS = ['/', '/inicial'];

// Map routes to page context and quick replies
const PAGE_CONTEXT_MAP: Record<string, { context: string; quickReplies: string[] }> = {
  '/dashboard': {
    context: 'Dashboard principal - visão geral de registros e métricas',
    quickReplies: ['Como interpretar as métricas?', 'Exportar relatório', 'Ver registros pendentes']
  },
  '/fichas': {
    context: 'Lista de registros de visita',
    quickReplies: ['Como filtrar registros?', 'Reenviar confirmação', 'Baixar comprovante PDF']
  },
  '/fichas/nova': {
    context: 'Formulário de criação de novo registro de visita',
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
    quickReplies: ['Métricas por corretor', 'Relatório consolidado', 'Registros da equipe']
  },
  '/instalar': {
    context: 'Página de instalação do app PWA',
    quickReplies: ['Como instalar no Android?', 'Como instalar no iPhone?', 'Funciona offline?']
  }
};

const DEFAULT_QUICK_REPLIES_USER = [
  "Como criar um registro?",
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
  const { playNotificationSound } = useNotificationSound();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [profileName, setProfileName] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewSuggestion, setHasNewSuggestion] = useState(false);
  const [proactiveMessageSent, setProactiveMessageSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Track previous user state to detect login
  const previousUserRef = useRef<boolean>(false);

  // Get current page context
  const currentPageInfo = useMemo(() => {
    const path = location.pathname;
    if (PAGE_CONTEXT_MAP[path]) {
      return PAGE_CONTEXT_MAP[path];
    }
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

  // Show suggestion badge after delay for visitors
  useEffect(() => {
    if (!isOpen && !userContext.isLoggedIn && !roleLoading && !proactiveMessageSent) {
      const timer = setTimeout(() => {
        setHasNewSuggestion(true);
      }, 5000); // Show badge after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [isOpen, userContext.isLoggedIn, roleLoading, proactiveMessageSent]);


  // Detect login transition and show welcome message
  useEffect(() => {
    const wasLoggedIn = previousUserRef.current;
    const isLoggedIn = !!user;
    
    // Detect transition: not logged in -> logged in (and not already welcomed this session)
    if (!wasLoggedIn && isLoggedIn && !sessionStorage.getItem('sofia_welcomed')) {
      sessionStorage.setItem('sofia_welcomed', 'true');
      
      // Wait for profile name to load, then show welcome
      const welcomeTimer = setTimeout(() => {
        if (profileName) {
          const firstName = profileName.split(' ')[0];
          setIsOpen(true);
          setMessages([
            { 
              role: 'assistant', 
              content: `Bem-vindo de volta, ${firstName}! 🎉

Você está no **VisitaSegura**. Posso te ajudar com alguma coisa?

Por exemplo:
• 📋 Criar um novo registro de visita
• 📊 Ver suas métricas e relatórios
• ❓ Tirar dúvidas sobre o sistema

É só me dizer!` 
            }
          ]);
        }
      }, 2000);
      
      return () => clearTimeout(welcomeTimer);
    }
    
    previousUserRef.current = isLoggedIn;
  }, [user, profileName]);

  // Clear session flag on logout
  useEffect(() => {
    if (!user) {
      sessionStorage.removeItem('sofia_welcomed');
    }
  }, [user]);
  
  // Clear badge when chat opens
  useEffect(() => {
    if (isOpen) {
      setHasNewSuggestion(false);
    }
  }, [isOpen]);

  // Get page-specific hint for logged-in users
  const getPageHint = (pathname: string): string => {
    if (pathname.includes('/fichas/nova')) return 'Vi que você está criando um registro novo. ';
    if (pathname.includes('/fichas')) return 'Navegando pelos seus registros, né? ';
    if (pathname.includes('/clientes/novo')) return 'Cadastrando um cliente novo! ';
    if (pathname.includes('/clientes')) return 'Gerenciando seus clientes! ';
    if (pathname.includes('/imoveis/novo')) return 'Adicionando um imóvel novo! ';
    if (pathname.includes('/imoveis')) return 'Olhando seus imóveis cadastrados! ';
    if (pathname.includes('/relatorios')) return 'Conferindo os relatórios! ';
    if (pathname.includes('/perfil')) return 'Atualizando seu perfil! ';
    if (pathname.includes('/assinatura')) return 'Verificando sua assinatura! ';
    if (pathname.includes('/dashboard')) return '';
    return '';
  };

  // Generate personalized greeting
  const getGreeting = () => {
    const isHomePage = HOME_PATHS.includes(location.pathname);
    
    // Logged-in user
    if (userContext.isLoggedIn && userContext.nome) {
      const firstName = userContext.nome.split(' ')[0];
      const pageHint = getPageHint(location.pathname);
      return `E aí, ${firstName}! 👋 ${pageHint}Como posso te ajudar hoje?`;
    }
    
    // Visitor on home page - sales focused
    if (isHomePage) {
      return `Oi! 👋 Sou a Sofia, assistente do **VisitaSegura**.

Nosso sistema protege corretores em visitas imobiliárias com:
• 📱 Registros digitais com confirmação via WhatsApp
• ✅ Verificação de identidade por OTP
• 📄 Comprovantes com QR Code verificável

Quer saber como funciona ou tirar alguma dúvida? Estou aqui pra ajudar!`;
    }
    
    // Visitor on other pages
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

  // Buffer to accumulate streamed content before displaying with typing effect
  const streamBufferRef = useRef<string>('');
  const displayedContentRef = useRef<string>('');
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Typing effect: displays characters from buffer gradually
  const startTypingEffect = useCallback(() => {
    if (typingIntervalRef.current) return; // Already running
    
    typingIntervalRef.current = setInterval(() => {
      const buffer = streamBufferRef.current;
      const displayed = displayedContentRef.current;
      
      if (displayed.length < buffer.length) {
        // Calculate how many characters to add (2-4 for speed, but stop at word boundaries when possible)
        let charsToAdd = Math.min(3, buffer.length - displayed.length);
        const nextChunk = buffer.slice(displayed.length, displayed.length + charsToAdd);
        
        displayedContentRef.current = displayed + nextChunk;
        
        // Apply spacing fix and update message
        const fixedContent = fixTextSpacing(displayedContentRef.current);
        const { text: processedText, images } = processMessageWithImages(fixedContent);
        
        setMessages(prev => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            updated[updated.length - 1] = {
              ...lastMsg,
              content: processedText,
              images: images.length > 0 ? images : undefined
            };
          }
          return updated;
        });
      } else if (!isTyping && displayed.length >= buffer.length) {
        // Done typing, clear interval
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
      }
    }, 20); // 20ms per batch = smooth typing effect
  }, [isTyping]);

  // Stop typing effect
  const stopTypingEffect = useCallback(() => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
  }, []);

  // Add content to buffer (called when stream receives data)
  const addToStreamBuffer = useCallback((newContent: string) => {
    streamBufferRef.current += newContent;
    startTypingEffect();
  }, [startTypingEffect]);

  // Reset buffer for new message
  const resetStreamBuffer = useCallback(() => {
    stopTypingEffect();
    streamBufferRef.current = '';
    displayedContentRef.current = '';
  }, [stopTypingEffect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopTypingEffect();
  }, [stopTypingEffect]);

  // Filter out error messages from history before sending to API
  const cleanMessagesForApi = (msgs: Message[]): Message[] => {
    return msgs.filter(m => {
      if (m.role !== 'assistant') return true;
      const content = m.content.toLowerCase().trim();
      // Filter out known error messages
      if (content === 'load failed') return false;
      if (content === '') return false;
      if (content.includes('ocorreu um erro')) return false;
      if (content.includes('erro ao conectar')) return false;
      if (content.includes('tente novamente')) return false;
      return true;
    });
  };

  // Check if error is a mobile streaming issue
  const isMobileStreamingError = (error: unknown): boolean => {
    if (!(error instanceof Error)) return false;
    const msg = error.message.toLowerCase();
    return msg.includes('load failed') || 
           msg.includes('failed to fetch') || 
           msg.includes('network') ||
           msg.includes('aborted');
  };

  const streamChat = async (userMessage: string, retryCount = 0) => {
    const MAX_RETRIES = 2;
    const MOBILE_TIMEOUT = 30000; // 30s timeout for mobile
    
    const userMsg: Message = { role: 'user', content: userMessage };
    const allMessages = [...messages, userMsg];
    
    // Only update messages on first attempt
    if (retryCount === 0) {
      setMessages(allMessages);
      setIsLoading(true);
      setIsTyping(true);
      setInput('');
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MOBILE_TIMEOUT);

    try {
      // Clean messages before sending to API (remove error messages from history)
      const cleanedMessages = cleanMessagesForApi(allMessages);
      
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: cleanedMessages.map(m => ({ role: m.role, content: m.content })),
          userContext
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

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

      // Reset buffer for new message
      resetStreamBuffer();

      // Add empty assistant message and play notification sound (only on first attempt)
      if (retryCount === 0) {
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
        playNotificationSound('info');
      }

      let streamDone = false;
      
      while (!streamDone) {
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
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              // Add to buffer for typing effect
              addToStreamBuffer(content);
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
              addToStreamBuffer(content);
            }
          } catch { /* ignore */ }
        }
      }

      // Stream is done - but keep typing effect running until buffer is fully displayed
      setIsTyping(false);
      setIsLoading(false);
      
      // Cancel reader to ensure connection closes
      try {
        await reader.cancel();
      } catch { /* ignore */ }

    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Chat error:', error);
      
      // Check if this is a mobile streaming error and we can retry
      if (isMobileStreamingError(error) && retryCount < MAX_RETRIES) {
        console.log(`Retrying... attempt ${retryCount + 1}/${MAX_RETRIES}`);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return streamChat(userMessage, retryCount + 1);
      }
      
      setIsTyping(false);
      setIsLoading(false);
      
      // Remove empty assistant message if exists
      setMessages(prev => prev.filter(m => !(m.role === 'assistant' && m.content === '')));
      
      // Show toast instead of saving error as message
      toast.error('Erro ao conectar com a Sofia. Toque para tentar novamente.', {
        action: {
          label: 'Tentar',
          onClick: () => streamChat(userMessage, 0)
        },
        duration: 5000
      });
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

  // Determine if we should show typing indicator
  const showTypingIndicator = isTyping && messages[messages.length - 1]?.content === '';

  // Hide on sensitive routes
  const isHiddenRoute = HIDDEN_ROUTES.some(route => location.pathname.startsWith(route));
  
  // On mobile: only show on dashboard
  // On desktop: show everywhere except hidden routes
  const MOBILE_VISIBLE_ROUTES = ['/dashboard'];
  const shouldHide = isMobile 
    ? !MOBILE_VISIBLE_ROUTES.includes(location.pathname)
    : isHiddenRoute;
    
  if (shouldHide || roleLoading) return null;

  // Adjust position based on user state - for logged-in users on mobile, position left to avoid FAB conflict
  const buttonPositionClass = userContext.isLoggedIn
    ? "fixed bottom-24 sm:bottom-6 left-4 sm:left-auto sm:right-6 z-[9999]"
    : "fixed bottom-6 right-4 sm:right-6 z-[9999]";

  const chatPositionClass = userContext.isLoggedIn
    ? "fixed bottom-24 sm:bottom-6 left-4 sm:left-auto sm:right-6 z-[9999]"
    : "fixed bottom-6 right-4 sm:right-6 z-[9999]";

  if (!isOpen) {
    return (
      <div className={buttonPositionClass}>
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            "h-16 w-16 sm:h-14 sm:w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 relative border-2 border-primary-foreground/20",
            !userContext.isLoggedIn && "animate-sofia-glow"
          )}
          size="icon"
        >
          <MessageCircle className="h-7 w-7 sm:h-6 sm:w-6" />
          {hasNewSuggestion && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-destructive text-destructive-foreground text-xs font-bold items-center justify-center">
                1
              </span>
            </span>
          )}
        </Button>
        {hasNewSuggestion && (
          <div className={cn(
            "absolute bottom-20 sm:bottom-16 bg-background border rounded-lg shadow-lg p-3 w-48 animate-fade-in",
            userContext.isLoggedIn ? "left-0 sm:left-auto sm:right-0" : "right-0"
          )}>
            <p className="text-xs text-muted-foreground">💬 Posso te ajudar?</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        chatPositionClass,
        "bg-background border rounded-2xl shadow-2xl animate-chat-slide-up",
        isMinimized 
          ? "w-72 h-14" 
          : "w-[calc(100vw-2rem)] sm:w-[380px] h-[70vh] sm:h-[550px] max-h-[80vh] flex flex-col"
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
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      ul: ({ children }) => <ul className="list-disc pl-4 my-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 my-1">{children}</ol>,
                      li: ({ children }) => <li className="mb-0.5">{children}</li>,
                      a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">{children}</a>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  
                  {/* Help Images */}
                  {message.images && message.images.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.images.map((img, imgIdx) => (
                        <img
                          key={imgIdx}
                          src={img}
                          alt="Imagem de ajuda"
                          className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity border border-border"
                          onClick={() => window.open(img, '_blank')}
                          onError={(e) => {
                            // Hide image if it doesn't exist
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {showTypingIndicator && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Sofia está digitando</span>
                    <div className="flex items-center gap-0.5">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.6s' }} />
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.6s' }} />
                    </div>
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
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
