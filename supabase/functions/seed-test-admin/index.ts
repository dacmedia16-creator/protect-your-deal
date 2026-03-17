const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // This function has been permanently disabled for security reasons.
  // It was a development-only utility that should not exist in production.
  console.warn("seed-test-admin called but is permanently disabled");
  
  return new Response(
    JSON.stringify({ error: "Esta função foi desativada por segurança." }),
    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
