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

    // Buscar versão mais recente do banco
    const { data, error } = await supabase
      .from('app_versions')
      .select('version, published_at')
      .order('published_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar versão:', error);
      throw error;
    }

    // Se não há versão no banco, retorna null (cliente deve ignorar)
    const version = data?.version || null;
    const publishedAt = data?.published_at || null;

    return new Response(
      JSON.stringify({ 
        version, 
        published_at: publishedAt,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        } 
      }
    );
  } catch (error) {
    console.error('Erro na função app-version:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao verificar versão', version: null }),
      { 
        status: 200, // Retorna 200 mesmo com erro para não quebrar o cliente
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
