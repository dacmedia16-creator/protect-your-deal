import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth header and verify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Qualquer usuário autenticado pode registrar versão
    // A operação é idempotente (não cria duplicatas)

    // Get version from request body
    const { version } = await req.json();

    if (!version || version === 'unknown') {
      return new Response(
        JSON.stringify({ registered: false, reason: 'invalid_version' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if version already exists
    const { data: existingVersion } = await supabase
      .from('app_versions')
      .select('version')
      .eq('version', version)
      .maybeSingle();

    if (existingVersion) {
      return new Response(
        JSON.stringify({ registered: false, reason: 'already_exists', version }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert new version
    const { error: insertError } = await supabase
      .from('app_versions')
      .insert({
        version,
        published_at: new Date().toISOString(),
        published_by: user.id,
      });

    if (insertError) {
      console.error('Erro ao registrar versão:', insertError);
      
      // If it's a duplicate key error, version was registered by another admin
      if (insertError.code === '23505') {
        return new Response(
          JSON.stringify({ registered: false, reason: 'already_exists', version }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw insertError;
    }

    console.log(`Nova versão registrada: ${version} por ${user.email}`);

    return new Response(
      JSON.stringify({ registered: true, version }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro na função register-version:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao registrar versão' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
