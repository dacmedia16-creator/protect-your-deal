import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const imobiliariaId = "30996e16-bcfb-4b06-be75-7c1431a8793a";
    const email = "admin@imobiliariateste.com.br";
    const password = "Teste123!";
    const nome = "Admin Teste";

    console.log("Creating admin user for Imobiliária Teste...");

    // 1. Create user in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome },
    });

    if (authError) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user!.id;
    console.log("User created:", userId);

    // 2. Create user_role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: userId,
        role: "imobiliaria_admin",
        imobiliaria_id: imobiliariaId,
      });

    if (roleError) {
      console.error("Role error:", roleError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: "Erro ao criar role: " + roleError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Update profile with imobiliaria_id
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ 
        imobiliaria_id: imobiliariaId,
        nome: nome 
      })
      .eq("user_id", userId);

    if (profileError) {
      console.error("Profile error:", profileError);
    }

    console.log("Admin user created successfully!");

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Admin criado com sucesso!",
        credentials: { email, password },
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
