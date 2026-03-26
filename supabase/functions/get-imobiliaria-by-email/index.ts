import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()
    
    console.log('Buscando imobiliária para email:', email)
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar diretamente na tabela profiles pelo email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('imobiliaria_id')
      .ilike('email', email)
      .maybeSingle()

    if (profileError) {
      console.error('Erro ao buscar profile:', profileError)
      return new Response(
        JSON.stringify({ imobiliaria: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!profile?.imobiliaria_id) {
      console.log('Usuário não encontrado ou sem imobiliária vinculada')
      return new Response(
        JSON.stringify({ imobiliaria: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Imobiliária ID encontrada:', profile.imobiliaria_id)

    // Buscar dados da imobiliária (apenas nome e logo)
    const { data: imobiliaria, error: imobiliariaError } = await supabaseAdmin
      .from('imobiliarias')
      .select('nome, logo_url')
      .eq('id', profile.imobiliaria_id)
      .maybeSingle()

    if (imobiliariaError) {
      console.error('Erro ao buscar imobiliária:', imobiliariaError)
      return new Response(
        JSON.stringify({ imobiliaria: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Imobiliária encontrada:', imobiliaria?.nome)

    return new Response(
      JSON.stringify({ imobiliaria }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro geral:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
