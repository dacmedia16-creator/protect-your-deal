import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegistroRequest {
  imobiliaria: {
    nome: string;
    cnpj?: string;
    email: string;
    telefone?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
  };
  admin: {
    nome: string;
    email: string;
    senha: string;
  };
  plano_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body: RegistroRequest = await req.json();
    const { imobiliaria, admin, plano_id } = body;

    console.log("Starting registration for:", admin.email);

    // Validate required fields
    if (!imobiliaria.nome || !imobiliaria.email || !admin.nome || !admin.email || !admin.senha) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios faltando" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (admin.senha.length < 6) {
      return new Response(
        JSON.stringify({ error: "A senha deve ter pelo menos 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Create the user account
    console.log("Creating user account...");
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: admin.email,
      password: admin.senha,
      email_confirm: true, // Auto-confirm email
      user_metadata: { nome: admin.nome },
    });

    if (authError) {
      console.error("Auth error:", authError);
      if (authError.message?.includes("already")) {
        return new Response(
          JSON.stringify({ error: "Este email já está cadastrado" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: authError.message }),
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

    // 2. Create the imobiliaria
    console.log("Creating imobiliaria...");
    const { data: imobData, error: imobError } = await supabaseAdmin
      .from("imobiliarias")
      .insert({
        nome: imobiliaria.nome,
        cnpj: imobiliaria.cnpj || null,
        email: imobiliaria.email,
        telefone: imobiliaria.telefone || null,
        endereco: imobiliaria.endereco || null,
        cidade: imobiliaria.cidade || null,
        estado: imobiliaria.estado || null,
        status: "ativo",
      })
      .select()
      .single();

    if (imobError) {
      console.error("Imobiliaria error:", imobError);
      // Rollback: delete the user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: "Erro ao criar imobiliária: " + imobError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Imobiliaria created:", imobData.id);

    // 3. Create the user_role
    console.log("Creating user role...");
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: userId,
        role: "imobiliaria_admin",
        imobiliaria_id: imobData.id,
      });

    if (roleError) {
      console.error("Role error:", roleError);
      // Rollback
      await supabaseAdmin.from("imobiliarias").delete().eq("id", imobData.id);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: "Erro ao criar permissões: " + roleError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User role created");

    // 4. Update profile with imobiliaria_id (profile is created by trigger)
    console.log("Updating profile...");
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ 
        imobiliaria_id: imobData.id,
        nome: admin.nome 
      })
      .eq("user_id", userId);

    if (profileError) {
      console.error("Profile error:", profileError);
      // Non-critical, continue
    }

    // 5. Create subscription
    if (plano_id) {
      console.log("Creating subscription...");
      const { error: assinError } = await supabaseAdmin
        .from("assinaturas")
        .insert({
          imobiliaria_id: imobData.id,
          plano_id: plano_id,
          status: "trial",
          data_inicio: new Date().toISOString().split("T")[0],
        });

      if (assinError) {
        console.error("Subscription error:", assinError);
        // Non-critical, continue
      }
    }

    console.log("Registration completed successfully");

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Cadastro realizado com sucesso!",
        user_id: userId,
        imobiliaria_id: imobData.id,
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
