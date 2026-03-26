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
    
    console.log('Buscando imobiliária/construtora para email:', email)
    
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
      .select('imobiliaria_id, construtora_id')
      .ilike('email', email)
      .maybeSingle()

    if (profileError) {
      console.error('Erro ao buscar profile:', profileError)
      return new Response(
        JSON.stringify({ imobiliaria: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!profile?.imobiliaria_id && !profile?.construtora_id) {
      console.log('Usuário não encontrado ou sem imobiliária/construtora vinculada')
      return new Response(
        JSON.stringify({ imobiliaria: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Se tem imobiliaria_id, buscar na tabela imobiliarias
    if (profile.imobiliaria_id) {
      console.log('Imobiliária ID encontrada:', profile.imobiliaria_id)

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
    }

    // Se tem construtora_id, buscar na tabela construtoras
    if (profile.construtora_id) {
      console.log('Construtora ID encontrada:', profile.construtora_id)

      const { data: construtora, error: construtoraError } = await supabaseAdmin
        .from('construtoras')
        .select('nome, logo_url')
        .eq('id', profile.construtora_id)
        .maybeSingle()

      if (construtoraError) {
        console.error('Erro ao buscar construtora:', construtoraError)
        return new Response(
          JSON.stringify({ imobiliaria: null }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Construtora encontrada:', construtora?.nome)

      return new Response(
        JSON.stringify({ imobiliaria: construtora }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ imobiliaria: null }),
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
