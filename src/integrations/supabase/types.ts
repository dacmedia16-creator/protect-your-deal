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
          nome?: string
          pix_chave?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      assinaturas: {
        Row: {
          afiliado_id: string | null
          asaas_customer_id: string | null
          asaas_subscription_id: string | null
          comissao_percentual: number | null
          created_at: string
          cupom_id: string | null
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
          afiliado_id?: string | null
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          comissao_percentual?: number | null
          created_at?: string
          cupom_id?: string | null
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
          afiliado_id?: string | null
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          comissao_percentual?: number | null
          created_at?: string
          cupom_id?: string | null
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
          assinatura_id: string
          comissao_paga: boolean
          comissao_paga_em: string | null
          created_at: string
          cupom_id: string
          id: string
          imobiliaria_id: string | null
          observacao_pagamento: string | null
          user_id: string | null
          valor_comissao: number
          valor_desconto: number
          valor_original: number
        }
        Insert: {
          assinatura_id: string
          comissao_paga?: boolean
          comissao_paga_em?: string | null
          created_at?: string
          cupom_id: string
          id?: string
          imobiliaria_id?: string | null
          observacao_pagamento?: string | null
          user_id?: string | null
          valor_comissao?: number
          valor_desconto: number
          valor_original: number
        }
        Update: {
          assinatura_id?: string
          comissao_paga?: boolean
          comissao_paga_em?: string | null
          created_at?: string
          cupom_id?: string
          id?: string
          imobiliaria_id?: string | null
          observacao_pagamento?: string | null
          user_id?: string | null
          valor_comissao?: number
          valor_desconto?: number
          valor_original?: number
        }
        Relationships: [
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
        ]
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
            foreignKeyName: "equipes_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
          {
            foreignKeyName: "equipes_membros_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          user_id: string
        }
        Insert: {
          backup_gerado_em?: string | null
          comprador_autopreenchimento?: boolean | null
          comprador_confirmado_em?: string | null
          comprador_cpf?: string | null
          comprador_nome?: string | null
          comprador_telefone?: string | null
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
          user_id: string
        }
        Update: {
          backup_gerado_em?: string | null
          comprador_autopreenchimento?: boolean | null
          comprador_confirmado_em?: string | null
          comprador_cpf?: string | null
          comprador_nome?: string | null
          comprador_telefone?: string | null
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
          id: string
          max_clientes: number
          max_corretores: number
          max_fichas_mes: number
          max_imoveis: number
          nome: string
          tipo_cadastro: string | null
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
          tipo_cadastro?: string | null
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
          tipo_cadastro?: string | null
          updated_at?: string
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
      imobiliarias_publicas: {
        Row: {
          codigo: number | null
          id: string | null
          logo_url: string | null
          nome: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_equipe_access: {
        Args: { equipe_imobiliaria_id: string }
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
