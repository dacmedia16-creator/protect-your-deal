import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function createAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

function errorResponse(message: string, status: number) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/**
 * Validates Bearer token and returns the authenticated user.
 * Returns a Response (401) if authentication fails.
 */
export async function requireAuth(req: Request): Promise<
  { user: { id: string; email?: string }; supabaseAdmin: ReturnType<typeof createClient> } | Response
> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return errorResponse("Autorização necessária", 401);
  }

  const supabaseAdmin = createAdminClient();
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return errorResponse("Usuário não autenticado", 401);
  }

  return { user, supabaseAdmin };
}

/**
 * Validates Bearer token and checks that the user has the specified role.
 * Returns a Response (401/403) if authentication or authorization fails.
 */
export async function requireRole(req: Request, role: string): Promise<
  { user: { id: string; email?: string }; supabaseAdmin: ReturnType<typeof createClient> } | Response
> {
  const result = await requireAuth(req);
  if (result instanceof Response) return result;

  const { user, supabaseAdmin } = result;

  const { data: roleData, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", role)
    .maybeSingle();

  if (roleError) {
    return errorResponse("Erro ao verificar permissões", 500);
  }

  if (!roleData) {
    return errorResponse("Sem permissão para esta operação", 403);
  }

  return { user, supabaseAdmin };
}

/**
 * Validates Bearer token and checks that the user has ANY of the specified roles.
 * Returns the matched role and full roleData (including imobiliaria_id, construtora_id).
 * Returns a Response (401/403) if authentication or authorization fails.
 */
export async function requireAnyRole(req: Request, roles: string[]): Promise<
  {
    user: { id: string; email?: string };
    supabaseAdmin: ReturnType<typeof createClient>;
    role: string;
    roleData: { role: string; imobiliaria_id: string | null; construtora_id: string | null };
  } | Response
> {
  const result = await requireAuth(req);
  if (result instanceof Response) return result;

  const { user, supabaseAdmin } = result;

  const { data: roleRecord, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("role, imobiliaria_id, construtora_id")
    .eq("user_id", user.id)
    .in("role", roles)
    .maybeSingle();

  if (roleError) {
    return errorResponse("Erro ao verificar permissões", 500);
  }

  if (!roleRecord) {
    return errorResponse("Sem permissão para esta operação", 403);
  }

  return { user, supabaseAdmin, role: roleRecord.role, roleData: roleRecord };
}

/**
 * Validates that the request uses the service role key.
 * Returns a Response (401) if the key is missing or invalid.
 */
export function requireServiceRole(req: Request): ReturnType<typeof createClient> | Response {
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!authHeader || !serviceRoleKey) {
    return errorResponse("Service role key necessária", 401);
  }

  const token = authHeader.replace("Bearer ", "");
  if (token !== serviceRoleKey) {
    return errorResponse("Service role key inválida", 401);
  }

  return createAdminClient();
}

export { corsHeaders, createAdminClient };
