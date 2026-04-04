import { requireRole } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth + role check via shared helper
    const authResult = await requireRole(req, "super_admin");
    if (authResult instanceof Response) return authResult;

    const { user: currentUser, supabaseAdmin } = authResult;
    console.log("Current user ID:", currentUser.id);

    // Parse pagination params
    let requestBody: { page?: number; perPage?: number; all?: boolean } = {};
    try {
      requestBody = await req.json();
    } catch {
      // No body or invalid JSON — default to fetching all (backward compat)
    }

    const fetchAll = requestBody.all !== false;

    if (fetchAll) {
      console.log("Fetching all users (backward compat mode)...");
      const allUsers: any[] = [];
      let page = 1;
      
      while (true) {
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage: 1000,
        });

        if (listError) {
          console.error("Error listing users:", listError);
          return new Response(
            JSON.stringify({ error: "Error fetching users" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        allUsers.push(...users);
        if (users.length < 1000) break;
        page++;
      }

      console.log(`Found ${allUsers.length} users (${page} pages)`);

      const userList = allUsers.map((user) => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      }));

      return new Response(
        JSON.stringify({ users: userList }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      const page = requestBody.page || 1;
      const perPage = Math.min(requestBody.perPage || 100, 500);

      console.log(`Fetching users page ${page} (${perPage}/page)...`);

      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (listError) {
        console.error("Error listing users:", listError);
        return new Response(
          JSON.stringify({ error: "Error fetching users" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Found ${users.length} users on page ${page}`);

      const userList = users.map((user) => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      }));

      return new Response(
        JSON.stringify({ 
          users: userList,
          page,
          perPage,
          hasMore: users.length === perPage,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
