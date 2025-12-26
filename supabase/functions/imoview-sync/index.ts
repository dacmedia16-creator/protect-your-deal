import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const IMOVIEW_BASE_URL = 'https://api.imoview.com.br';

interface ImoviewRequest {
  action: string;
  data?: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('IMOVIEW_API_KEY');
    if (!apiKey) {
      throw new Error('IMOVIEW_API_KEY não configurada');
    }

    const { action, data } = await req.json() as ImoviewRequest;
    console.log(`Imoview sync action: ${action}`, data);

    let response;

    switch (action) {
      case 'testar-conexao':
        response = await testConnection(apiKey);
        break;

      case 'listar-imoveis':
        response = await listarImoveis(apiKey, data);
        break;

      case 'buscar-imovel':
        response = await buscarImovel(apiKey, data?.codigo as string);
        break;

      case 'listar-clientes':
        response = await listarClientes(apiKey, data);
        break;

      case 'buscar-cliente':
        response = await buscarCliente(apiKey, data?.codigo as string);
        break;

      case 'incluir-lead':
        response = await incluirLead(apiKey, data);
        break;

      case 'agendar-visita':
        response = await agendarVisita(apiKey, data);
        break;

      default:
        throw new Error(`Ação não reconhecida: ${action}`);
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    console.error('Erro na integração Imoview:', errorMessage);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function makeImoviewRequest(
  apiKey: string, 
  endpoint: string, 
  method: 'GET' | 'POST' = 'GET',
  body?: Record<string, unknown>
) {
  const url = `${IMOVIEW_BASE_URL}${endpoint}`;
  console.log(`Imoview request: ${method} ${url}`);
  if (body) {
    console.log(`Imoview request body:`, JSON.stringify(body));
  }

  // A API Imoview usa 'chave' como header de autenticação
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'chave': apiKey,
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && method === 'POST') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const text = await response.text();
    
    console.log(`Imoview response status: ${response.status}`);
    console.log(`Imoview response headers:`, JSON.stringify(Object.fromEntries(response.headers.entries())));
    console.log(`Imoview response body (first 500 chars):`, text.substring(0, 500));
    
    if (!response.ok) {
      console.error(`Imoview HTTP error: ${response.status} ${response.statusText}`);
      return { 
        erro: `HTTP ${response.status}: ${response.statusText}`, 
        raw: text,
        status: response.status 
      };
    }
    
    try {
      const parsed = JSON.parse(text);
      console.log(`Imoview parsed response type: ${typeof parsed}, isArray: ${Array.isArray(parsed)}`);
      return parsed;
    } catch (parseError) {
      console.error('Imoview response is not valid JSON:', text.substring(0, 200));
      return { erro: 'Resposta inválida da API', raw: text, status: response.status };
    }
  } catch (fetchError) {
    console.error(`Imoview fetch error:`, fetchError);
    throw new Error(`Erro de conexão: ${fetchError instanceof Error ? fetchError.message : 'Erro desconhecido'}`);
  }
}

async function testConnection(apiKey: string) {
  try {
    // Usa endpoint RetornarTipo3 que retorna lista de tipos de cliente
    const result = await makeImoviewRequest(apiKey, '/Usuario/RetornarTipo3');
    
    if (result.erro || result.error) {
      return { 
        success: false, 
        message: result.erro || result.error || 'Erro ao conectar',
        connected: false 
      };
    }

    return { 
      success: true, 
      message: 'Conexão estabelecida com sucesso!',
      connected: true,
      data: result
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return { 
      success: false, 
      message: errorMessage,
      connected: false
    };
  }
}

async function listarImoveis(apiKey: string, filters?: Record<string, unknown>) {
  console.log('listarImoveis called with filters:', filters);
  
  // Usa endpoint correto para listar imóveis disponíveis
  const endpoint = `/Imovel/RetornarImoveisDisponiveis`;
  
  const result = await makeImoviewRequest(apiKey, endpoint, 'POST', filters || {});
  
  console.log('listarImoveis result:', JSON.stringify(result).substring(0, 500));
  
  // A API pode retornar array diretamente ou objeto com propriedade imoveis
  let imoveis: unknown[] = [];
  if (Array.isArray(result)) {
    imoveis = result;
  } else if (result?.imoveis && Array.isArray(result.imoveis)) {
    imoveis = result.imoveis;
  } else if (result?.data && Array.isArray(result.data)) {
    imoveis = result.data;
  }
  
  const hasError = result?.erro || result?.error;
  
  return {
    success: !hasError,
    imoveis,
    total: imoveis.length,
    pagina: result?.pagina || 1,
    error: hasError ? (result.erro || result.error) : undefined,
    raw: result
  };
}

async function buscarImovel(apiKey: string, codigo: string) {
  if (!codigo) {
    throw new Error('Código do imóvel é obrigatório');
  }

  const result = await makeImoviewRequest(apiKey, `/Imovel/RetornarDetalhesImovelDisponivel?codigoImovel=${codigo}`);
  
  return {
    success: !result.erro,
    imovel: result.imovel || result
  };
}

async function listarClientes(apiKey: string, filters?: Record<string, unknown>) {
  const params = new URLSearchParams();
  
  if (filters?.pagina) params.append('pagina', String(filters.pagina));
  if (filters?.limite) params.append('limite', String(filters.limite));
  if (filters?.nome) params.append('nome', String(filters.nome));
  if (filters?.tipo) params.append('tipo', String(filters.tipo));
  
  const queryString = params.toString();
  // Usa endpoint correto para pesquisar clientes
  const endpoint = `/Cliente/App_PesquisarCliente${queryString ? `?${queryString}` : ''}`;
  
  const result = await makeImoviewRequest(apiKey, endpoint);
  
  return {
    success: !result.erro,
    clientes: result.clientes || result.data || [],
    total: result.total || 0
  };
}

async function buscarCliente(apiKey: string, codigo: string) {
  if (!codigo) {
    throw new Error('Código do cliente é obrigatório');
  }

  const result = await makeImoviewRequest(apiKey, `/Cliente/RetornarDadosCliente?codigo=${codigo}`);
  
  return {
    success: !result.erro,
    cliente: result.cliente || result
  };
}

async function incluirLead(apiKey: string, data?: Record<string, unknown>) {
  if (!data) {
    throw new Error('Dados do lead são obrigatórios');
  }

  const result = await makeImoviewRequest(apiKey, '/Lead/IncluirLead', 'POST', data);
  
  return {
    success: !result.erro,
    lead: result
  };
}

async function agendarVisita(apiKey: string, data?: Record<string, unknown>) {
  if (!data) {
    throw new Error('Dados da visita são obrigatórios');
  }

  const result = await makeImoviewRequest(
    apiKey, 
    '/Lead/IncluirAgendamentoVisita', 
    'POST', 
    data
  );
  
  return {
    success: !result.erro,
    visita: result
  };
}
