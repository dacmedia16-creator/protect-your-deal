import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegistroCorretorRequest {
  corretor: {
    nome: string;
    email: string;
    telefone?: string;
    creci?: string;
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

    const body: RegistroCorretorRequest = await req.json();
    const { corretor, plano_id } = body;

    console.log("Starting autonomous broker registration for:", corretor.email);

    // Validate required fields
    if (!corretor.nome || !corretor.email || !corretor.senha) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios faltando" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (corretor.senha.length < 6) {
      return new Response(
        JSON.stringify({ error: "A senha deve ter pelo menos 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Create the user account
    console.log("Creating user account...");
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: corretor.email,
      password: corretor.senha,
      email_confirm: true, // Auto-confirm email
      user_metadata: { nome: corretor.nome },
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

    // 2. Create the user_role (corretor autônomo - imobiliaria_id = null)
    console.log("Creating user role...");
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: userId,
        role: "corretor",
        imobiliaria_id: null, // Corretor autônomo não tem imobiliária
      });

    if (roleError) {
      console.error("Role error:", roleError);
      // Rollback: delete the user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: "Erro ao criar permissões: " + roleError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User role created");

    // 3. Update profile with additional data (profile is created by trigger)
    console.log("Updating profile...");
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ 
        nome: corretor.nome,
        telefone: corretor.telefone || null,
        creci: corretor.creci || null,
        imobiliaria_id: null, // Corretor autônomo
      })
      .eq("user_id", userId);

    if (profileError) {
      console.error("Profile error:", profileError);
      // Non-critical, continue
    }

    // 4. Create subscription linked to user_id (not imobiliaria_id)
    if (plano_id) {
      console.log("Creating subscription...");
      const { error: assinError } = await supabaseAdmin
        .from("assinaturas")
        .insert({
          user_id: userId, // Vinculado ao usuário, não à imobiliária
          imobiliaria_id: null,
          plano_id: plano_id,
          status: "ativa", // Plano gratuito já começa ativo
          data_inicio: new Date().toISOString().split("T")[0],
        });

      if (assinError) {
        console.error("Subscription error:", assinError);
        // Non-critical, continue
      } else {
        console.log("Subscription created");
      }
    }

    console.log("Autonomous broker registration completed successfully");

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Cadastro realizado com sucesso!",
        user_id: userId,
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
