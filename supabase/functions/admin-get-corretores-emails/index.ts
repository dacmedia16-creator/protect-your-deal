import { requireAnyRole, corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await requireAnyRole(req, ["imobiliaria_admin", "super_admin"]);
    if (authResult instanceof Response) return authResult;

    const { supabaseAdmin, role, roleData } = authResult;
    const isSuperAdmin = role === "super_admin";
    const imobiliariaId = roleData.imobiliaria_id;

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
    let filteredUserIds = userIds;
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

      const allowedUserIds = new Set(rolesCheck?.map(r => r.user_id) || []);
      filteredUserIds = userIds.filter(id => allowedUserIds.has(id));

      if (filteredUserIds.length === 0) {
        return new Response(
          JSON.stringify({ emails: {} }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch emails from profiles table
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email")
      .in("user_id", filteredUserIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return new Response(
        JSON.stringify({ error: "Error fetching user emails" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a map of user_id -> email
    const emailsMap: Record<string, string> = {};
    for (const profile of profiles || []) {
      if (profile.email) {
        emailsMap[profile.user_id] = profile.email;
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
