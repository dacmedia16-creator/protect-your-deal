import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Verify the current user is authenticated using token directly
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: currentUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !currentUser) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Current user ID:", currentUser.id);

    // Check if the current user is an imobiliaria_admin or super_admin
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
        JSON.stringify({ error: "Acesso negado. Apenas administradores podem ver emails dos corretores." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const imobiliariaId = roleData.imobiliaria_id;
    const isSuperAdmin = roleData.role === "super_admin";

    // Parse request body to get user_ids
    const body = await req.json();
    const userIds: string[] = body.user_ids || [];

    if (!userIds.length) {
      return new Response(
        JSON.stringify({ emails: {} }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching emails for users:", userIds.length);

    // If not super_admin, verify all users belong to the same imobiliaria
    if (!isSuperAdmin && imobiliariaId) {
      const { data: rolesCheck, error: rolesCheckError } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("imobiliaria_id", imobiliariaId)
        .in("user_id", userIds);

      if (rolesCheckError) {
        console.error("Roles check error:", rolesCheckError);
        return new Response(
          JSON.stringify({ error: "Error verifying user access" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Filter to only allowed user_ids
      const allowedUserIds = new Set(rolesCheck?.map(r => r.user_id) || []);
      const filteredUserIds = userIds.filter(id => allowedUserIds.has(id));

      if (filteredUserIds.length === 0) {
        return new Response(
          JSON.stringify({ emails: {} }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch users from auth
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
      console.error("Error listing users:", usersError);
      return new Response(
        JSON.stringify({ error: "Error fetching users" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a map of user_id -> email
    const emailsMap: Record<string, string> = {};
    const userIdsSet = new Set(userIds);
    
    for (const user of users || []) {
      if (userIdsSet.has(user.id)) {
        emailsMap[user.id] = user.email || "";
      }
    }

    console.log("Found emails for", Object.keys(emailsMap).length, "users");

    return new Response(
      JSON.stringify({ emails: emailsMap }),
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
