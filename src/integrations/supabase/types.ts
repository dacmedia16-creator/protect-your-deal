export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assinaturas: {
        Row: {
          asaas_customer_id: string | null
          asaas_subscription_id: string | null
          created_at: string
          data_fim: string | null
          data_inicio: string
          id: string
          imobiliaria_id: string | null
          plano_id: string
          proxima_cobranca: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          imobiliaria_id?: string | null
          plano_id: string
          proxima_cobranca?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          imobiliaria_id?: string | null
          plano_id?: string
          proxima_cobranca?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          imobiliaria_id: string | null
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          imobiliaria_id?: string | null
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          imobiliaria_id?: string | null
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          imobiliaria_id: string | null
          nome: string
          notas: string | null
          tags: string[] | null
          telefone: string
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          imobiliaria_id?: string | null
          nome: string
          notas?: string | null
          tags?: string[] | null
          telefone: string
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          imobiliaria_id?: string | null
          nome?: string
          notas?: string | null
          tags?: string[] | null
          telefone?: string
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      confirmacoes_otp: {
        Row: {
          aceite_cpf: string | null
          aceite_em: string | null
          aceite_ip: string | null
          aceite_latitude: number | null
          aceite_legal: boolean | null
          aceite_longitude: number | null
          aceite_nome: string | null
          aceite_user_agent: string | null
          codigo: string
          confirmado: boolean | null
          created_at: string
          expira_em: string
          ficha_id: string
          id: string
          telefone: string
          tentativas: number | null
          tipo: string
          token: string
        }
        Insert: {
          aceite_cpf?: string | null
          aceite_em?: string | null
          aceite_ip?: string | null
          aceite_latitude?: number | null
          aceite_legal?: boolean | null
          aceite_longitude?: number | null
          aceite_nome?: string | null
          aceite_user_agent?: string | null
          codigo: string
          confirmado?: boolean | null
          created_at?: string
          expira_em: string
          ficha_id: string
          id?: string
          telefone: string
          tentativas?: number | null
          tipo: string
          token: string
        }
        Update: {
          aceite_cpf?: string | null
          aceite_em?: string | null
          aceite_ip?: string | null
          aceite_latitude?: number | null
          aceite_legal?: boolean | null
          aceite_longitude?: number | null
          aceite_nome?: string | null
          aceite_user_agent?: string | null
          codigo?: string
          confirmado?: boolean | null
          created_at?: string
          expira_em?: string
          ficha_id?: string
          id?: string
          telefone?: string
          tentativas?: number | null
          tipo?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "confirmacoes_otp_ficha_id_fkey"
            columns: ["ficha_id"]
            isOneToOne: false
            referencedRelation: "fichas_visita"
            referencedColumns: ["id"]
          },
        ]
      }
      convites: {
        Row: {
          aceito_em: string | null
          convidado_por: string | null
          created_at: string
          email: string
          expira_em: string
          id: string
          imobiliaria_id: string
          nome: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
        }
        Insert: {
          aceito_em?: string | null
          convidado_por?: string | null
          created_at?: string
          email: string
          expira_em?: string
          id?: string
          imobiliaria_id: string
          nome: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
        }
        Update: {
          aceito_em?: string | null
          convidado_por?: string | null
          created_at?: string
          email?: string
          expira_em?: string
          id?: string
          imobiliaria_id?: string
          nome?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "convites_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      convites_parceiro: {
        Row: {
          corretor_origem_id: string
          corretor_parceiro_id: string | null
          corretor_parceiro_telefone: string
          created_at: string
          expira_em: string
          ficha_id: string
          id: string
          parte_faltante: string
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          corretor_origem_id: string
          corretor_parceiro_id?: string | null
          corretor_parceiro_telefone: string
          created_at?: string
          expira_em?: string
          ficha_id: string
          id?: string
          parte_faltante: string
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          corretor_origem_id?: string
          corretor_parceiro_id?: string | null
          corretor_parceiro_telefone?: string
          created_at?: string
          expira_em?: string
          ficha_id?: string
          id?: string
          parte_faltante?: string
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "convites_parceiro_ficha_id_fkey"
            columns: ["ficha_id"]
            isOneToOne: false
            referencedRelation: "fichas_visita"
            referencedColumns: ["id"]
          },
        ]
      }
      fichas_visita: {
        Row: {
          comprador_autopreenchimento: boolean | null
          comprador_confirmado_em: string | null
          comprador_cpf: string | null
          comprador_nome: string | null
          comprador_telefone: string | null
          corretor_parceiro_id: string | null
          created_at: string
          data_visita: string
          id: string
          imobiliaria_id: string | null
          imovel_endereco: string
          imovel_tipo: string
          observacoes: string | null
          parte_preenchida_parceiro: string | null
          proprietario_autopreenchimento: boolean | null
          proprietario_confirmado_em: string | null
          proprietario_cpf: string | null
          proprietario_nome: string | null
          proprietario_telefone: string | null
          protocolo: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comprador_autopreenchimento?: boolean | null
          comprador_confirmado_em?: string | null
          comprador_cpf?: string | null
          comprador_nome?: string | null
          comprador_telefone?: string | null
          corretor_parceiro_id?: string | null
          created_at?: string
          data_visita: string
          id?: string
          imobiliaria_id?: string | null
          imovel_endereco: string
          imovel_tipo: string
          observacoes?: string | null
          parte_preenchida_parceiro?: string | null
          proprietario_autopreenchimento?: boolean | null
          proprietario_confirmado_em?: string | null
          proprietario_cpf?: string | null
          proprietario_nome?: string | null
          proprietario_telefone?: string | null
          protocolo: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comprador_autopreenchimento?: boolean | null
          comprador_confirmado_em?: string | null
          comprador_cpf?: string | null
          comprador_nome?: string | null
          comprador_telefone?: string | null
          corretor_parceiro_id?: string | null
          created_at?: string
          data_visita?: string
          id?: string
          imobiliaria_id?: string | null
          imovel_endereco?: string
          imovel_tipo?: string
          observacoes?: string | null
          parte_preenchida_parceiro?: string | null
          proprietario_autopreenchimento?: boolean | null
          proprietario_confirmado_em?: string | null
          proprietario_cpf?: string | null
          proprietario_nome?: string | null
          proprietario_telefone?: string | null
          protocolo?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fichas_visita_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      imobiliarias: {
        Row: {
          cidade: string | null
          cnpj: string | null
          codigo: number | null
          created_at: string
          email: string
          endereco: string | null
          estado: string | null
          id: string
          logo_url: string | null
          nome: string
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cidade?: string | null
          cnpj?: string | null
          codigo?: number | null
          created_at?: string
          email: string
          endereco?: string | null
          estado?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cidade?: string | null
          cnpj?: string | null
          codigo?: number | null
          created_at?: string
          email?: string
          endereco?: string | null
          estado?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      imoveis: {
        Row: {
          bairro: string | null
          cidade: string | null
          created_at: string
          endereco: string
          estado: string | null
          id: string
          imobiliaria_id: string | null
          notas: string | null
          proprietario_id: string | null
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bairro?: string | null
          cidade?: string | null
          created_at?: string
          endereco: string
          estado?: string | null
          id?: string
          imobiliaria_id?: string | null
          notas?: string | null
          proprietario_id?: string | null
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bairro?: string | null
          cidade?: string | null
          created_at?: string
          endereco?: string
          estado?: string | null
          id?: string
          imobiliaria_id?: string | null
          notas?: string | null
          proprietario_id?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "imoveis_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imoveis_proprietario_id_fkey"
            columns: ["proprietario_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      modulos: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          recursos: Json | null
          updated_at: string
          valor_mensal: number
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          recursos?: Json | null
          updated_at?: string
          valor_mensal?: number
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          recursos?: Json | null
          updated_at?: string
          valor_mensal?: number
        }
        Relationships: []
      }
      modulos_contratados: {
        Row: {
          asaas_subscription_id: string | null
          created_at: string
          data_fim: string | null
          data_inicio: string
          id: string
          imobiliaria_id: string | null
          modulo_id: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          asaas_subscription_id?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          imobiliaria_id?: string | null
          modulo_id: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          asaas_subscription_id?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          imobiliaria_id?: string | null
          modulo_id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modulos_contratados_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modulos_contratados_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          asaas_plan_id: string | null
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          max_clientes: number
          max_corretores: number
          max_fichas_mes: number
          max_imoveis: number
          nome: string
          updated_at: string
          valor_mensal: number
        }
        Insert: {
          asaas_plan_id?: string | null
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          max_clientes?: number
          max_corretores?: number
          max_fichas_mes?: number
          max_imoveis?: number
          nome: string
          updated_at?: string
          valor_mensal?: number
        }
        Update: {
          asaas_plan_id?: string | null
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          max_clientes?: number
          max_corretores?: number
          max_fichas_mes?: number
          max_imoveis?: number
          nome?: string
          updated_at?: string
          valor_mensal?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          created_at: string
          creci: string | null
          foto_url: string | null
          id: string
          imobiliaria: string | null
          imobiliaria_id: string | null
          nome: string
          telefone: string | null
          termos_aceitos_em: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          creci?: string | null
          foto_url?: string | null
          id?: string
          imobiliaria?: string | null
          imobiliaria_id?: string | null
          nome: string
          telefone?: string | null
          termos_aceitos_em?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          creci?: string | null
          foto_url?: string | null
          id?: string
          imobiliaria?: string | null
          imobiliaria_id?: string | null
          nome?: string
          telefone?: string | null
          termos_aceitos_em?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      templates_mensagem: {
        Row: {
          ativo: boolean
          conteudo: string
          created_at: string
          id: string
          imobiliaria_id: string | null
          nome: string
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          conteudo: string
          created_at?: string
          id?: string
          imobiliaria_id?: string | null
          nome: string
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          conteudo?: string
          created_at?: string
          id?: string
          imobiliaria_id?: string | null
          nome?: string
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_mensagem_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          imobiliaria_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          imobiliaria_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          imobiliaria_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_subscription_status: {
        Args: { _imobiliaria_id: string }
        Returns: string
      }
      check_user_subscription_status: {
        Args: { _user_id: string }
        Returns: string
      }
      cleanup_expired_otps: { Args: never; Returns: undefined }
      generate_protocolo: { Args: never; Returns: string }
      get_user_imobiliaria: { Args: { _user_id: string }; Returns: string }
      get_user_subscription: {
        Args: { _user_id: string }
        Returns: {
          data_fim: string
          data_inicio: string
          id: string
          plano_id: string
          proxima_cobranca: string
          status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_imobiliaria_admin: {
        Args: { _imobiliaria_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      normalize_phone: { Args: { phone_number: string }; Returns: string }
      user_belongs_to_imobiliaria: {
        Args: { _imobiliaria_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "imobiliaria_admin" | "corretor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "imobiliaria_admin", "corretor"],
    },
  },
} as const
