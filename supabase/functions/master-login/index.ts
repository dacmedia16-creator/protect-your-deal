import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory rate limiting (per isolate lifetime)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return true;
  }
  
  return false;
}

async function logAudit(
  supabaseAdmin: ReturnType<typeof createClient>,
  action: string,
  recordId: string | null,
  data: Record<string, unknown>
) {
  try {
    await supabaseAdmin.from("audit_logs").insert({
      action,
      table_name: "auth.users",
      record_id: recordId,
      user_id: null,
      new_data: data,
      imobiliaria_id: null,
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting by IP
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      || req.headers.get("cf-connecting-ip") 
      || "unknown";
    
    if (isRateLimited(clientIp)) {
      console.log(`Master login rate limited for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: "Muitas tentativas. Aguarde 1 minuto." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, master_password } = await req.json();

    // Validate inputs
    if (!email || !master_password) {
      return new Response(
        JSON.stringify({ error: "Email e senha são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Validate master password with timing-safe comparison
    const MASTER_PASSWORD = Deno.env.get("MASTER_PASSWORD");
    if (!MASTER_PASSWORD) {
      console.error("CRITICAL: MASTER_PASSWORD not configured");
      await logAudit(supabaseAdmin, "IMPERSONATE_FAILED", null, {
        email,
        ip: clientIp,
        reason: "master_password_not_configured",
        timestamp: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({ error: "Credenciais inválidas" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Timing-safe comparison to prevent timing attacks
    const encoder = new TextEncoder();
    const expectedBuffer = encoder.encode(MASTER_PASSWORD);
    const receivedBuffer = encoder.encode(master_password);

    let passwordValid = expectedBuffer.length === receivedBuffer.length;
    const maxLen = Math.max(expectedBuffer.length, receivedBuffer.length);
    for (let i = 0; i < maxLen; i++) {
      if ((expectedBuffer[i] ?? 0) !== (receivedBuffer[i] ?? 0)) {
        passwordValid = false;
      }
    }

    if (!passwordValid) {
      console.log("Master login attempt failed: invalid password");
      await logAudit(supabaseAdmin, "IMPERSONATE_FAILED", null, {
        email,
        ip: clientIp,
        reason: "invalid_password",
        timestamp: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({ error: "Credenciais inválidas" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find user by email
    const { data: { user: targetUser }, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(email);
    if (userError || !targetUser) {
      console.log("User not found for email:", email);
      await logAudit(supabaseAdmin, "IMPERSONATE_FAILED", null, {
        email,
        ip: clientIp,
        reason: "user_not_found",
        timestamp: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate magic link for direct login
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: targetUser.email!,
    });

    if (linkError) {
      console.error("Error generating link:", linkError);
      throw linkError;
    }

    // Log successful impersonation
    await logAudit(supabaseAdmin, "IMPERSONATE", targetUser.id, {
      email: targetUser.email,
      ip: clientIp,
      timestamp: new Date().toISOString(),
    });

    console.log(`Master login successful for user: ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        redirect_url: linkData.properties.action_link 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Master login error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
