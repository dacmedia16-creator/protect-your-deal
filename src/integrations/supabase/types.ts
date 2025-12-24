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
      clientes: {
        Row: {
          cpf: string | null
          created_at: string
          email: string | null
          id: string
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
          nome?: string
          notas?: string | null
          tags?: string[] | null
          telefone?: string
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      fichas_visita: {
        Row: {
          comprador_confirmado_em: string | null
          comprador_cpf: string | null
          comprador_nome: string
          comprador_telefone: string
          created_at: string
          data_visita: string
          id: string
          imovel_endereco: string
          imovel_tipo: string
          observacoes: string | null
          proprietario_confirmado_em: string | null
          proprietario_cpf: string | null
          proprietario_nome: string
          proprietario_telefone: string
          protocolo: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comprador_confirmado_em?: string | null
          comprador_cpf?: string | null
          comprador_nome: string
          comprador_telefone: string
          created_at?: string
          data_visita: string
          id?: string
          imovel_endereco: string
          imovel_tipo: string
          observacoes?: string | null
          proprietario_confirmado_em?: string | null
          proprietario_cpf?: string | null
          proprietario_nome: string
          proprietario_telefone: string
          protocolo: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comprador_confirmado_em?: string | null
          comprador_cpf?: string | null
          comprador_nome?: string
          comprador_telefone?: string
          created_at?: string
          data_visita?: string
          id?: string
          imovel_endereco?: string
          imovel_tipo?: string
          observacoes?: string | null
          proprietario_confirmado_em?: string | null
          proprietario_cpf?: string | null
          proprietario_nome?: string
          proprietario_telefone?: string
          protocolo?: string
          status?: string
          updated_at?: string
          user_id?: string
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
          notas?: string | null
          proprietario_id?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "imoveis_proprietario_id_fkey"
            columns: ["proprietario_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          creci: string | null
          foto_url: string | null
          id: string
          imobiliaria: string | null
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          creci?: string | null
          foto_url?: string | null
          id?: string
          imobiliaria?: string | null
          nome: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          creci?: string | null
          foto_url?: string | null
          id?: string
          imobiliaria?: string | null
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      templates_mensagem: {
        Row: {
          ativo: boolean
          conteudo: string
          created_at: string
          id: string
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
          nome?: string
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_protocolo: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
