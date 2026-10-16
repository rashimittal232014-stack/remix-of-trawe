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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          color: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_at: string | null
          id: string
          lead_id: string | null
          owner_id: string | null
          status: Database["public"]["Enums"]["activity_status"]
          tenant_id: string
          title: string
          type: Database["public"]["Enums"]["activity_type"]
          updated_at: string
        }
        Insert: {
          color?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          owner_id?: string | null
          status?: Database["public"]["Enums"]["activity_status"]
          tenant_id: string
          title: string
          type?: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
        }
        Update: {
          color?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          owner_id?: string | null
          status?: Database["public"]["Enums"]["activity_status"]
          tenant_id?: string
          title?: string
          type?: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          created_at: string
          date: string
          hours: number | null
          id: string
          notes: string | null
          punch_in: string | null
          punch_out: string | null
          status: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          hours?: number | null
          id?: string
          notes?: string | null
          punch_in?: string | null
          punch_out?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          hours?: number | null
          id?: string
          notes?: string | null
          punch_in?: string | null
          punch_out?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_logs: {
        Row: {
          automation_id: string
          detail: string | null
          id: string
          ran_at: string
          status: string
          tenant_id: string
        }
        Insert: {
          automation_id: string
          detail?: string | null
          id?: string
          ran_at?: string
          status?: string
          tenant_id: string
        }
        Update: {
          automation_id?: string
          detail?: string | null
          id?: string
          ran_at?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_trigger_logs: {
        Row: {
          error: string | null
          id: string
          lead_id: string | null
          message: string | null
          phone: string | null
          sent_at: string
          status: string
          tenant_id: string
          trigger_id: string | null
        }
        Insert: {
          error?: string | null
          id?: string
          lead_id?: string | null
          message?: string | null
          phone?: string | null
          sent_at?: string
          status: string
          tenant_id: string
          trigger_id?: string | null
        }
        Update: {
          error?: string | null
          id?: string
          lead_id?: string | null
          message?: string | null
          phone?: string | null
          sent_at?: string
          status?: string
          tenant_id?: string
          trigger_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_trigger_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_trigger_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_trigger_logs_trigger_id_fkey"
            columns: ["trigger_id"]
            isOneToOne: false
            referencedRelation: "automation_triggers"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_triggers: {
        Row: {
          created_at: string
          end_time: string
          id: string
          max_send: number
          message: string
          name: string
          send_interval_hours: number
          send_per_day: number
          send_type: string
          stage_id: string
          start_time: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time?: string
          id?: string
          max_send?: number
          message: string
          name: string
          send_interval_hours?: number
          send_per_day?: number
          send_type?: string
          stage_id: string
          start_time?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          max_send?: number
          message?: string
          name?: string
          send_interval_hours?: number
          send_per_day?: number
          send_type?: string
          stage_id?: string
          start_time?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_triggers_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_triggers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          actions: Json
          active: boolean
          conditions: Json
          created_at: string
          description: string | null
          event: string
          id: string
          module: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          active?: boolean
          conditions?: Json
          created_at?: string
          description?: string | null
          event: string
          id?: string
          module: string
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          active?: boolean
          conditions?: Json
          created_at?: string
          description?: string | null
          event?: string
          id?: string
          module?: string
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_invoices: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          currency: string
          due_date: string | null
          id: string
          invoice_no: string
          issue_date: string
          notes: string | null
          pdf_url: string | null
          period_start: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          invoice_no: string
          issue_date?: string
          notes?: string | null
          pdf_url?: string | null
          period_start?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          invoice_no?: string
          issue_date?: string
          notes?: string | null
          pdf_url?: string | null
          period_start?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          adults: number
          booking_type: string
          children: number
          code: string | null
          created_at: string
          currency: string
          customer_id: string | null
          destination: string | null
          gross_value: number
          id: string
          lead_id: string | null
          meta: Json
          net_cost: number
          notes: string | null
          owner_id: string | null
          quotation_id: string | null
          source: string
          status: string
          tenant_id: string
          title: string
          travel_from: string | null
          travel_to: string | null
          updated_at: string
        }
        Insert: {
          adults?: number
          booking_type?: string
          children?: number
          code?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          destination?: string | null
          gross_value?: number
          id?: string
          lead_id?: string | null
          meta?: Json
          net_cost?: number
          notes?: string | null
          owner_id?: string | null
          quotation_id?: string | null
          source?: string
          status?: string
          tenant_id: string
          title?: string
          travel_from?: string | null
          travel_to?: string | null
          updated_at?: string
        }
        Update: {
          adults?: number
          booking_type?: string
          children?: number
          code?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          destination?: string | null
          gross_value?: number
          id?: string
          lead_id?: string | null
          meta?: Json
          net_cost?: number
          notes?: string | null
          owner_id?: string | null
          quotation_id?: string | null
          source?: string
          status?: string
          tenant_id?: string
          title?: string
          travel_from?: string | null
          travel_to?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          city: string | null
          code: string | null
          country: string | null
          created_at: string
          email: string | null
          gstin: string | null
          id: string
          invoice_prefix: string | null
          is_active: boolean
          is_default: boolean
          name: string
          phone: string | null
          state: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          invoice_prefix?: string | null
          is_active?: boolean
          is_default?: boolean
          name: string
          phone?: string | null
          state?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          invoice_prefix?: string | null
          is_active?: boolean
          is_default?: boolean
          name?: string
          phone?: string | null
          state?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_reads: {
        Row: {
          broadcast_id: string
          created_at: string
          id: string
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          broadcast_id: string
          created_at?: string
          id?: string
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          broadcast_id?: string
          created_at?: string
          id?: string
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_reads_broadcast_id_fkey"
            columns: ["broadcast_id"]
            isOneToOne: false
            referencedRelation: "platform_broadcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_recipients: {
        Row: {
          campaign_id: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          error: string | null
          id: string
          sent_at: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          campaign_id: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          error?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          campaign_id?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          error?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          body: string | null
          channel: string
          created_at: string
          failed_count: number
          group_id: string | null
          id: string
          meta: Json
          name: string
          scheduled_at: string | null
          sent_count: number
          status: string
          subject: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          channel?: string
          created_at?: string
          failed_count?: number
          group_id?: string | null
          id?: string
          meta?: Json
          name: string
          scheduled_at?: string | null
          sent_count?: number
          status?: string
          subject?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          channel?: string
          created_at?: string
          failed_count?: number
          group_id?: string | null
          id?: string
          meta?: Json
          name?: string
          scheduled_at?: string | null
          sent_count?: number
          status?: string
          subject?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "contact_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          description: string | null
          email: string | null
          gstin: string | null
          id: string
          industry: string | null
          name: string
          notes: string | null
          owner_id: string | null
          pan: string | null
          phone: string | null
          pincode: string | null
          state: string | null
          tenant_id: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          industry?: string | null
          name: string
          notes?: string | null
          owner_id?: string | null
          pan?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          tenant_id: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          industry?: string | null
          name?: string
          notes?: string | null
          owner_id?: string | null
          pan?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          tenant_id?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_groups: {
        Row: {
          created_at: string
          description: string | null
          filter: Json
          id: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          filter?: Json
          id?: string
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          filter?: Json
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_groups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_notes: {
        Row: {
          amount: number
          applied_to_wallet: boolean
          code: string
          created_at: string
          currency: string | null
          customer_id: string
          id: string
          invoice_id: string | null
          issue_date: string
          notes: string | null
          owner_id: string | null
          reason: string | null
          status: string
          tax_amount: number
          tenant_id: string
          total: number
          updated_at: string
        }
        Insert: {
          amount?: number
          applied_to_wallet?: boolean
          code: string
          created_at?: string
          currency?: string | null
          customer_id: string
          id?: string
          invoice_id?: string | null
          issue_date?: string
          notes?: string | null
          owner_id?: string | null
          reason?: string | null
          status?: string
          tax_amount?: number
          tenant_id: string
          total?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          applied_to_wallet?: boolean
          code?: string
          created_at?: string
          currency?: string | null
          customer_id?: string
          id?: string
          invoice_id?: string | null
          issue_date?: string
          notes?: string | null
          owner_id?: string | null
          reason?: string | null
          status?: string
          tax_amount?: number
          tenant_id?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_profiles: {
        Row: {
          access_level: string
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          access_level?: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          access_level?: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_roles: {
        Row: {
          created_at: string
          dashboard: string | null
          description: string | null
          id: string
          is_system: boolean
          name: string
          reports_to: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dashboard?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          reports_to?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dashboard?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          reports_to?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_roles_reports_to_fkey"
            columns: ["reports_to"]
            isOneToOne: false
            referencedRelation: "crm_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      currency_rates: {
        Row: {
          code: string
          country: string | null
          created_at: string
          id: string
          is_active: boolean
          is_base: boolean
          last_updated: string | null
          name: string
          rate: number
          sort_order: number
          symbol: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code: string
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_base?: boolean
          last_updated?: string | null
          name: string
          rate?: number
          sort_order?: number
          symbol?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_base?: boolean
          last_updated?: string | null
          name?: string
          rate?: number
          sort_order?: number
          symbol?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "currency_rates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          code: string | null
          company: string | null
          country: string | null
          created_at: string
          description: string | null
          dob: string | null
          email: string | null
          first_name: string | null
          full_name: string
          gstin: string | null
          id: string
          last_name: string | null
          notes: string | null
          owner_id: string | null
          phone: string | null
          pincode: string | null
          state: string | null
          tenant_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          code?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          dob?: string | null
          email?: string | null
          first_name?: string | null
          full_name: string
          gstin?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          tenant_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          dob?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string
          gstin?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          tenant_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_requests: {
        Row: {
          city: string | null
          company: string | null
          country: string | null
          created_at: string
          current_software: string | null
          email: string
          full_name: string
          id: string
          message: string | null
          notes: string | null
          phone: string
          source: string | null
          status: string
          team_size: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          current_software?: string | null
          email: string
          full_name: string
          id?: string
          message?: string | null
          notes?: string | null
          phone: string
          source?: string | null
          status?: string
          team_size?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          current_software?: string | null
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          notes?: string | null
          phone?: string
          source?: string | null
          status?: string
          team_size?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dob_greeting_logs: {
        Row: {
          channel: string
          created_at: string
          customer_id: string
          greeted_on: string
          id: string
          message: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          customer_id: string
          greeted_on?: string
          id?: string
          message?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          customer_id?: string
          greeted_on?: string
          id?: string
          message?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dob_greeting_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dob_greeting_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dob_greeting_settings: {
        Row: {
          channel: string
          email_enabled: boolean
          email_html: string | null
          email_subject: string | null
          enabled: boolean
          subject: string | null
          template: string | null
          tenant_id: string
          updated_at: string
          whatsapp_enabled: boolean
          whatsapp_template: string | null
        }
        Insert: {
          channel?: string
          email_enabled?: boolean
          email_html?: string | null
          email_subject?: string | null
          enabled?: boolean
          subject?: string | null
          template?: string | null
          tenant_id: string
          updated_at?: string
          whatsapp_enabled?: boolean
          whatsapp_template?: string | null
        }
        Update: {
          channel?: string
          email_enabled?: boolean
          email_html?: string | null
          email_subject?: string | null
          enabled?: boolean
          subject?: string | null
          template?: string | null
          tenant_id?: string
          updated_at?: string
          whatsapp_enabled?: boolean
          whatsapp_template?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dob_greeting_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      doc_counters: {
        Row: {
          kind: string
          last_no: number
          tenant_id: string
        }
        Insert: {
          kind: string
          last_no?: number
          tenant_id: string
        }
        Update: {
          kind?: string
          last_no?: number
          tenant_id?: string
        }
        Relationships: []
      }
      form_submissions: {
        Row: {
          created_at: string
          form_id: string
          id: string
          payload: Json
          tenant_id: string
        }
        Insert: {
          created_at?: string
          form_id: string
          id?: string
          payload?: Json
          tenant_id: string
        }
        Update: {
          created_at?: string
          form_id?: string
          id?: string
          payload?: Json
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "public_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          schema: Json
          slug: string
          tenant_id: string
          theme: Json
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          schema?: Json
          slug: string
          tenant_id: string
          theme?: Json
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          schema?: Json
          slug?: string
          tenant_id?: string
          theme?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      google_sheet_connections: {
        Row: {
          connection_name: string
          created_at: string
          created_by: string | null
          created_count: number
          crm_module: string
          duplicate_action: string
          duplicate_check_field: string | null
          failed_count: number
          field_mapping: Json
          header_row: number
          id: string
          last_sync_at: string | null
          sheet_gid: string | null
          sheet_name: string | null
          sheet_url: string
          skipped_count: number
          spreadsheet_id: string
          start_row: number
          status: string
          tenant_id: string
          updated_at: string
          updated_count: number
        }
        Insert: {
          connection_name: string
          created_at?: string
          created_by?: string | null
          created_count?: number
          crm_module: string
          duplicate_action?: string
          duplicate_check_field?: string | null
          failed_count?: number
          field_mapping?: Json
          header_row?: number
          id?: string
          last_sync_at?: string | null
          sheet_gid?: string | null
          sheet_name?: string | null
          sheet_url: string
          skipped_count?: number
          spreadsheet_id: string
          start_row?: number
          status?: string
          tenant_id: string
          updated_at?: string
          updated_count?: number
        }
        Update: {
          connection_name?: string
          created_at?: string
          created_by?: string | null
          created_count?: number
          crm_module?: string
          duplicate_action?: string
          duplicate_check_field?: string | null
          failed_count?: number
          field_mapping?: Json
          header_row?: number
          id?: string
          last_sync_at?: string | null
          sheet_gid?: string | null
          sheet_name?: string | null
          sheet_url?: string
          skipped_count?: number
          spreadsheet_id?: string
          start_row?: number
          status?: string
          tenant_id?: string
          updated_at?: string
          updated_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "google_sheet_connections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      google_sheet_sync_logs: {
        Row: {
          connection_id: string
          created_count: number
          error: string | null
          failed_count: number
          finished_at: string | null
          id: string
          rows_processed: number
          skipped_count: number
          started_at: string
          status: string
          tenant_id: string
          updated_count: number
        }
        Insert: {
          connection_id: string
          created_count?: number
          error?: string | null
          failed_count?: number
          finished_at?: string | null
          id?: string
          rows_processed?: number
          skipped_count?: number
          started_at?: string
          status?: string
          tenant_id: string
          updated_count?: number
        }
        Update: {
          connection_id?: string
          created_count?: number
          error?: string | null
          failed_count?: number
          finished_at?: string | null
          id?: string
          rows_processed?: number
          skipped_count?: number
          started_at?: string
          status?: string
          tenant_id?: string
          updated_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "google_sheet_sync_logs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "google_sheet_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_sheet_sync_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      impersonation_events: {
        Row: {
          actor_email: string | null
          actor_id: string
          created_at: string
          id: string
          ip: unknown
          reason: string | null
          target_email: string | null
          target_user_id: string | null
          tenant_id: string | null
          user_agent: string | null
        }
        Insert: {
          actor_email?: string | null
          actor_id: string
          created_at?: string
          id?: string
          ip?: unknown
          reason?: string | null
          target_email?: string | null
          target_user_id?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Update: {
          actor_email?: string | null
          actor_id?: string
          created_at?: string
          id?: string
          ip?: unknown
          reason?: string | null
          target_email?: string | null
          target_user_id?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "impersonation_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number
          description: string
          discount: number
          hsn_sac: string | null
          id: string
          invoice_id: string
          qty: number
          rate: number
          sort_order: number
          tax_amount: number
          tax_rate: number
          taxable: number
        }
        Insert: {
          amount?: number
          description: string
          discount?: number
          hsn_sac?: string | null
          id?: string
          invoice_id: string
          qty?: number
          rate?: number
          sort_order?: number
          tax_amount?: number
          tax_rate?: number
          taxable?: number
        }
        Update: {
          amount?: number
          description?: string
          discount?: number
          hsn_sac?: string | null
          id?: string
          invoice_id?: string
          qty?: number
          rate?: number
          sort_order?: number
          tax_amount?: number
          tax_rate?: number
          taxable?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          booking_id: string | null
          cgst: number
          code: string | null
          created_at: string
          currency: string
          customer_id: string | null
          discount: number
          due_date: string | null
          gst_mode: string
          id: string
          igst: number
          invoice_date: string
          itinerary_id: string | null
          lead_id: string | null
          notes: string | null
          owner_id: string | null
          place_of_supply: string | null
          quotation_id: string | null
          sgst: number
          status: string
          subtotal: number
          tenant_id: string
          terms: string | null
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          booking_id?: string | null
          cgst?: number
          code?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          discount?: number
          due_date?: string | null
          gst_mode?: string
          id?: string
          igst?: number
          invoice_date?: string
          itinerary_id?: string | null
          lead_id?: string | null
          notes?: string | null
          owner_id?: string | null
          place_of_supply?: string | null
          quotation_id?: string | null
          sgst?: number
          status?: string
          subtotal?: number
          tenant_id: string
          terms?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          booking_id?: string | null
          cgst?: number
          code?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          discount?: number
          due_date?: string | null
          gst_mode?: string
          id?: string
          igst?: number
          invoice_date?: string
          itinerary_id?: string | null
          lead_id?: string | null
          notes?: string | null
          owner_id?: string | null
          place_of_supply?: string | null
          quotation_id?: string | null
          sgst?: number
          status?: string
          subtotal?: number
          tenant_id?: string
          terms?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      itineraries: {
        Row: {
          adults: number
          basic_cost: number
          cancellation_policy: string | null
          cgst_rate: number
          children: number
          code: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          confirmed_via: string | null
          costing_type: string
          cover_url: string | null
          created_at: string
          currency: string
          customer_id: string | null
          description: string | null
          destinations: string[]
          end_date: string | null
          exclusions: string | null
          git_costing: Json
          gst_apply_on: string | null
          hotel_category: string | null
          id: string
          important_notes: string | null
          inclusions: string | null
          infants: number
          interests: string[]
          lead_id: string | null
          markup_type: string
          markup_value: number
          meal_plan: string | null
          nights: number | null
          owner_id: string | null
          package_option: string | null
          package_type: string | null
          payment_policy: string | null
          per_adult: number
          per_child: number
          per_infant: number
          portal_token: string | null
          quotation_id: string | null
          sgst_rate: number
          slot_id: string | null
          slots: Json
          source_template_id: string | null
          start_date: string | null
          status: string
          tax_rate: number
          tcs_rate: number
          tenant_id: string
          terms_blocks: Json
          title: string
          total_cost: number
          total_price: number
          travel_style: string | null
          updated_at: string
        }
        Insert: {
          adults?: number
          basic_cost?: number
          cancellation_policy?: string | null
          cgst_rate?: number
          children?: number
          code?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          confirmed_via?: string | null
          costing_type?: string
          cover_url?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          description?: string | null
          destinations?: string[]
          end_date?: string | null
          exclusions?: string | null
          git_costing?: Json
          gst_apply_on?: string | null
          hotel_category?: string | null
          id?: string
          important_notes?: string | null
          inclusions?: string | null
          infants?: number
          interests?: string[]
          lead_id?: string | null
          markup_type?: string
          markup_value?: number
          meal_plan?: string | null
          nights?: number | null
          owner_id?: string | null
          package_option?: string | null
          package_type?: string | null
          payment_policy?: string | null
          per_adult?: number
          per_child?: number
          per_infant?: number
          portal_token?: string | null
          quotation_id?: string | null
          sgst_rate?: number
          slot_id?: string | null
          slots?: Json
          source_template_id?: string | null
          start_date?: string | null
          status?: string
          tax_rate?: number
          tcs_rate?: number
          tenant_id: string
          terms_blocks?: Json
          title?: string
          total_cost?: number
          total_price?: number
          travel_style?: string | null
          updated_at?: string
        }
        Update: {
          adults?: number
          basic_cost?: number
          cancellation_policy?: string | null
          cgst_rate?: number
          children?: number
          code?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          confirmed_via?: string | null
          costing_type?: string
          cover_url?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          description?: string | null
          destinations?: string[]
          end_date?: string | null
          exclusions?: string | null
          git_costing?: Json
          gst_apply_on?: string | null
          hotel_category?: string | null
          id?: string
          important_notes?: string | null
          inclusions?: string | null
          infants?: number
          interests?: string[]
          lead_id?: string | null
          markup_type?: string
          markup_value?: number
          meal_plan?: string | null
          nights?: number | null
          owner_id?: string | null
          package_option?: string | null
          package_type?: string | null
          payment_policy?: string | null
          per_adult?: number
          per_child?: number
          per_infant?: number
          portal_token?: string | null
          quotation_id?: string | null
          sgst_rate?: number
          slot_id?: string | null
          slots?: Json
          source_template_id?: string | null
          start_date?: string | null
          status?: string
          tax_rate?: number
          tcs_rate?: number
          tenant_id?: string
          terms_blocks?: Json
          title?: string
          total_cost?: number
          total_price?: number
          travel_style?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itineraries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itineraries_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itineraries_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itineraries_source_template_id_fkey"
            columns: ["source_template_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itineraries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_days: {
        Row: {
          created_at: string
          day_date: string | null
          day_no: number
          description: string | null
          id: string
          image_url: string | null
          itinerary_id: string
          location: string | null
          subtitle: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          day_date?: string | null
          day_no: number
          description?: string | null
          id?: string
          image_url?: string | null
          itinerary_id: string
          location?: string | null
          subtitle?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          day_date?: string | null
          day_no?: number
          description?: string | null
          id?: string
          image_url?: string | null
          itinerary_id?: string
          location?: string | null
          subtitle?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_days_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_services: {
        Row: {
          address: string | null
          checkin_time: string | null
          checkout_time: string | null
          cost: number
          created_at: string
          day_id: string | null
          description: string | null
          id: string
          image_url: string | null
          itinerary_id: string
          markup: number
          meta: Json
          price: number
          qty: number
          service_type: string
          sort_order: number
          supplier: string | null
          title: string
        }
        Insert: {
          address?: string | null
          checkin_time?: string | null
          checkout_time?: string | null
          cost?: number
          created_at?: string
          day_id?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          itinerary_id: string
          markup?: number
          meta?: Json
          price?: number
          qty?: number
          service_type: string
          sort_order?: number
          supplier?: string | null
          title: string
        }
        Update: {
          address?: string | null
          checkin_time?: string | null
          checkout_time?: string | null
          cost?: number
          created_at?: string
          day_id?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          itinerary_id?: string
          markup?: number
          meta?: Json
          price?: number
          qty?: number
          service_type?: string
          sort_order?: number
          supplier?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_services_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "itinerary_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_services_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          adults: number | null
          children: number | null
          code: string | null
          company: string | null
          created_at: string
          custom_fields: Json
          email: string | null
          estimated_value: number | null
          from_location: string | null
          full_name: string
          id: string
          infants: number | null
          next_followup_at: string | null
          nights: number | null
          notes: string | null
          owner_id: string | null
          phone: string | null
          pipeline_id: string | null
          priority: Database["public"]["Enums"]["lead_priority"]
          probability: number | null
          query_type: string | null
          return_date: string | null
          service_type: string | null
          source: string | null
          stage_id: string | null
          tenant_id: string
          to_location: string | null
          travel_date: string | null
          updated_at: string
        }
        Insert: {
          adults?: number | null
          children?: number | null
          code?: string | null
          company?: string | null
          created_at?: string
          custom_fields?: Json
          email?: string | null
          estimated_value?: number | null
          from_location?: string | null
          full_name: string
          id?: string
          infants?: number | null
          next_followup_at?: string | null
          nights?: number | null
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          pipeline_id?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"]
          probability?: number | null
          query_type?: string | null
          return_date?: string | null
          service_type?: string | null
          source?: string | null
          stage_id?: string | null
          tenant_id: string
          to_location?: string | null
          travel_date?: string | null
          updated_at?: string
        }
        Update: {
          adults?: number | null
          children?: number | null
          code?: string | null
          company?: string | null
          created_at?: string
          custom_fields?: Json
          email?: string | null
          estimated_value?: number | null
          from_location?: string | null
          full_name?: string
          id?: string
          infants?: number | null
          next_followup_at?: string | null
          nights?: number | null
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          pipeline_id?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"]
          probability?: number | null
          query_type?: string | null
          return_date?: string | null
          service_type?: string | null
          source?: string | null
          stage_id?: string | null
          tenant_id?: string
          to_location?: string | null
          travel_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string
          from_date: string
          id: string
          leave_type: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tenant_id: string
          to_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          from_date: string
          id?: string
          leave_type?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tenant_id: string
          to_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          from_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tenant_id?: string
          to_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      login_events: {
        Row: {
          created_at: string
          event: string
          id: string
          ip: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event?: string
          id?: string
          ip?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          ip?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "login_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_messages: {
        Row: {
          body: string | null
          cc_addrs: string[] | null
          created_at: string
          direction: string
          from_addr: string | null
          id: string
          lead_id: string | null
          owner_id: string | null
          sent_at: string | null
          status: string
          subject: string | null
          tenant_id: string
          to_addrs: string[] | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          cc_addrs?: string[] | null
          created_at?: string
          direction?: string
          from_addr?: string | null
          id?: string
          lead_id?: string | null
          owner_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          tenant_id: string
          to_addrs?: string[] | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          cc_addrs?: string[] | null
          created_at?: string
          direction?: string
          from_addr?: string | null
          id?: string
          lead_id?: string | null
          owner_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          tenant_id?: string
          to_addrs?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mail_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mail_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_settings: {
        Row: {
          data: Json
          tenant_id: string
          updated_at: string
        }
        Insert: {
          data?: Json
          tenant_id: string
          updated_at?: string
        }
        Update: {
          data?: Json
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      masters_items: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          description: string | null
          duration: string | null
          id: string
          image_url: string | null
          kind: string
          location: string | null
          meta: Json
          name: string
          owner_id: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          image_url?: string | null
          kind: string
          location?: string | null
          meta?: Json
          name: string
          owner_id?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          image_url?: string | null
          kind?: string
          location?: string | null
          meta?: Json
          name?: string
          owner_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "masters_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      masters_prices: {
        Row: {
          created_at: string
          currency: string
          id: string
          item_id: string
          label: string
          notes: string | null
          price: number
          tenant_id: string
          updated_at: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          item_id: string
          label: string
          notes?: string | null
          price?: number
          tenant_id: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          item_id?: string
          label?: string
          notes?: string | null
          price?: number
          tenant_id?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "masters_prices_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "masters_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "masters_prices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          body: string
          color: string | null
          created_at: string
          id: string
          owner_id: string | null
          pinned: boolean
          tags: string[] | null
          tenant_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string
          color?: string | null
          created_at?: string
          id?: string
          owner_id?: string | null
          pinned?: boolean
          tags?: string[] | null
          tenant_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          color?: string | null
          created_at?: string
          id?: string
          owner_id?: string | null
          pinned?: boolean
          tags?: string[] | null
          tenant_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          href: string | null
          id: string
          kind: string
          read_at: string | null
          tenant_id: string
          title: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          kind?: string
          read_at?: string | null
          tenant_id: string
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          kind?: string
          read_at?: string | null
          tenant_id?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      org_smtp_config: {
        Row: {
          created_at: string
          from_email: string | null
          from_name: string | null
          reply_to_email: string | null
          smtp_encryption: string | null
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_username: string | null
          status: string
          tenant_id: string
          test_email: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_email?: string | null
          from_name?: string | null
          reply_to_email?: string | null
          smtp_encryption?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          status?: string
          tenant_id: string
          test_email?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_email?: string | null
          from_name?: string | null
          reply_to_email?: string | null
          smtp_encryption?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          status?: string
          tenant_id?: string
          test_email?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_smtp_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      package_terms_blocks: {
        Row: {
          content: string
          created_at: string
          heading: string
          id: string
          is_default: boolean
          sort_order: number
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          heading: string
          id?: string
          is_default?: boolean
          sort_order?: number
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          heading?: string
          id?: string
          is_default?: boolean
          sort_order?: number
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_terms_blocks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          bank_account_id: string | null
          bank_name: string | null
          cheque_date: string | null
          cheque_no: string | null
          comment: string | null
          created_at: string
          currency: string
          customer_id: string | null
          due_date: string | null
          exchange_rate: number
          id: string
          invoice_id: string | null
          mode: string
          notes: string | null
          paid_at: string
          payer_name: string | null
          proof_url: string | null
          reference: string | null
          reminder: boolean
          reminder_days: number
          status: string
          tenant_id: string
          txn_fee: number
        }
        Insert: {
          amount?: number
          bank_account_id?: string | null
          bank_name?: string | null
          cheque_date?: string | null
          cheque_no?: string | null
          comment?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          due_date?: string | null
          exchange_rate?: number
          id?: string
          invoice_id?: string | null
          mode?: string
          notes?: string | null
          paid_at?: string
          payer_name?: string | null
          proof_url?: string | null
          reference?: string | null
          reminder?: boolean
          reminder_days?: number
          status?: string
          tenant_id: string
          txn_fee?: number
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          bank_name?: string | null
          cheque_date?: string | null
          cheque_no?: string | null
          comment?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          due_date?: string | null
          exchange_rate?: number
          id?: string
          invoice_id?: string | null
          mode?: string
          notes?: string | null
          paid_at?: string
          payer_name?: string | null
          proof_url?: string | null
          reference?: string | null
          reminder?: boolean
          reminder_days?: number
          status?: string
          tenant_id?: string
          txn_fee?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          pipeline_id: string
          probability: number
          sort_order: number
          tenant_id: string
          type: Database["public"]["Enums"]["stage_type"]
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          pipeline_id: string
          probability?: number
          sort_order?: number
          tenant_id: string
          type?: Database["public"]["Enums"]["stage_type"]
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          pipeline_id?: string
          probability?: number
          sort_order?: number
          tenant_id?: string
          type?: Database["public"]["Enums"]["stage_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_stages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          sort_order: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          sort_order?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          sort_order?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipelines_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_broadcasts: {
        Row: {
          active: boolean
          body: string
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          kind: string
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          body?: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          kind?: string
          starts_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          body?: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          kind?: string
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          currency: string
          id: string
          invoice_id: string | null
          mode: string
          note: string | null
          paid_on: string
          period_end: string | null
          period_start: string | null
          reference: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          invoice_id?: string | null
          mode?: string
          note?: string | null
          paid_on?: string
          period_end?: string | null
          period_start?: string | null
          reference?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          invoice_id?: string | null
          mode?: string
          note?: string | null
          paid_on?: string
          period_end?: string | null
          period_start?: string | null
          reference?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "billing_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          branch_id: string | null
          created_at: string
          crm_profile_id: string | null
          crm_role_id: string | null
          display_name: string | null
          email: string | null
          first_name: string | null
          id: string
          job_title: string | null
          language: string | null
          last_name: string | null
          phone: string | null
          status: string
          tenant_id: string | null
          time_zone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          branch_id?: string | null
          created_at?: string
          crm_profile_id?: string | null
          crm_role_id?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          job_title?: string | null
          language?: string | null
          last_name?: string | null
          phone?: string | null
          status?: string
          tenant_id?: string | null
          time_zone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          branch_id?: string | null
          created_at?: string
          crm_profile_id?: string | null
          crm_role_id?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          job_title?: string | null
          language?: string | null
          last_name?: string | null
          phone?: string | null
          status?: string
          tenant_id?: string | null
          time_zone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          discount: number
          id: string
          meta: Json
          qty: number
          quotation_id: string
          rate: number
          service_type: string | null
          sort_order: number
          supplier: string | null
          tax_amount: number
          tax_rate: number
          taxable: number
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          discount?: number
          id?: string
          meta?: Json
          qty?: number
          quotation_id: string
          rate?: number
          service_type?: string | null
          sort_order?: number
          supplier?: string | null
          tax_amount?: number
          tax_rate?: number
          taxable?: number
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          discount?: number
          id?: string
          meta?: Json
          qty?: number
          quotation_id?: string
          rate?: number
          service_type?: string | null
          sort_order?: number
          supplier?: string | null
          tax_amount?: number
          tax_rate?: number
          taxable?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          code: string | null
          created_at: string
          currency: string
          customer_id: string | null
          discount: number
          fx_rate: number
          gst_mode: string
          id: string
          lead_id: string | null
          notes: string | null
          owner_id: string | null
          status: string
          subtotal: number
          tax_amount: number
          tenant_id: string
          terms: string | null
          title: string
          total: number
          updated_at: string
          valid_till: string | null
          version: number
        }
        Insert: {
          code?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          discount?: number
          fx_rate?: number
          gst_mode?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          owner_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tenant_id: string
          terms?: string | null
          title?: string
          total?: number
          updated_at?: string
          valid_till?: string | null
          version?: number
        }
        Update: {
          code?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          discount?: number
          fx_rate?: number
          gst_mode?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          owner_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tenant_id?: string
          terms?: string | null
          title?: string
          total?: number
          updated_at?: string
          valid_till?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          created_at: string
          id: string
          module: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_targets: {
        Row: {
          created_at: string
          currency: string
          id: string
          notes: string | null
          period_month: string
          target_amount: number
          target_bookings: number
          target_leads: number
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          period_month: string
          target_amount?: number
          target_bookings?: number
          target_leads?: number
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          period_month?: string
          target_amount?: number
          target_bookings?: number
          target_leads?: number
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_targets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_communications: {
        Row: {
          body: string | null
          channel: string
          created_at: string
          id: string
          itinerary_id: string | null
          lead_id: string | null
          quotation_id: string | null
          sent_by: string | null
          service_ids: Json
          subject: string | null
          supplier_email: string | null
          supplier_name: string
          supplier_phone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          channel?: string
          created_at?: string
          id?: string
          itinerary_id?: string | null
          lead_id?: string | null
          quotation_id?: string | null
          sent_by?: string | null
          service_ids?: Json
          subject?: string | null
          supplier_email?: string | null
          supplier_name: string
          supplier_phone?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          channel?: string
          created_at?: string
          id?: string
          itinerary_id?: string | null
          lead_id?: string | null
          quotation_id?: string | null
          sent_by?: string | null
          service_ids?: Json
          subject?: string | null
          supplier_email?: string | null
          supplier_name?: string
          supplier_phone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_communications_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_communications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_communications_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_communications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          id: string
          message: string
          priority: string
          replied_at: string | null
          reply: string | null
          requester_email: string | null
          status: string
          subject: string
          tenant_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          priority?: string
          replied_at?: string | null
          reply?: string | null
          requester_email?: string | null
          status?: string
          subject: string
          tenant_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          priority?: string
          replied_at?: string | null
          reply?: string | null
          requester_email?: string | null
          status?: string
          subject?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          checklist: Json
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_at: string | null
          id: string
          labels: Json
          owner_id: string | null
          priority: string
          recurrence: string | null
          related_id: string | null
          related_type: string | null
          reminder_at: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
          watchers: Json
        }
        Insert: {
          assigned_to?: string | null
          checklist?: Json
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          labels?: Json
          owner_id?: string | null
          priority?: string
          recurrence?: string | null
          related_id?: string | null
          related_type?: string | null
          reminder_at?: string | null
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
          watchers?: Json
        }
        Update: {
          assigned_to?: string | null
          checklist?: Json
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          labels?: Json
          owner_id?: string | null
          priority?: string
          recurrence?: string | null
          related_id?: string | null
          related_type?: string | null
          reminder_at?: string | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
          watchers?: Json
        }
        Relationships: []
      }
      tenant_domains: {
        Row: {
          cloudflare_hostname_id: string | null
          created_at: string
          error_message: string | null
          hostname: string
          id: string
          last_checked_at: string | null
          ssl_status: string | null
          status: string
          tenant_id: string
          updated_at: string
          verification_txt_name: string | null
          verification_txt_value: string | null
        }
        Insert: {
          cloudflare_hostname_id?: string | null
          created_at?: string
          error_message?: string | null
          hostname: string
          id?: string
          last_checked_at?: string | null
          ssl_status?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          verification_txt_name?: string | null
          verification_txt_value?: string | null
        }
        Update: {
          cloudflare_hostname_id?: string | null
          created_at?: string
          error_message?: string | null
          hostname?: string
          id?: string
          last_checked_at?: string | null
          ssl_status?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          verification_txt_name?: string | null
          verification_txt_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_domains_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          accent_color: string | null
          address: string | null
          ai_provider_config: Json
          billing_cycle: string
          city: string | null
          country: string | null
          created_at: string
          crm_name: string | null
          currency: string
          description: string | null
          email: string | null
          email_sharing: string
          favicon_url: string | null
          fax: string | null
          features: Json
          gemini_api_key: string | null
          grace_days: number
          gst_no: string | null
          id: string
          id_prefixes: Json | null
          internal_notes: string | null
          invoice_template: string | null
          invoice_terms: string | null
          is_platform_owner: boolean
          itinerary_template: string | null
          last_active_at: string | null
          last_renewal_reminder: string | null
          login_headline: string | null
          login_subtext: string | null
          logo_url: string | null
          mobile: string | null
          name: string
          owner_email: string | null
          pan_no: string | null
          phone: string | null
          plan: string
          plan_price: number
          powered_by_enabled: boolean
          primary_color: string | null
          renewal_date: string | null
          seat_limit: number
          signature_url: string | null
          slug: string
          state: string | null
          subscription_start: string | null
          subscription_status: string
          timezone: string | null
          updated_at: string
          usage_limits: Json
          website: string | null
          whatsapp_ai_config: Json | null
          whatsapp_provider_config: Json
        }
        Insert: {
          accent_color?: string | null
          address?: string | null
          ai_provider_config?: Json
          billing_cycle?: string
          city?: string | null
          country?: string | null
          created_at?: string
          crm_name?: string | null
          currency?: string
          description?: string | null
          email?: string | null
          email_sharing?: string
          favicon_url?: string | null
          fax?: string | null
          features?: Json
          gemini_api_key?: string | null
          grace_days?: number
          gst_no?: string | null
          id?: string
          id_prefixes?: Json | null
          internal_notes?: string | null
          invoice_template?: string | null
          invoice_terms?: string | null
          is_platform_owner?: boolean
          itinerary_template?: string | null
          last_active_at?: string | null
          last_renewal_reminder?: string | null
          login_headline?: string | null
          login_subtext?: string | null
          logo_url?: string | null
          mobile?: string | null
          name: string
          owner_email?: string | null
          pan_no?: string | null
          phone?: string | null
          plan?: string
          plan_price?: number
          powered_by_enabled?: boolean
          primary_color?: string | null
          renewal_date?: string | null
          seat_limit?: number
          signature_url?: string | null
          slug: string
          state?: string | null
          subscription_start?: string | null
          subscription_status?: string
          timezone?: string | null
          updated_at?: string
          usage_limits?: Json
          website?: string | null
          whatsapp_ai_config?: Json | null
          whatsapp_provider_config?: Json
        }
        Update: {
          accent_color?: string | null
          address?: string | null
          ai_provider_config?: Json
          billing_cycle?: string
          city?: string | null
          country?: string | null
          created_at?: string
          crm_name?: string | null
          currency?: string
          description?: string | null
          email?: string | null
          email_sharing?: string
          favicon_url?: string | null
          fax?: string | null
          features?: Json
          gemini_api_key?: string | null
          grace_days?: number
          gst_no?: string | null
          id?: string
          id_prefixes?: Json | null
          internal_notes?: string | null
          invoice_template?: string | null
          invoice_terms?: string | null
          is_platform_owner?: boolean
          itinerary_template?: string | null
          last_active_at?: string | null
          last_renewal_reminder?: string | null
          login_headline?: string | null
          login_subtext?: string | null
          logo_url?: string | null
          mobile?: string | null
          name?: string
          owner_email?: string | null
          pan_no?: string | null
          phone?: string | null
          plan?: string
          plan_price?: number
          powered_by_enabled?: boolean
          primary_color?: string | null
          renewal_date?: string | null
          seat_limit?: number
          signature_url?: string | null
          slug?: string
          state?: string | null
          subscription_start?: string | null
          subscription_status?: string
          timezone?: string | null
          updated_at?: string
          usage_limits?: Json
          website?: string | null
          whatsapp_ai_config?: Json | null
          whatsapp_provider_config?: Json
        }
        Relationships: []
      }
      timeline_events: {
        Row: {
          actor_id: string | null
          amount: number | null
          body: string | null
          created_at: string
          id: string
          kind: string
          lead_id: string | null
          ref_id: string | null
          ref_type: string | null
          tenant_id: string
          title: string
        }
        Insert: {
          actor_id?: string | null
          amount?: number | null
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          lead_id?: string | null
          ref_id?: string | null
          ref_type?: string | null
          tenant_id: string
          title: string
        }
        Update: {
          actor_id?: string | null
          amount?: number | null
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          lead_id?: string | null
          ref_id?: string | null
          ref_type?: string | null
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_packages: {
        Row: {
          base_price: number | null
          category: string | null
          cover_image: string | null
          created_at: string
          currency: string | null
          departures: Json
          destination: string | null
          duration_days: number | null
          duration_nights: number | null
          exclusions: Json
          gallery: Json
          highlights: Json
          id: string
          inclusions: Json
          is_published: boolean
          itinerary: Json
          owner_id: string | null
          pricing_tiers: Json
          seo_description: string | null
          seo_title: string | null
          slug: string
          summary: string | null
          tenant_id: string
          title: string
          type: string | null
          updated_at: string
        }
        Insert: {
          base_price?: number | null
          category?: string | null
          cover_image?: string | null
          created_at?: string
          currency?: string | null
          departures?: Json
          destination?: string | null
          duration_days?: number | null
          duration_nights?: number | null
          exclusions?: Json
          gallery?: Json
          highlights?: Json
          id?: string
          inclusions?: Json
          is_published?: boolean
          itinerary?: Json
          owner_id?: string | null
          pricing_tiers?: Json
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          summary?: string | null
          tenant_id: string
          title: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          base_price?: number | null
          category?: string | null
          cover_image?: string | null
          created_at?: string
          currency?: string | null
          departures?: Json
          destination?: string | null
          duration_days?: number | null
          duration_nights?: number | null
          exclusions?: Json
          gallery?: Json
          highlights?: Json
          id?: string
          inclusions?: Json
          is_published?: boolean
          itinerary?: Json
          owner_id?: string | null
          pricing_tiers?: Json
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          summary?: string | null
          tenant_id?: string
          title?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      usage_counters: {
        Row: {
          metric: string
          period: string
          tenant_id: string
          updated_at: string
          used: number
        }
        Insert: {
          metric: string
          period: string
          tenant_id: string
          updated_at?: string
          used?: number
        }
        Update: {
          metric?: string
          period?: string
          tenant_id?: string
          updated_at?: string
          used?: number
        }
        Relationships: []
      }
      user_email_accounts: {
        Row: {
          created_at: string
          email_address: string
          from_name: string | null
          id: string
          imap_default_folder: string | null
          imap_host: string | null
          imap_password: string | null
          imap_port: number | null
          imap_security: string | null
          imap_status: string
          imap_username: string | null
          provider: string
          smtp_encryption: string | null
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_username: string | null
          status: string
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_address: string
          from_name?: string | null
          id?: string
          imap_default_folder?: string | null
          imap_host?: string | null
          imap_password?: string | null
          imap_port?: number | null
          imap_security?: string | null
          imap_status?: string
          imap_username?: string | null
          provider?: string
          smtp_encryption?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_address?: string
          from_name?: string | null
          id?: string
          imap_default_folder?: string | null
          imap_host?: string | null
          imap_password?: string | null
          imap_port?: number | null
          imap_security?: string | null
          imap_status?: string
          imap_username?: string | null
          provider?: string
          smtp_encryption?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_email_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          amount: number | null
          booking_id: string | null
          code: string
          created_at: string
          currency: string | null
          customer_id: string | null
          details: Json
          id: string
          issued_at: string | null
          location: string | null
          notes: string | null
          owner_id: string | null
          pax_count: number | null
          reference_no: string | null
          status: string
          supplier_name: string | null
          tenant_id: string
          title: string
          travel_date: string | null
          travel_end_date: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          booking_id?: string | null
          code: string
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          details?: Json
          id?: string
          issued_at?: string | null
          location?: string | null
          notes?: string | null
          owner_id?: string | null
          pax_count?: number | null
          reference_no?: string | null
          status?: string
          supplier_name?: string | null
          tenant_id: string
          title: string
          travel_date?: string | null
          travel_end_date?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          booking_id?: string | null
          code?: string
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          details?: Json
          id?: string
          issued_at?: string | null
          location?: string | null
          notes?: string | null
          owner_id?: string | null
          pax_count?: number | null
          reference_no?: string | null
          status?: string
          supplier_name?: string | null
          tenant_id?: string
          title?: string
          travel_date?: string | null
          travel_end_date?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouchers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_entries: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          customer_id: string
          entry_date: string
          entry_type: string
          id: string
          notes: string | null
          owner_id: string | null
          reference_id: string | null
          reference_type: string | null
          source: string
          tenant_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          customer_id: string
          entry_date?: string
          entry_type: string
          id?: string
          notes?: string | null
          owner_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          source: string
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          customer_id?: string
          entry_date?: string
          entry_type?: string
          id?: string
          notes?: string | null
          owner_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          source?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_entries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_settings: {
        Row: {
          destinations: Json
          enabled: boolean
          show_on_dashboard: boolean
          tenant_id: string
          time_slots: Json
          updated_at: string
        }
        Insert: {
          destinations?: Json
          enabled?: boolean
          show_on_dashboard?: boolean
          tenant_id: string
          time_slots?: Json
          updated_at?: string
        }
        Update: {
          destinations?: Json
          enabled?: boolean
          show_on_dashboard?: boolean
          tenant_id?: string
          time_slots?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "weather_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      website_settings: {
        Row: {
          data: Json
          tenant_id: string
          updated_at: string
        }
        Insert: {
          data?: Json
          tenant_id: string
          updated_at?: string
        }
        Update: {
          data?: Json
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          body: string | null
          created_at: string
          direction: string
          id: string
          media_url: string | null
          peer_phone: string
          provider_message_id: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          direction: string
          id?: string
          media_url?: string | null
          peer_phone: string
          provider_message_id?: string | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          direction?: string
          id?: string
          media_url?: string | null
          peer_phone?: string
          provider_message_id?: string | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_sessions: {
        Row: {
          connected_at: string | null
          created_at: string
          daily_cap: number
          device_label: string | null
          hourly_cap: number
          id: string
          last_error: string | null
          last_seen_at: string | null
          phone: string | null
          quiet_end: number
          quiet_start: number
          status: string
          tenant_id: string
          updated_at: string
          warmup_started_at: string | null
        }
        Insert: {
          connected_at?: string | null
          created_at?: string
          daily_cap?: number
          device_label?: string | null
          hourly_cap?: number
          id?: string
          last_error?: string | null
          last_seen_at?: string | null
          phone?: string | null
          quiet_end?: number
          quiet_start?: number
          status?: string
          tenant_id: string
          updated_at?: string
          warmup_started_at?: string | null
        }
        Update: {
          connected_at?: string | null
          created_at?: string
          daily_cap?: number
          device_label?: string | null
          hourly_cap?: number
          id?: string
          last_error?: string | null
          last_seen_at?: string | null
          phone?: string | null
          quiet_end?: number
          quiet_start?: number
          status?: string
          tenant_id?: string
          updated_at?: string
          warmup_started_at?: string | null
        }
        Relationships: []
      }
      whatsapp_webhook_logs: {
        Row: {
          created_at: string
          id: string
          kind: string
          message: string | null
          payload: Json | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          message?: string | null
          payload?: Json | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          message?: string | null
          payload?: Json | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_webhook_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_forms: {
        Row: {
          description: string | null
          id: string | null
          schema: Json | null
          slug: string | null
          tenant_id: string | null
          theme: Json | null
          title: string | null
        }
        Insert: {
          description?: string | null
          id?: string | null
          schema?: Json | null
          slug?: string | null
          tenant_id?: string | null
          theme?: Json | null
          title?: string | null
        }
        Update: {
          description?: string | null
          id?: string | null
          schema?: Json | null
          slug?: string | null
          tenant_id?: string | null
          theme?: Json | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      public_tour_packages: {
        Row: {
          base_price: number | null
          category: string | null
          cover_image: string | null
          created_at: string | null
          currency: string | null
          departures: Json | null
          destination: string | null
          duration_days: number | null
          duration_nights: number | null
          exclusions: Json | null
          gallery: Json | null
          highlights: Json | null
          id: string | null
          inclusions: Json | null
          itinerary: Json | null
          pricing_tiers: Json | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          summary: string | null
          tenant_id: string | null
          title: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          base_price?: number | null
          category?: string | null
          cover_image?: string | null
          created_at?: string | null
          currency?: string | null
          departures?: Json | null
          destination?: string | null
          duration_days?: number | null
          duration_nights?: number | null
          exclusions?: Json | null
          gallery?: Json | null
          highlights?: Json | null
          id?: string | null
          inclusions?: Json | null
          itinerary?: Json | null
          pricing_tiers?: Json | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          summary?: string | null
          tenant_id?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number | null
          category?: string | null
          cover_image?: string | null
          created_at?: string | null
          currency?: string | null
          departures?: Json | null
          destination?: string | null
          duration_days?: number | null
          duration_nights?: number | null
          exclusions?: Json | null
          gallery?: Json | null
          highlights?: Json | null
          id?: string | null
          inclusions?: Json | null
          itinerary?: Json | null
          pricing_tiers?: Json | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          summary?: string | null
          tenant_id?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      bump_usage: {
        Args: { _delta?: number; _metric: string; _tenant: string }
        Returns: number
      }
      consume_usage: {
        Args: {
          _delta: number
          _limit: number
          _metric: string
          _tenant: string
        }
        Returns: number
      }
      current_tenant_id: { Args: never; Returns: string }
      get_brand_by_hostname: { Args: { _hostname: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      next_doc_code: {
        Args: { _kind: string; _prefix: string; _tenant: string }
        Returns: string
      }
      post_timeline_event: {
        Args: {
          _actor: string
          _amount: number
          _body: string
          _kind: string
          _lead: string
          _ref_id: string
          _ref_type: string
          _tenant: string
          _title: string
        }
        Returns: undefined
      }
      run_billing_cycle: { Args: never; Returns: Json }
      seed_default_package_terms: {
        Args: { _tenant_id: string }
        Returns: undefined
      }
      set_usage: {
        Args: {
          _metric: string
          _period?: string
          _tenant: string
          _used: number
        }
        Returns: number
      }
      tenant_subscription_active: {
        Args: { _tenant_id: string }
        Returns: boolean
      }
    }
    Enums: {
      activity_kind: "note" | "call" | "email" | "whatsapp" | "meeting" | "task"
      activity_status: "pending" | "completed" | "cancelled"
      activity_type: "task" | "call" | "event" | "note"
      app_role: "super_admin" | "admin" | "manager" | "agent"
      assignment_type:
        | "departure"
        | "arrival"
        | "hotel_checkin"
        | "hotel_checkout"
        | "driver"
        | "guide"
        | "activity"
        | "other"
      automation_action:
        | "send_email"
        | "send_whatsapp"
        | "send_sms"
        | "create_task"
        | "update_lead_stage"
      automation_trigger:
        | "lead_created"
        | "lead_stage_changed"
        | "quotation_sent"
        | "quotation_accepted"
        | "booking_created"
        | "invoice_created"
        | "payment_received"
        | "invoice_overdue"
      bill_status: "draft" | "received" | "partial" | "paid" | "cancelled"
      booking_status: "confirmed" | "in_progress" | "completed" | "cancelled"
      comm_channel: "email" | "whatsapp" | "sms"
      comm_status: "queued" | "sent" | "failed"
      doc_resource:
        | "booking"
        | "customer"
        | "lead"
        | "quotation"
        | "invoice"
        | "itinerary"
      doc_type: "passport" | "visa" | "insurance" | "ticket" | "other"
      invoice_status: "draft" | "issued" | "partial" | "paid" | "cancelled"
      lead_priority: "low" | "medium" | "high" | "hot"
      lead_source:
        | "website"
        | "referral"
        | "walk_in"
        | "facebook"
        | "instagram"
        | "google"
        | "whatsapp"
        | "other"
      lead_stage:
        | "new"
        | "contacted"
        | "qualified"
        | "quotation_sent"
        | "negotiation"
        | "won"
        | "lost"
      notification_kind:
        | "invoice_overdue"
        | "quote_expiring"
        | "lead_followup"
        | "payment_received"
        | "info"
      payment_mode:
        | "cash"
        | "upi"
        | "bank_transfer"
        | "card"
        | "cheque"
        | "other"
      portal_resource:
        | "quotation"
        | "invoice"
        | "itinerary"
        | "booking"
        | "customer"
      quotation_status: "draft" | "sent" | "accepted" | "rejected" | "expired"
      stage_type: "open" | "won" | "lost"
      sub_status: "trialing" | "active" | "past_due" | "canceled" | "incomplete"
      wa_direction: "inbound" | "outbound"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      activity_kind: ["note", "call", "email", "whatsapp", "meeting", "task"],
      activity_status: ["pending", "completed", "cancelled"],
      activity_type: ["task", "call", "event", "note"],
      app_role: ["super_admin", "admin", "manager", "agent"],
      assignment_type: [
        "departure",
        "arrival",
        "hotel_checkin",
        "hotel_checkout",
        "driver",
        "guide",
        "activity",
        "other",
      ],
      automation_action: [
        "send_email",
        "send_whatsapp",
        "send_sms",
        "create_task",
        "update_lead_stage",
      ],
      automation_trigger: [
        "lead_created",
        "lead_stage_changed",
        "quotation_sent",
        "quotation_accepted",
        "booking_created",
        "invoice_created",
        "payment_received",
        "invoice_overdue",
      ],
      bill_status: ["draft", "received", "partial", "paid", "cancelled"],
      booking_status: ["confirmed", "in_progress", "completed", "cancelled"],
      comm_channel: ["email", "whatsapp", "sms"],
      comm_status: ["queued", "sent", "failed"],
      doc_resource: [
        "booking",
        "customer",
        "lead",
        "quotation",
        "invoice",
        "itinerary",
      ],
      doc_type: ["passport", "visa", "insurance", "ticket", "other"],
      invoice_status: ["draft", "issued", "partial", "paid", "cancelled"],
      lead_priority: ["low", "medium", "high", "hot"],
      lead_source: [
        "website",
        "referral",
        "walk_in",
        "facebook",
        "instagram",
        "google",
        "whatsapp",
        "other",
      ],
      lead_stage: [
        "new",
        "contacted",
        "qualified",
        "quotation_sent",
        "negotiation",
        "won",
        "lost",
      ],
      notification_kind: [
        "invoice_overdue",
        "quote_expiring",
        "lead_followup",
        "payment_received",
        "info",
      ],
      payment_mode: ["cash", "upi", "bank_transfer", "card", "cheque", "other"],
      portal_resource: [
        "quotation",
        "invoice",
        "itinerary",
        "booking",
        "customer",
      ],
      quotation_status: ["draft", "sent", "accepted", "rejected", "expired"],
      stage_type: ["open", "won", "lost"],
      sub_status: ["trialing", "active", "past_due", "canceled", "incomplete"],
      wa_direction: ["inbound", "outbound"],
    },
  },
} as const
