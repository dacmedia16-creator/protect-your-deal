import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type TableNames = 'fichas_visita' | 'clientes' | 'imoveis';

interface UseInfiniteListOptions {
  queryKey: string[];
  table: TableNames;
  select?: string;
  filters?: Record<string, string | null | undefined>;
  orFilters?: string;
  orderBy?: { column: string; ascending: boolean };
  pageSize?: number;
  enabled?: boolean;
}

interface InfiniteListResult<T> {
  items: T[];
  nextPage: number | undefined;
  totalCount: number;
}

export function useInfiniteList<T>({
  queryKey,
  table,
  select = '*',
  filters,
  orFilters,
  orderBy = { column: 'created_at', ascending: false },
  pageSize = 20,
  enabled = true,
}: UseInfiniteListOptions) {
  return useInfiniteQuery<InfiniteListResult<T>>({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      const from = page * pageSize;
      const to = from + pageSize - 1;

      // Use any to avoid TypeScript deep instantiation issues with Supabase generics
      let query: any = supabase.from(table).select(select, { count: 'exact' });

      // Apply eq filters
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        }
      }

      // Apply or filter
      if (orFilters) {
        query = query.or(orFilters);
      }

      // Apply order and range
      const { data, error, count } = await query
        .order(orderBy.column, { ascending: orderBy.ascending })
        .range(from, to);

      if (error) throw error;

      return {
        items: (data || []) as T[],
        nextPage: (from + pageSize < (count || 0)) ? page + 1 : undefined,
        totalCount: count || 0,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled,
  });
}
