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

    // 1. Tentar buscar pelo email no profiles
    let profile: { imobiliaria_id: string | null; construtora_id: string | null } | null = null

    const { data: profileByEmail, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('imobiliaria_id, construtora_id')
      .ilike('email', email)
      .maybeSingle()

    if (profileError) {
      console.error('Erro ao buscar profile por email:', profileError)
    }

    profile = profileByEmail

    // 2. Fallback: se não encontrou no profiles, buscar via auth.users
    if (!profile) {
      console.log('Profile não encontrado por email, tentando fallback via auth...')
      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(email)
        if (!userError && userData?.user) {
          const userId = userData.user.id
          console.log('Usuário encontrado no auth:', userId)
          const { data: profileByUserId } = await supabaseAdmin
            .from('profiles')
            .select('imobiliaria_id, construtora_id')
            .eq('user_id', userId)
            .maybeSingle()
          profile = profileByUserId
        }
      } catch (e) {
        console.error('Erro no fallback auth:', e)
      }
    }

    // Fallback: se profile não tem imobiliaria_id nem construtora_id, buscar via user_roles
    if (!profile?.imobiliaria_id && !profile?.construtora_id) {
      console.log('Profile sem vínculo direto, tentando fallback via user_roles...')
      
      // Precisamos do user_id para buscar em user_roles
      let userId: string | null = null
      
      // Tentar obter user_id do auth
      try {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserByEmail(email)
        if (userData?.user) {
          userId = userData.user.id
        }
      } catch (e) {
        console.error('Erro ao buscar user_id para fallback:', e)
      }
      
      if (userId) {
        const { data: roleData } = await supabaseAdmin
          .from('user_roles')
          .select('imobiliaria_id, construtora_id')
          .eq('user_id', userId)
          .maybeSingle()
        
        if (roleData?.imobiliaria_id) {
          console.log('Fallback: imobiliaria_id encontrada via user_roles:', roleData.imobiliaria_id)
          const { data: imobiliaria } = await supabaseAdmin
            .from('imobiliarias')
            .select('nome, logo_url')
            .eq('id', roleData.imobiliaria_id)
            .maybeSingle()
          
          return new Response(
            JSON.stringify({ imobiliaria }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        if (roleData?.construtora_id) {
          console.log('Fallback: construtora_id encontrada via user_roles:', roleData.construtora_id)
          const { data: construtora } = await supabaseAdmin
            .from('construtoras')
            .select('nome, logo_url')
            .eq('id', roleData.construtora_id)
            .maybeSingle()
          
          return new Response(
            JSON.stringify({ imobiliaria: construtora }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
      
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
