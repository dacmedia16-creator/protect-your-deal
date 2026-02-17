import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ASAAS_API_URL = Deno.env.get('ASAAS_SANDBOX') === 'true' 
  ? 'https://sandbox.asaas.com/api/v3'
  : 'https://api.asaas.com/v3';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    if (!asaasApiKey) {
      throw new Error('ASAAS_API_KEY não configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { name, email, cpfCnpj, phone, postalCode } = await req.json();

    if (!name || !cpfCnpj) {
      throw new Error('Nome e CPF/CNPJ são obrigatórios');
    }

    // Criar cliente no Asaas
    const customerResponse = await fetch(`${ASAAS_API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      },
      body: JSON.stringify({
        name,
        email: email || user.email,
        cpfCnpj: cpfCnpj.replace(/\D/g, ''),
        phone: phone?.replace(/\D/g, ''),
        postalCode: postalCode?.replace(/\D/g, ''),
        externalReference: user.id,
      }),
    });

    const customerData = await customerResponse.json();

    if (!customerResponse.ok) {
      console.error('Asaas error:', customerData);
      throw new Error(customerData.errors?.[0]?.description || 'Erro ao criar cliente no Asaas');
    }

    console.log('Customer created:', customerData.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        customerId: customerData.id,
        customer: customerData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in asaas-create-customer:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
