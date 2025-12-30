export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          company_name: string | null
          avatar_url: string | null
          phone: string | null
          timezone: string | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          subscription_tier: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          stripe_customer_id: string | null
          monthly_message_limit: number | null
          monthly_messages_used: number | null
          reset_date: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          company_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          timezone?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          subscription_tier?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          stripe_customer_id?: string | null
          monthly_message_limit?: number | null
          monthly_messages_used?: number | null
          reset_date?: string | null
        }
        Update: {
          email?: string
          full_name?: string | null
          company_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          timezone?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          subscription_tier?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          stripe_customer_id?: string | null
          monthly_message_limit?: number | null
          monthly_messages_used?: number | null
          reset_date?: string | null
        }
      }
      agents: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          avatar_url: string | null
          website_url: string | null
          ai_model: string | null
          temperature: number | null
          max_tokens: number | null
          system_prompt: string | null
          welcome_message: string | null
          tone: string | null
          language: string | null
          custom_instructions: string | null
          enable_sentiment_analysis: boolean | null
          enable_lead_capture: boolean | null
          lead_capture_fields: Json | null
          lead_capture_trigger: string | null
          primary_color: string | null
          widget_position: string | null
          widget_size: string | null
          show_branding: boolean | null
          is_published: boolean | null
          public_url: string | null
          embed_code: string | null
          allowed_domains: string[] | null
          total_conversations: number | null
          total_messages: number | null
          total_leads: number | null
          average_sentiment: number | null
          status: string | null
          created_at: string | null
          updated_at: string | null
          last_message_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          avatar_url?: string | null
          website_url?: string | null
          ai_model?: string | null
          temperature?: number | null
          max_tokens?: number | null
          system_prompt?: string | null
          welcome_message?: string | null
          tone?: string | null
          language?: string | null
          custom_instructions?: string | null
          enable_sentiment_analysis?: boolean | null
          enable_lead_capture?: boolean | null
          lead_capture_fields?: Json | null
          lead_capture_trigger?: string | null
          primary_color?: string | null
          widget_position?: string | null
          widget_size?: string | null
          show_branding?: boolean | null
          is_published?: boolean | null
          public_url?: string | null
          embed_code?: string | null
          allowed_domains?: string[] | null
        }
        Update: {
          name?: string
          description?: string | null
          avatar_url?: string | null
          website_url?: string | null
          ai_model?: string | null
          temperature?: number | null
          max_tokens?: number | null
          system_prompt?: string | null
          welcome_message?: string | null
          tone?: string | null
          language?: string | null
          custom_instructions?: string | null
          enable_sentiment_analysis?: boolean | null
          enable_lead_capture?: boolean | null
          lead_capture_fields?: Json | null
          lead_capture_trigger?: string | null
          primary_color?: string | null
          widget_position?: string | null
          widget_size?: string | null
          show_branding?: boolean | null
          is_published?: boolean | null
          public_url?: string | null
          embed_code?: string | null
          allowed_domains?: string[] | null
          status?: string | null
        }
      }
      conversations: {
        Row: {
          id: string
          agent_id: string
          visitor_id: string
          visitor_name: string | null
          visitor_email: string | null
          visitor_phone: string | null
          visitor_ip: string | null
          visitor_location: Json | null
          visitor_metadata: Json | null
          source: string | null
          referrer_url: string | null
          current_url: string | null
          status: string | null
          sentiment_score: number | null
          sentiment_label: string | null
          is_lead: boolean | null
          lead_captured_at: string | null
          message_count: number | null
          duration_seconds: number | null
          started_at: string | null
          ended_at: string | null
          created_at: string | null
          updated_at: string | null
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: string
          content: string
          model: string | null
          tokens_used: number | null
          response_time_ms: number | null
          sentiment_score: number | null
          sentiment_label: string | null
          was_corrected: boolean | null
          correction_id: string | null
          feedback_rating: number | null
          metadata: Json | null
          created_at: string | null
        }
      }
      leads: {
        Row: {
          id: string
          agent_id: string
          conversation_id: string | null
          name: string | null
          email: string | null
          phone: string | null
          company: string | null
          custom_fields: Json | null
          source: string | null
          status: string | null
          score: number | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          referrer_url: string | null
          landing_page: string | null
          messages_sent: number | null
          sentiment_score: number | null
          interest_level: string | null
          assigned_to: string | null
          last_contacted_at: string | null
          next_follow_up_at: string | null
          notes: string | null
          tags: string[] | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
      }
      knowledge_sources: {
        Row: {
          id: string
          agent_id: string
          name: string
          type: string
          content: string | null
          file_url: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          url: string | null
          status: string | null
          error_message: string | null
          chunks_count: number | null
          tokens_count: number | null
          auto_sync: boolean | null
          sync_frequency: string | null
          last_synced_at: string | null
          next_sync_at: string | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          agent_id: string
          name: string
          type: string
          content?: string | null
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          url?: string | null
          status?: string | null
          error_message?: string | null
          chunks_count?: number | null
          tokens_count?: number | null
          auto_sync?: boolean | null
          sync_frequency?: string | null
          last_synced_at?: string | null
          next_sync_at?: string | null
          metadata?: Json | null
        }
        Update: {
          agent_id?: string
          name?: string
          type?: string
          content?: string | null
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          url?: string | null
          status?: string | null
          error_message?: string | null
          chunks_count?: number | null
          tokens_count?: number | null
          auto_sync?: boolean | null
          sync_frequency?: string | null
          last_synced_at?: string | null
          next_sync_at?: string | null
          metadata?: Json | null
        }
      }
      knowledge_chunks: {
        Row: {
          id: string
          source_id: string
          agent_id: string
          content: string
          tokens: number | null
          embedding: string | null
          chunk_index: number | null
          metadata: Json | null
          created_at: string | null
        }
      }
      corrections: {
        Row: {
          id: string
          agent_id: string
          message_id: string | null
          conversation_id: string | null
          original_response: string
          corrected_response: string
          reason: string | null
          correction_type: string | null
          user_message: string | null
          conversation_context: Json | null
          status: string | null
          applied_at: string | null
          was_helpful: boolean | null
          feedback_notes: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
      }
      training_examples: {
        Row: {
          id: string
          agent_id: string
          input: string
          expected_output: string
          category: string | null
          tags: string[] | null
          source: string | null
          source_id: string | null
          quality_score: number | null
          times_used: number | null
          success_rate: number | null
          is_active: boolean | null
          metadata: Json | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
      }
      analytics_events: {
        Row: {
          id: string
          agent_id: string
          event_type: string
          event_data: Json | null
          conversation_id: string | null
          visitor_id: string | null
          session_id: string | null
          ip_address: string | null
          user_agent: string | null
          device_type: string | null
          browser: string | null
          os: string | null
          country: string | null
          city: string | null
          metadata: Json | null
          created_at: string | null
        }
      }
      daily_stats: {
        Row: {
          id: string
          agent_id: string
          date: string
          total_conversations: number | null
          active_conversations: number | null
          resolved_conversations: number | null
          avg_conversation_duration: number | null
          total_messages: number | null
          user_messages: number | null
          assistant_messages: number | null
          avg_messages_per_conversation: number | null
          avg_response_time_ms: number | null
          total_leads: number | null
          conversion_rate: number | null
          positive_sentiment_count: number | null
          neutral_sentiment_count: number | null
          negative_sentiment_count: number | null
          avg_sentiment_score: number | null
          widget_opens: number | null
          unique_visitors: number | null
          returning_visitors: number | null
          total_tokens_used: number | null
          total_ai_cost: number | null
          created_at: string | null
          updated_at: string | null
        }
      }
      sentiment_analysis: {
        Row: {
          id: string
          conversation_id: string
          message_id: string | null
          agent_id: string
          overall_score: number
          label: string
          confidence: number | null
          emotions: Json | null
          topics: string[] | null
          keywords: string[] | null
          analyzer_model: string | null
          analyzed_at: string | null
        }
      }
      usage_logs: {
        Row: {
          id: string
          user_id: string
          agent_id: string | null
          usage_type: string
          ai_model: string | null
          prompt_tokens: number | null
          completion_tokens: number | null
          total_tokens: number | null
          unit_cost: number | null
          total_cost: number | null
          conversation_id: string | null
          message_id: string | null
          metadata: Json | null
          created_at: string | null
        }
      }
      monthly_usage_summary: {
        Row: {
          id: string
          user_id: string
          year: number
          month: number
          total_messages: number | null
          total_conversations: number | null
          total_agents: number | null
          total_tokens: number | null
          total_ai_requests: number | null
          total_ai_cost: number | null
          total_knowledge_sources: number | null
          total_knowledge_chunks: number | null
          total_leads: number | null
          total_api_calls: number | null
          message_limit: number | null
          messages_remaining: number | null
          overage_messages: number | null
          created_at: string | null
          updated_at: string | null
        }
      }
      billing_transactions: {
        Row: {
          id: string
          user_id: string
          type: string
          status: string | null
          amount: number
          currency: string | null
          tax_amount: number | null
          total_amount: number
          payment_method: string | null
          payment_provider: string | null
          provider_transaction_id: string | null
          provider_customer_id: string | null
          invoice_number: string | null
          invoice_url: string | null
          subscription_tier: string | null
          billing_period_start: string | null
          billing_period_end: string | null
          description: string | null
          metadata: Json | null
          processed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
      }
      subscription_history: {
        Row: {
          id: string
          user_id: string
          tier: string
          status: string
          monthly_price: number | null
          annual_price: number | null
          billing_cycle: string | null
          started_at: string
          ended_at: string | null
          trial_ends_at: string | null
          next_billing_date: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          created_at: string | null
        }
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          agent_id: string | null
          name: string
          key_hash: string
          key_prefix: string
          scopes: string[] | null
          rate_limit_per_minute: number | null
          rate_limit_per_day: number | null
          is_active: boolean | null
          total_requests: number | null
          last_used_at: string | null
          expires_at: string | null
          created_at: string | null
          updated_at: string | null
        }
      }
      webhooks: {
        Row: {
          id: string
          user_id: string
          agent_id: string | null
          name: string
          url: string
          secret: string | null
          events: string[] | null
          is_active: boolean | null
          retry_failed: boolean | null
          max_retries: number | null
          custom_headers: Json | null
          total_deliveries: number | null
          successful_deliveries: number | null
          failed_deliveries: number | null
          last_delivery_at: string | null
          last_delivery_status: string | null
          created_at: string | null
          updated_at: string | null
        }
      }
      webhook_deliveries: {
        Row: {
          id: string
          webhook_id: string
          event_type: string
          event_data: Json
          status: string | null
          http_status: number | null
          response_body: string | null
          error_message: string | null
          attempt_count: number | null
          next_retry_at: string | null
          delivered_at: string | null
          duration_ms: number | null
          created_at: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          agent_id: string | null
          conversation_id: string | null
          lead_id: string | null
          priority: string | null
          is_read: boolean | null
          read_at: string | null
          action_url: string | null
          action_label: string | null
          metadata: Json | null
          created_at: string | null
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          resource_type: string
          resource_id: string | null
          description: string
          changes: Json | null
          ip_address: string | null
          user_agent: string | null
          metadata: Json | null
          created_at: string | null
        }
      }
      email_logs: {
        Row: {
          id: string
          user_id: string | null
          to_email: string
          from_email: string
          subject: string
          email_type: string
          template_id: string | null
          template_data: Json | null
          status: string | null
          provider: string | null
          provider_message_id: string | null
          error_message: string | null
          sent_at: string | null
          delivered_at: string | null
          opened_at: string | null
          clicked_at: string | null
          created_at: string | null
        }
      }
    }
    Views: {
      agent_dashboard_summary: {
        Row: {
          agent_id: string | null
          user_id: string | null
          agent_name: string | null
          status: string | null
          is_published: boolean | null
          total_conversations: number | null
          total_messages: number | null
          total_leads: number | null
          average_sentiment: number | null
          last_message_at: string | null
          active_conversations: number | null
          new_leads: number | null
          knowledge_sources_count: number | null
          pending_corrections: number | null
        }
      }
      recent_activity: {
        Row: {
          activity_type: string | null
          resource_id: string | null
          agent_id: string | null
          user_id: string | null
          description: string | null
          created_at: string | null
        }
      }
    }
    Functions: {
      match_knowledge_chunks: {
        Args: {
          query_embedding: string
          p_agent_id: string
          match_threshold?: number
          match_count?: number
        }
        Returns: Array<{
          id: string
          content: string
          similarity: number
        }>
      }
      get_agent_analytics: {
        Args: {
          p_agent_id: string
          p_start_date?: string
          p_end_date?: string
        }
        Returns: Array<{
          total_conversations: number
          total_messages: number
          total_leads: number
          avg_sentiment: number
          positive_count: number
          neutral_count: number
          negative_count: number
          avg_response_time: number
          conversion_rate: number
        }>
      }
      get_current_usage: {
        Args: {
          p_user_id: string
        }
        Returns: Array<{
          messages_used: number
          messages_limit: number
          messages_remaining: number
          conversations_count: number
          agents_count: number
          leads_count: number
          storage_used_mb: number
        }>
      }
      get_conversation_with_messages: {
        Args: {
          p_conversation_id: string
        }
        Returns: Json
      }
      create_notification: {
        Args: {
          p_user_id: string
          p_type: string
          p_title: string
          p_message: string
          p_agent_id?: string
          p_priority?: string
        }
        Returns: string
      }
      log_activity: {
        Args: {
          p_user_id: string
          p_action: string
          p_resource_type: string
          p_resource_id: string
          p_description: string
          p_changes?: Json
        }
        Returns: string
      }
      log_usage: {
        Args: {
          p_user_id: string
          p_agent_id: string
          p_usage_type: string
          p_tokens?: number
          p_cost?: number
        }
        Returns: string
      }
      increment_message_usage: {
        Args: {
          p_user_id: string
        }
        Returns: boolean
      }
      reset_monthly_usage: {
        Args: Record<string, never>
        Returns: void
      }
      analyze_sentiment: {
        Args: {
          p_text: string
        }
        Returns: Array<{
          score: number
          label: string
        }>
      }
      search_conversations: {
        Args: {
          p_agent_id: string
          p_search_term?: string
          p_status?: string
          p_start_date?: string
          p_end_date?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: Array<{
          id: string
          visitor_name: string
          visitor_email: string
          status: string
          sentiment_label: string
          message_count: number
          is_lead: boolean
          started_at: string
        }>
      }
    }
  }
}
