import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  action: 'send' | 'send-template' | 'test-connection';
  to?: string;
  subject?: string;
  html?: string;
  text?: string;
  template_tipo?: string;
  variables?: Record<string, string>;
  ficha_id?: string;
  from_email?: string;
}

interface SMTPCredentials {
  user: string;
  pass: string;
  displayName: string;
}

// Validar se o email é válido
function isValidEmail(email?: string): boolean {
  if (!email || email.trim() === '') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// Get SMTP credentials based on sender email
function getCredentials(fromEmail?: string): SMTPCredentials {
  // Default fallback to noreply
  const defaultUser = Deno.env.get("ZOHO_SMTP_USER") || "noreply@visitaprova.com.br";
  const defaultPass = Deno.env.get("ZOHO_SMTP_PASSWORD") || "";
  
  if (!fromEmail) {
    return { user: defaultUser, pass: defaultPass, displayName: "VisitaProva" };
  }

  const emailLower = fromEmail.toLowerCase();
  
  // Check for specific email accounts
  if (emailLower.includes("suporte")) {
    const user = Deno.env.get("ZOHO_SUPORTE_USER");
    const pass = Deno.env.get("ZOHO_SUPORTE_PASSWORD");
    if (user && pass) {
      return { user, pass, displayName: "Suporte VisitaProva" };
    }
  }
  
  if (emailLower.includes("contato")) {
    const user = Deno.env.get("ZOHO_CONTATO_USER");
    const pass = Deno.env.get("ZOHO_CONTATO_PASSWORD");
    if (user && pass) {
      return { user, pass, displayName: "Contato VisitaProva" };
    }
  }
  
  if (emailLower.includes("denis")) {
    const user = Deno.env.get("ZOHO_DENIS_USER");
    const pass = Deno.env.get("ZOHO_DENIS_PASSWORD");
    if (user && pass) {
      return { user, pass, displayName: "Denis - VisitaProva" };
    }
  }

  // Fallback to default noreply
  return { user: defaultUser, pass: defaultPass, displayName: "VisitaProva" };
}

// Create transporter with specific credentials
function createTransporter(credentials: SMTPCredentials) {
  // Support different Zoho datacenters via environment variable
  const host = Deno.env.get("ZOHO_SMTP_HOST") || "smtppro.zoho.com";
  
  return nodemailer.createTransport({
    host: host,
    port: 465,
    secure: true,
    auth: {
      user: credentials.user,
      pass: credentials.pass,
    },
  });
}

// Substituir variáveis no template
function replaceVariables(content: string, variables: Record<string, string>): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
  }
  return result;
}

// Verificar se é chamada interna do sistema (SERVICE_ROLE_KEY)
function isInternalCall(authHeader: string | null): boolean {
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '');
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  return token === serviceRoleKey;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: SendEmailRequest = await req.json();
    const { action, to, subject, html, text, template_tipo, variables, ficha_id, from_email } = body;

    const authHeader = req.headers.get("Authorization");
    const isInternal = isInternalCall(authHeader);

    // Initialize Supabase client for logging
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user ID from auth header if present (only for non-internal calls)
    let userId: string | null = null;
    if (authHeader && !isInternal) {
      const supabaseUser = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { 
          global: { headers: { Authorization: authHeader } },
          auth: { persistSession: false } 
        }
      );
      const { data: { user } } = await supabaseUser.auth.getUser();
      userId = user?.id || null;
    }

    // Test connection action
    if (action === 'test-connection') {
      console.log("Testing SMTP connection for:", from_email || "default");
      
      const credentials = getCredentials(from_email);
      
      if (!credentials.pass) {
        console.error("SMTP credentials not configured for:", from_email || "default");
        return new Response(
          JSON.stringify({ connected: false, message: "Credenciais SMTP não configuradas para este remetente" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        const transporter = createTransporter(credentials);
        await transporter.verify();
        console.log("SMTP connection successful for:", credentials.user);
        return new Response(
          JSON.stringify({ 
            connected: true, 
            message: `Conexão SMTP estabelecida com sucesso para ${credentials.user}`,
            email: credentials.user
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (verifyError: any) {
        console.error("SMTP connection failed:", verifyError);
        return new Response(
          JSON.stringify({ connected: false, message: verifyError.message }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Send with template action
    if (action === 'send-template') {
      if (!template_tipo) {
        return new Response(
          JSON.stringify({ error: "template_tipo é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validar email do destinatário
      if (!isValidEmail(to)) {
        console.log(`Skipping email send: invalid or missing recipient email: "${to}"`);
        
        await supabaseAdmin.from('email_logs').insert({
          to_email: to || 'não informado',
          subject: `[${template_tipo}] - não enviado`,
          template_tipo: template_tipo,
          status: 'skipped',
          error_message: 'Destinatário sem email válido',
          user_id: userId,
          ficha_id: ficha_id || null,
          from_email: null,
        });
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            skipped: true, 
            reason: "Destinatário sem email válido" 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch template from database (now including remetente_email)
      const { data: template, error: templateError } = await supabaseAdmin
        .from('templates_email')
        .select('*, remetente_email')
        .eq('tipo', template_tipo)
        .eq('ativo', true)
        .maybeSingle();

      if (templateError || !template) {
        console.error("Template not found:", templateError);
        return new Response(
          JSON.stringify({ error: `Template '${template_tipo}' não encontrado` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Determine sender email: use from_email param, or template's remetente_email, or default
      const senderEmail = from_email || template.remetente_email || 'noreply@visitaprova.com.br';
      const credentials = getCredentials(senderEmail);

      if (!credentials.pass) {
        return new Response(
          JSON.stringify({ error: "Credenciais SMTP não configuradas para o remetente" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const transporter = createTransporter(credentials);

      // Replace variables in template
      const vars = variables || {};
      const finalSubject = replaceVariables(template.assunto, vars);
      const finalHtml = replaceVariables(template.conteudo_html, vars);
      const finalText = template.conteudo_texto ? replaceVariables(template.conteudo_texto, vars) : undefined;

      console.log(`Sending template email '${template_tipo}' from ${credentials.user} to ${to}`);

      try {
        const info = await transporter.sendMail({
          from: `"${credentials.displayName}" <${credentials.user}>`,
          to: to,
          subject: finalSubject,
          html: finalHtml,
          text: finalText,
        });

        console.log("Email sent successfully:", info.messageId);

        // Log success with from_email
        await supabaseAdmin.from('email_logs').insert({
          to_email: to,
          subject: finalSubject,
          template_tipo: template_tipo,
          status: 'sent',
          user_id: userId,
          ficha_id: ficha_id || null,
          from_email: credentials.user,
        });

        return new Response(
          JSON.stringify({ success: true, messageId: info.messageId, from: credentials.user }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (sendError: any) {
        console.error("Error sending email:", sendError);

        // Log failure with from_email
        await supabaseAdmin.from('email_logs').insert({
          to_email: to,
          subject: finalSubject,
          template_tipo: template_tipo,
          status: 'failed',
          error_message: sendError.message,
          user_id: userId,
          ficha_id: ficha_id || null,
          from_email: credentials.user,
        });

        return new Response(
          JSON.stringify({ error: sendError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Direct send action
    if (action === 'send') {
      if (!subject || (!html && !text)) {
        return new Response(
          JSON.stringify({ error: "subject e (html ou text) são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validar email do destinatário
      if (!isValidEmail(to)) {
        console.log(`Skipping direct email: invalid or missing recipient: "${to}"`);
        
        await supabaseAdmin.from('email_logs').insert({
          to_email: to || 'não informado',
          subject: subject || 'não informado',
          template_tipo: null,
          status: 'skipped',
          error_message: 'Destinatário sem email válido',
          user_id: userId,
          ficha_id: ficha_id || null,
          from_email: null,
        });
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            skipped: true, 
            reason: "Destinatário sem email válido" 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const credentials = getCredentials(from_email);

      if (!credentials.pass) {
        return new Response(
          JSON.stringify({ error: "Credenciais SMTP não configuradas" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const transporter = createTransporter(credentials);

      console.log(`Sending direct email from ${credentials.user} to ${to}`);

      try {
        const info = await transporter.sendMail({
          from: `"${credentials.displayName}" <${credentials.user}>`,
          to: to,
          subject: subject,
          html: html,
          text: text,
        });

        console.log("Email sent successfully:", info.messageId);

        // Log success with from_email
        await supabaseAdmin.from('email_logs').insert({
          to_email: to,
          subject: subject,
          template_tipo: null,
          status: 'sent',
          user_id: userId,
          ficha_id: ficha_id || null,
          from_email: credentials.user,
        });

        return new Response(
          JSON.stringify({ success: true, messageId: info.messageId, from: credentials.user }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (sendError: any) {
        console.error("Error sending email:", sendError);

        // Log failure with from_email
        await supabaseAdmin.from('email_logs').insert({
          to_email: to,
          subject: subject,
          template_tipo: null,
          status: 'failed',
          error_message: sendError.message,
          user_id: userId,
          ficha_id: ficha_id || null,
          from_email: credentials.user,
        });

        return new Response(
          JSON.stringify({ error: sendError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida. Use 'send', 'send-template' ou 'test-connection'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
