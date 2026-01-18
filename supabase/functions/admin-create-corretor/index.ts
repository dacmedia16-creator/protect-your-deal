import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateCorretorRequest {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  creci?: string;
  cpf?: string;
  autonomo?: boolean; // Flag to create autonomous corretor
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase clients
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      }
    );

    // Verify the current user is authenticated
    const { data: { user: currentUser }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !currentUser) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Current user ID:", currentUser.id);

    // Parse request body
    const body: CreateCorretorRequest = await req.json();
    const { nome, email, senha, telefone, creci, cpf, autonomo } = body;

    console.log("Creating corretor:", email, "autonomo:", autonomo);

    // Check if the current user is an admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role, imobiliaria_id")
      .eq("user_id", currentUser.id)
      .in("role", ["imobiliaria_admin", "super_admin"])
      .maybeSingle();

    if (roleError) {
      console.error("Role check error:", roleError);
      return new Response(
        JSON.stringify({ error: "Error checking user role" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!roleData) {
      console.error("User is not an admin");
      return new Response(
        JSON.stringify({ error: "Acesso negado. Apenas administradores podem criar corretores." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine imobiliaria_id based on request
    let imobiliariaId: string | null = null;
    
    if (autonomo) {
      // Only super_admin can create autonomous corretores
      if (roleData.role !== "super_admin") {
        return new Response(
          JSON.stringify({ error: "Apenas super admins podem criar corretores autônomos" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // imobiliariaId stays null for autonomous
      imobiliariaId = null;
    } else {
      // Regular flow - link to imobiliaria
      imobiliariaId = roleData.imobiliaria_id;
      if (!imobiliariaId && roleData.role !== "super_admin") {
        return new Response(
          JSON.stringify({ error: "Usuário não está vinculado a uma imobiliária" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Validate required fields
    if (!nome || !email || !senha) {
      return new Response(
        JSON.stringify({ error: "Nome, email e senha são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (senha.length < 6) {
      return new Response(
        JSON.stringify({ error: "A senha deve ter pelo menos 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Create the user account
    console.log("Creating user account...");
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: senha,
      email_confirm: true, // Auto-confirm email
      user_metadata: { nome: nome },
    });

    if (createError) {
      console.error("Create user error:", createError);
      if (createError.message?.includes("already")) {
        return new Response(
          JSON.stringify({ error: "Este email já está cadastrado" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: "Erro ao criar usuário" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;
    console.log("User created:", userId);

    // 2. Create the user_role as corretor (with or without imobiliaria)
    console.log("Creating user role...", imobiliariaId ? `for imobiliaria ${imobiliariaId}` : "as autonomous");
    const { error: userRoleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: userId,
        role: "corretor",
        imobiliaria_id: imobiliariaId,
      });

    if (userRoleError) {
      console.error("User role error:", userRoleError);
      // Rollback: delete the user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: "Erro ao criar permissões: " + userRoleError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User role created");

    // 3. Update profile with additional info (garantir ativo = true)
    console.log("Updating profile...");
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        imobiliaria_id: imobiliariaId,
        nome: nome,
        telefone: telefone || null,
        creci: creci || null,
        cpf: cpf || null,
        email: email || null,
        ativo: true,
      })
      .eq("user_id", userId);

    if (profileError) {
      console.error("Profile error:", profileError);
      // Non-critical, continue
    }

    console.log("Corretor created successfully", autonomo ? "(autonomous)" : "");

    return new Response(
      JSON.stringify({
        success: true,
        message: autonomo ? "Corretor autônomo criado com sucesso!" : "Corretor criado com sucesso!",
        user_id: userId,
        autonomo: !!autonomo,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
