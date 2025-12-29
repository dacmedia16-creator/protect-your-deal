import { supabase } from '@/integrations/supabase/client';

interface InvokeOptions {
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
}

interface InvokeResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Invoca uma função do Supabase com retry automático em caso de erro de rede/timeout.
 * Tenta 1x; se falhar por erro transitório, aguarda e tenta mais 1x.
 */
export async function invokeWithRetry<T = unknown>(
  functionName: string,
  options: InvokeOptions = {},
  retryDelayMs = 500
): Promise<InvokeResult<T>> {
  const attemptInvoke = async (): Promise<InvokeResult<T>> => {
    const { data, error } = await supabase.functions.invoke<T>(functionName, options);
    return { data, error };
  };

  // First attempt
  const firstResult = await attemptInvoke();
  
  // If successful or if it's not a retryable error, return immediately
  if (!firstResult.error || !isRetryableError(firstResult.error)) {
    return firstResult;
  }

  // Wait before retry
  await new Promise(resolve => setTimeout(resolve, retryDelayMs));

  // Second attempt
  return attemptInvoke();
}

/**
 * Determina se o erro é transitório e vale a pena tentar novamente.
 */
function isRetryableError(error: Error): boolean {
  const message = error.message?.toLowerCase() || '';
  
  return (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('fetch') ||
    message.includes('failed to fetch') ||
    message.includes('connection') ||
    message.includes('aborted') ||
    message.includes('socket') ||
    message.includes('econnreset')
  );
}
