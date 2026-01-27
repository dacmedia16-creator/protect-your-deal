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
}

// Substituir variáveis no template
function replaceVariables(content: string, variables: Record<string, string>): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
  }
  return result;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ZOHO_SMTP_USER = Deno.env.get("ZOHO_SMTP_USER");
    const ZOHO_SMTP_PASSWORD = Deno.env.get("ZOHO_SMTP_PASSWORD");

    if (!ZOHO_SMTP_USER || !ZOHO_SMTP_PASSWORD) {
      console.error("SMTP credentials not configured");
      return new Response(
        JSON.stringify({ error: "Credenciais SMTP não configuradas" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create SMTP transporter
    const transporter = nodemailer.createTransport({
      host: "smtppro.zoho.com",
      port: 465,
      secure: true,
      auth: {
        user: ZOHO_SMTP_USER,
        pass: ZOHO_SMTP_PASSWORD,
      },
    });

    const body: SendEmailRequest = await req.json();
    const { action, to, subject, html, text, template_tipo, variables, ficha_id } = body;

    // Initialize Supabase client for logging
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user ID from auth header if present
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
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
      console.log("Testing SMTP connection...");
      try {
        await transporter.verify();
        console.log("SMTP connection successful");
        return new Response(
          JSON.stringify({ connected: true, message: "Conexão SMTP estabelecida com sucesso" }),
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
      if (!template_tipo || !to) {
        return new Response(
          JSON.stringify({ error: "template_tipo e to são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch template from database
      const { data: template, error: templateError } = await supabaseAdmin
        .from('templates_email')
        .select('*')
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

      // Replace variables in template
      const vars = variables || {};
      const finalSubject = replaceVariables(template.assunto, vars);
      const finalHtml = replaceVariables(template.conteudo_html, vars);
      const finalText = template.conteudo_texto ? replaceVariables(template.conteudo_texto, vars) : undefined;

      console.log(`Sending template email '${template_tipo}' to ${to}`);

      try {
        const info = await transporter.sendMail({
          from: `"VisitaProva" <${ZOHO_SMTP_USER}>`,
          to: to,
          subject: finalSubject,
          html: finalHtml,
          text: finalText,
        });

        console.log("Email sent successfully:", info.messageId);

        // Log success
        await supabaseAdmin.from('email_logs').insert({
          to_email: to,
          subject: finalSubject,
          template_tipo: template_tipo,
          status: 'sent',
          user_id: userId,
          ficha_id: ficha_id || null,
        });

        return new Response(
          JSON.stringify({ success: true, messageId: info.messageId }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (sendError: any) {
        console.error("Error sending email:", sendError);

        // Log failure
        await supabaseAdmin.from('email_logs').insert({
          to_email: to,
          subject: finalSubject,
          template_tipo: template_tipo,
          status: 'failed',
          error_message: sendError.message,
          user_id: userId,
          ficha_id: ficha_id || null,
        });

        return new Response(
          JSON.stringify({ error: sendError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Direct send action
    if (action === 'send') {
      if (!to || !subject || (!html && !text)) {
        return new Response(
          JSON.stringify({ error: "to, subject e (html ou text) são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Sending direct email to ${to}`);

      try {
        const info = await transporter.sendMail({
          from: `"VisitaProva" <${ZOHO_SMTP_USER}>`,
          to: to,
          subject: subject,
          html: html,
          text: text,
        });

        console.log("Email sent successfully:", info.messageId);

        // Log success
        await supabaseAdmin.from('email_logs').insert({
          to_email: to,
          subject: subject,
          template_tipo: null,
          status: 'sent',
          user_id: userId,
          ficha_id: ficha_id || null,
        });

        return new Response(
          JSON.stringify({ success: true, messageId: info.messageId }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (sendError: any) {
        console.error("Error sending email:", sendError);

        // Log failure
        await supabaseAdmin.from('email_logs').insert({
          to_email: to,
          subject: subject,
          template_tipo: null,
          status: 'failed',
          error_message: sendError.message,
          user_id: userId,
          ficha_id: ficha_id || null,
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
