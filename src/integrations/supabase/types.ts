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
      afiliados: {
        Row: {
          ativo: boolean
          comissao_ativa: boolean
          created_at: string
          email: string
          id: string
          indicado_por: string | null
          nome: string
          pix_chave: string | null
          telefone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          comissao_ativa?: boolean
          created_at?: string
          email: string
          id?: string
          indicado_por?: string | null
          nome: string
          pix_chave?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          comissao_ativa?: boolean
          created_at?: string
          email?: string
          id?: string
          indicado_por?: string | null
          nome?: string
          pix_chave?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "afiliados_indicado_por_fkey"
            columns: ["indicado_por"]
            isOneToOne: false
            referencedRelation: "afiliados"
            referencedColumns: ["id"]
          },
        ]
      }
      app_versions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          published_at: string
          published_by: string | null
          version: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          published_at?: string
          published_by?: string | null
          version: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          published_at?: string
          published_by?: string | null
          version?: string
        }
        Relationships: []
      }
      assinaturas: {
        Row: {
          afiliado_id: string | null
          asaas_customer_id: string | null
          asaas_subscription_id: string | null
          ciclo: string | null
          comissao_percentual: number | null
          created_at: string
          cupom_id: string | null
          data_fim: string | null
          data_inicio: string
          id: string
          imobiliaria_id: string | null
          plano_id: string
          plano_pendente_id: string | null
          proxima_cobranca: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          afiliado_id?: string | null
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          ciclo?: string | null
          comissao_percentual?: number | null
          created_at?: string
          cupom_id?: string | null
          data_fim?: string | null
          data_inicio?: string
          id?: string
          imobiliaria_id?: string | null
          plano_id: string
          plano_pendente_id?: string | null
          proxima_cobranca?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          afiliado_id?: string | null
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          ciclo?: string | null
          comissao_percentual?: number | null
          created_at?: string
          cupom_id?: string | null
          data_fim?: string | null
          data_inicio?: string
          id?: string
          imobiliaria_id?: string | null
          plano_id?: string
          plano_pendente_id?: string | null
          proxima_cobranca?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_afiliado_id_fkey"
            columns: ["afiliado_id"]
            isOneToOne: false
            referencedRelation: "afiliados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_cupom_id_fkey"
            columns: ["cupom_id"]
            isOneToOne: false
            referencedRelation: "cupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_plano_pendente_id_fkey"
            columns: ["plano_pendente_id"]
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
          {
            foreignKeyName: "audit_logs_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias_publicas"
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
          {
            foreignKeyName: "clientes_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_sistema: {
        Row: {
          chave: string
          created_at: string | null
          descricao: string | null
          id: string
          updated_at: string | null
          valor: Json
        }
        Insert: {
          chave: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          updated_at?: string | null
          valor?: Json
        }
        Update: {
          chave?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          updated_at?: string | null
          valor?: Json
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
          aceite_localizacao_tipo: string | null
          aceite_longitude: number | null
          aceite_nome: string | null
          aceite_user_agent: string | null
          codigo: string
          confirmado: boolean | null
          created_at: string
          expira_em: string
          ficha_id: string
          id: string
          lembrete_enviado_em: string | null
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
          aceite_localizacao_tipo?: string | null
          aceite_longitude?: number | null
          aceite_nome?: string | null
          aceite_user_agent?: string | null
          codigo: string
          confirmado?: boolean | null
          created_at?: string
          expira_em: string
          ficha_id: string
          id?: string
          lembrete_enviado_em?: string | null
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
          aceite_localizacao_tipo?: string | null
          aceite_longitude?: number | null
          aceite_nome?: string | null
          aceite_user_agent?: string | null
          codigo?: string
          confirmado?: boolean | null
          created_at?: string
          expira_em?: string
          ficha_id?: string
          id?: string
          lembrete_enviado_em?: string | null
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
          {
            foreignKeyName: "convites_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias_publicas"
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
          parceiro_cpf: string | null
          parceiro_creci: string | null
          parceiro_imobiliaria: string | null
          parceiro_nome: string | null
          parte_faltante: string
          permite_externo: boolean | null
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
          parceiro_cpf?: string | null
          parceiro_creci?: string | null
          parceiro_imobiliaria?: string | null
          parceiro_nome?: string | null
          parte_faltante: string
          permite_externo?: boolean | null
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
          parceiro_cpf?: string | null
          parceiro_creci?: string | null
          parceiro_imobiliaria?: string | null
          parceiro_nome?: string | null
          parte_faltante?: string
          permite_externo?: boolean | null
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
      cupons: {
        Row: {
          afiliado_id: string
          ativo: boolean
          codigo: string
          comissao_percentual: number
          created_at: string
          id: string
          max_usos: number | null
          tipo_desconto: string
          updated_at: string
          usos_atuais: number
          valido_ate: string | null
          valor_desconto: number
        }
        Insert: {
          afiliado_id: string
          ativo?: boolean
          codigo: string
          comissao_percentual?: number
          created_at?: string
          id?: string
          max_usos?: number | null
          tipo_desconto: string
          updated_at?: string
          usos_atuais?: number
          valido_ate?: string | null
          valor_desconto: number
        }
        Update: {
          afiliado_id?: string
          ativo?: boolean
          codigo?: string
          comissao_percentual?: number
          created_at?: string
          id?: string
          max_usos?: number | null
          tipo_desconto?: string
          updated_at?: string
          usos_atuais?: number
          valido_ate?: string | null
          valor_desconto?: number
        }
        Relationships: [
          {
            foreignKeyName: "cupons_afiliado_id_fkey"
            columns: ["afiliado_id"]
            isOneToOne: false
            referencedRelation: "afiliados"
            referencedColumns: ["id"]
          },
        ]
      }
      cupons_usos: {
        Row: {
          afiliado_id: string | null
          assinatura_id: string
          comissao_paga: boolean
          comissao_paga_em: string | null
          created_at: string
          cupom_id: string
          id: string
          imobiliaria_id: string | null
          observacao_pagamento: string | null
          tipo_comissao: string
          user_id: string | null
          valor_comissao: number
          valor_desconto: number
          valor_original: number
        }
        Insert: {
          afiliado_id?: string | null
          assinatura_id: string
          comissao_paga?: boolean
          comissao_paga_em?: string | null
          created_at?: string
          cupom_id: string
          id?: string
          imobiliaria_id?: string | null
          observacao_pagamento?: string | null
          tipo_comissao?: string
          user_id?: string | null
          valor_comissao?: number
          valor_desconto: number
          valor_original: number
        }
        Update: {
          afiliado_id?: string | null
          assinatura_id?: string
          comissao_paga?: boolean
          comissao_paga_em?: string | null
          created_at?: string
          cupom_id?: string
          id?: string
          imobiliaria_id?: string | null
          observacao_pagamento?: string | null
          tipo_comissao?: string
          user_id?: string | null
          valor_comissao?: number
          valor_desconto?: number
          valor_original?: number
        }
        Relationships: [
          {
            foreignKeyName: "cupons_usos_afiliado_id_fkey"
            columns: ["afiliado_id"]
            isOneToOne: false
            referencedRelation: "afiliados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cupons_usos_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "assinaturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cupons_usos_cupom_id_fkey"
            columns: ["cupom_id"]
            isOneToOne: false
            referencedRelation: "cupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cupons_usos_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cupons_usos_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      depoimentos: {
        Row: {
          ativo: boolean
          avatar_url: string | null
          cargo: string | null
          created_at: string
          empresa: string | null
          id: string
          nome: string
          nota: number
          ordem: number
          texto: string
        }
        Insert: {
          ativo?: boolean
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          empresa?: string | null
          id?: string
          nome: string
          nota?: number
          ordem?: number
          texto: string
        }
        Update: {
          ativo?: boolean
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          empresa?: string | null
          id?: string
          nome?: string
          nota?: number
          ordem?: number
          texto?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string
          error_message: string | null
          ficha_id: string | null
          from_email: string | null
          id: string
          imobiliaria_id: string | null
          status: string
          subject: string
          template_tipo: string | null
          to_email: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          ficha_id?: string | null
          from_email?: string | null
          id?: string
          imobiliaria_id?: string | null
          status?: string
          subject: string
          template_tipo?: string | null
          to_email: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          ficha_id?: string | null
          from_email?: string | null
          id?: string
          imobiliaria_id?: string | null
          status?: string
          subject?: string
          template_tipo?: string | null
          to_email?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_ficha_id_fkey"
            columns: ["ficha_id"]
            isOneToOne: false
            referencedRelation: "fichas_visita"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      email_remetentes: {
        Row: {
          ativo: boolean
          categoria: string
          created_at: string | null
          email: string
          id: string
          nome_exibicao: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string
          created_at?: string | null
          email: string
          id?: string
          nome_exibicao?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string
          created_at?: string | null
          email?: string
          id?: string
          nome_exibicao?: string
        }
        Relationships: []
      }
      equipes: {
        Row: {
          ativa: boolean | null
          cor: string | null
          created_at: string
          descricao: string | null
          id: string
          imobiliaria_id: string
          lider_id: string | null
          nome: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          ativa?: boolean | null
          cor?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          imobiliaria_id: string
          lider_id?: string | null
          nome: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          ativa?: boolean | null
          cor?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          imobiliaria_id?: string
          lider_id?: string | null
          nome?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipes_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipes_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipes_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "equipes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
        ]
      }
      equipes_membros: {
        Row: {
          cargo: string | null
          created_at: string
          entrou_em: string
          equipe_id: string
          id: string
          user_id: string
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          entrou_em?: string
          equipe_id: string
          id?: string
          user_id: string
        }
        Update: {
          cargo?: string | null
          created_at?: string
          entrou_em?: string
          equipe_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipes_membros_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
        ]
      }
      ficha_usage_log: {
        Row: {
          created_at: string
          ficha_id: string
          id: string
          imobiliaria_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          ficha_id: string
          id?: string
          imobiliaria_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          ficha_id?: string
          id?: string
          imobiliaria_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fichas_visita: {
        Row: {
          backup_gerado_em: string | null
          comprador_autopreenchimento: boolean | null
          comprador_confirmado_em: string | null
          comprador_cpf: string | null
          comprador_nome: string | null
          comprador_telefone: string | null
          convertido_em: string | null
          convertido_por: string | null
          convertido_venda: boolean | null
          corretor_parceiro_id: string | null
          created_at: string
          data_visita: string
          documento_gerado_em: string | null
          documento_hash: string | null
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
          user_id: string | null
          valor_venda: number | null
        }
        Insert: {
          backup_gerado_em?: string | null
          comprador_autopreenchimento?: boolean | null
          comprador_confirmado_em?: string | null
          comprador_cpf?: string | null
          comprador_nome?: string | null
          comprador_telefone?: string | null
          convertido_em?: string | null
          convertido_por?: string | null
          convertido_venda?: boolean | null
          corretor_parceiro_id?: string | null
          created_at?: string
          data_visita: string
          documento_gerado_em?: string | null
          documento_hash?: string | null
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
          user_id?: string | null
          valor_venda?: number | null
        }
        Update: {
          backup_gerado_em?: string | null
          comprador_autopreenchimento?: boolean | null
          comprador_confirmado_em?: string | null
          comprador_cpf?: string | null
          comprador_nome?: string | null
          comprador_telefone?: string | null
          convertido_em?: string | null
          convertido_por?: string | null
          convertido_venda?: boolean | null
          corretor_parceiro_id?: string | null
          created_at?: string
          data_visita?: string
          documento_gerado_em?: string | null
          documento_hash?: string | null
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
          user_id?: string | null
          valor_venda?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fichas_visita_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fichas_visita_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      imobiliaria_feature_flags: {
        Row: {
          created_at: string
          enabled: boolean
          feature_key: string
          id: string
          imobiliaria_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          feature_key: string
          id?: string
          imobiliaria_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          feature_key?: string
          id?: string
          imobiliaria_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "imobiliaria_feature_flags_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imobiliaria_feature_flags_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias_publicas"
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
          creci_juridico: string | null
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
          creci_juridico?: string | null
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
          creci_juridico?: string | null
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
            foreignKeyName: "imoveis_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias_publicas"
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
      indicacoes_corretor: {
        Row: {
          codigo: string
          comissao_paga: boolean
          comissao_paga_em: string | null
          comissao_percentual: number
          created_at: string
          id: string
          indicado_imobiliaria_id: string | null
          indicado_user_id: string | null
          indicador_user_id: string
          observacao_pagamento: string | null
          status: string
          tipo_comissao_indicacao: string
          tipo_indicado: string
          updated_at: string
          valor_comissao: number | null
        }
        Insert: {
          codigo: string
          comissao_paga?: boolean
          comissao_paga_em?: string | null
          comissao_percentual?: number
          created_at?: string
          id?: string
          indicado_imobiliaria_id?: string | null
          indicado_user_id?: string | null
          indicador_user_id: string
          observacao_pagamento?: string | null
          status?: string
          tipo_comissao_indicacao?: string
          tipo_indicado?: string
          updated_at?: string
          valor_comissao?: number | null
        }
        Update: {
          codigo?: string
          comissao_paga?: boolean
          comissao_paga_em?: string | null
          comissao_percentual?: number
          created_at?: string
          id?: string
          indicado_imobiliaria_id?: string | null
          indicado_user_id?: string | null
          indicador_user_id?: string
          observacao_pagamento?: string | null
          status?: string
          tipo_comissao_indicacao?: string
          tipo_indicado?: string
          updated_at?: string
          valor_comissao?: number | null
        }
        Relationships: []
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
            foreignKeyName: "modulos_contratados_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias_publicas"
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
      otp_queue: {
        Row: {
          app_url: string | null
          created_at: string | null
          ficha_id: string
          id: string
          prioridade: number | null
          processed_at: string | null
          status: string
          tentativas: number | null
          tipo: string
          ultimo_erro: string | null
          user_id: string | null
        }
        Insert: {
          app_url?: string | null
          created_at?: string | null
          ficha_id: string
          id?: string
          prioridade?: number | null
          processed_at?: string | null
          status?: string
          tentativas?: number | null
          tipo: string
          ultimo_erro?: string | null
          user_id?: string | null
        }
        Update: {
          app_url?: string | null
          created_at?: string | null
          ficha_id?: string
          id?: string
          prioridade?: number | null
          processed_at?: string | null
          status?: string
          tentativas?: number | null
          tipo?: string
          ultimo_erro?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "otp_queue_ficha_id_fkey"
            columns: ["ficha_id"]
            isOneToOne: false
            referencedRelation: "fichas_visita"
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
          exibir_no_site: boolean
          id: string
          max_clientes: number
          max_corretores: number
          max_fichas_mes: number
          max_imoveis: number
          nome: string
          tipo_cadastro: string | null
          updated_at: string
          valor_anual: number | null
          valor_mensal: number
        }
        Insert: {
          asaas_plan_id?: string | null
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          exibir_no_site?: boolean
          id?: string
          max_clientes?: number
          max_corretores?: number
          max_fichas_mes?: number
          max_imoveis?: number
          nome: string
          tipo_cadastro?: string | null
          updated_at?: string
          valor_anual?: number | null
          valor_mensal?: number
        }
        Update: {
          asaas_plan_id?: string | null
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          exibir_no_site?: boolean
          id?: string
          max_clientes?: number
          max_corretores?: number
          max_fichas_mes?: number
          max_imoveis?: number
          nome?: string
          tipo_cadastro?: string | null
          updated_at?: string
          valor_anual?: number | null
          valor_mensal?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          cpf: string | null
          created_at: string
          creci: string | null
          email: string | null
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
          cpf?: string | null
          created_at?: string
          creci?: string | null
          email?: string | null
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
          cpf?: string | null
          created_at?: string
          creci?: string | null
          email?: string | null
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
          {
            foreignKeyName: "profiles_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          liked_least: string | null
          liked_most: string | null
          rating_common_areas: number
          rating_conservation: number
          rating_finishes: number
          rating_layout: number
          rating_location: number
          rating_price: number
          rating_size: number
          survey_id: string
          user_agent: string | null
          would_buy: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          liked_least?: string | null
          liked_most?: string | null
          rating_common_areas: number
          rating_conservation: number
          rating_finishes: number
          rating_layout: number
          rating_location: number
          rating_price: number
          rating_size: number
          survey_id: string
          user_agent?: string | null
          would_buy: boolean
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          liked_least?: string | null
          liked_most?: string | null
          rating_common_areas?: number
          rating_conservation?: number
          rating_finishes?: number
          rating_layout?: number
          rating_location?: number
          rating_price?: number
          rating_size?: number
          survey_id?: string
          user_agent?: string | null
          would_buy?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: true
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          corretor_id: string
          created_at: string
          expires_at: string
          ficha_id: string
          id: string
          imobiliaria_id: string | null
          responded_at: string | null
          sent_at: string | null
          status: string
          token: string
        }
        Insert: {
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          corretor_id: string
          created_at?: string
          expires_at?: string
          ficha_id: string
          id?: string
          imobiliaria_id?: string | null
          responded_at?: string | null
          sent_at?: string | null
          status?: string
          token?: string
        }
        Update: {
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          corretor_id?: string
          created_at?: string
          expires_at?: string
          ficha_id?: string
          id?: string
          imobiliaria_id?: string | null
          responded_at?: string | null
          sent_at?: string | null
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "surveys_ficha_id_fkey"
            columns: ["ficha_id"]
            isOneToOne: true
            referencedRelation: "fichas_visita"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surveys_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surveys_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      templates_email: {
        Row: {
          assunto: string
          ativo: boolean
          conteudo_html: string
          conteudo_texto: string | null
          created_at: string
          id: string
          imobiliaria_id: string | null
          nome: string
          remetente_email: string | null
          tipo: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assunto: string
          ativo?: boolean
          conteudo_html: string
          conteudo_texto?: string | null
          created_at?: string
          id?: string
          imobiliaria_id?: string | null
          nome: string
          remetente_email?: string | null
          tipo: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assunto?: string
          ativo?: boolean
          conteudo_html?: string
          conteudo_texto?: string | null
          created_at?: string
          id?: string
          imobiliaria_id?: string | null
          nome?: string
          remetente_email?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_email_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_email_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias_publicas"
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
          {
            foreignKeyName: "templates_mensagem_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feature_flags: {
        Row: {
          created_at: string
          enabled: boolean
          feature_key: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          feature_key: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          feature_key?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "user_roles_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          id: string
          imobiliaria_id: string | null
          ip_address: string | null
          is_impersonation: boolean | null
          login_at: string
          logout_at: string | null
          logout_type: string | null
          session_duration_seconds: number | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          imobiliaria_id?: string | null
          ip_address?: string | null
          is_impersonation?: boolean | null
          login_at?: string
          logout_at?: string | null
          logout_type?: string | null
          session_duration_seconds?: number | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          imobiliaria_id?: string | null
          ip_address?: string | null
          is_impersonation?: boolean | null
          login_at?: string
          logout_at?: string | null
          logout_type?: string | null
          session_duration_seconds?: number | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sessions_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string | null
          id: string
          payload: Json
          processed: boolean | null
          source: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string | null
          id?: string
          payload: Json
          processed?: boolean | null
          source?: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string | null
          id?: string
          payload?: Json
          processed?: boolean | null
          source?: string
        }
        Relationships: []
      }
    }
    Views: {
      confirmacoes_otp_view: {
        Row: {
          aceite_cpf: string | null
          aceite_em: string | null
          aceite_ip: string | null
          aceite_latitude: number | null
          aceite_legal: boolean | null
          aceite_localizacao_tipo: string | null
          aceite_longitude: number | null
          aceite_nome: string | null
          aceite_user_agent: string | null
          confirmado: boolean | null
          created_at: string | null
          expira_em: string | null
          ficha_id: string | null
          id: string | null
          lembrete_enviado_em: string | null
          tentativas: number | null
          tipo: string | null
        }
        Insert: {
          aceite_cpf?: string | null
          aceite_em?: string | null
          aceite_ip?: string | null
          aceite_latitude?: number | null
          aceite_legal?: boolean | null
          aceite_localizacao_tipo?: string | null
          aceite_longitude?: number | null
          aceite_nome?: string | null
          aceite_user_agent?: string | null
          confirmado?: boolean | null
          created_at?: string | null
          expira_em?: string | null
          ficha_id?: string | null
          id?: string | null
          lembrete_enviado_em?: string | null
          tentativas?: number | null
          tipo?: string | null
        }
        Update: {
          aceite_cpf?: string | null
          aceite_em?: string | null
          aceite_ip?: string | null
          aceite_latitude?: number | null
          aceite_legal?: boolean | null
          aceite_localizacao_tipo?: string | null
          aceite_longitude?: number | null
          aceite_nome?: string | null
          aceite_user_agent?: string | null
          confirmado?: boolean | null
          created_at?: string | null
          expira_em?: string | null
          ficha_id?: string | null
          id?: string | null
          lembrete_enviado_em?: string | null
          tentativas?: number | null
          tipo?: string | null
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
      imobiliarias_publicas: {
        Row: {
          codigo: number | null
          id: string | null
          logo_url: string | null
          nome: string | null
        }
        Insert: {
          codigo?: number | null
          id?: string | null
          logo_url?: string | null
          nome?: string | null
        }
        Update: {
          codigo?: number | null
          id?: string | null
          logo_url?: string | null
          nome?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_membro_to_equipe: {
        Args: { p_equipe_id: string; p_user_id: string }
        Returns: undefined
      }
      check_equipe_access: {
        Args: { equipe_imobiliaria_id: string }
        Returns: boolean
      }
      check_phone_available: {
        Args: { phone_number: string }
        Returns: boolean
      }
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
      get_afiliado_id: { Args: { _user_id: string }; Returns: string }
      get_cupom_by_afiliado: {
        Args: { afiliado_uuid: string }
        Returns: string
      }
      get_equipes_by_imobiliaria: {
        Args: { imob_id: string }
        Returns: {
          cor: string
          descricao: string
          id: string
          nome: string
        }[]
      }
      get_fichas_admin: {
        Args: never
        Returns: {
          backup_gerado_em: string
          comprador_nome: string
          convertido_venda: boolean
          corretor_nome: string
          data_visita: string
          id: string
          imobiliaria_id: string
          imobiliaria_nome: string
          imovel_endereco: string
          proprietario_nome: string
          protocolo: string
          status: string
          user_id: string
        }[]
      }
      get_fichas_empresa: {
        Args: { p_imobiliaria_id: string }
        Returns: {
          comprador_nome: string
          convertido_venda: boolean
          corretor_nome: string
          created_at: string
          data_visita: string
          id: string
          imovel_endereco: string
          proprietario_nome: string
          protocolo: string
          status: string
          user_id: string
        }[]
      }
      get_imobiliaria_admin: { Args: { imob_id: string }; Returns: string }
      get_imobiliarias_publicas: {
        Args: never
        Returns: {
          codigo: number
          id: string
          logo_url: string
          nome: string
        }[]
      }
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
      increment_cupom_usos: { Args: { cupom_uuid: string }; Returns: undefined }
      is_equipe_admin: {
        Args: { equipe_imobiliaria_id: string }
        Returns: boolean
      }
      is_equipe_lider: { Args: { _user_id: string }; Returns: boolean }
      is_imobiliaria_admin: {
        Args: { _imobiliaria_id: string; _user_id: string }
        Returns: boolean
      }
      is_lider_of_equipe: {
        Args: { _equipe_id: string; _user_id: string }
        Returns: boolean
      }
      is_membro_da_minha_equipe: {
        Args: { _lider_id: string; _membro_user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      is_user_active: { Args: { _user_id: string }; Returns: boolean }
      normalize_phone: { Args: { phone_number: string }; Returns: string }
      user_belongs_to_imobiliaria: {
        Args: { _imobiliaria_id: string; _user_id: string }
        Returns: boolean
      }
      validar_cupom: {
        Args: { codigo_cupom: string }
        Returns: {
          afiliado_id: string
          afiliado_nome: string
          comissao_percentual: number
          cupom_id: string
          mensagem: string
          tipo_desconto: string
          valido: boolean
          valor_desconto: number
        }[]
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "imobiliaria_admin"
        | "corretor"
        | "construtora_admin"
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
      app_role: [
        "super_admin",
        "imobiliaria_admin",
        "corretor",
        "construtora_admin",
      ],
    },
  },
} as const
