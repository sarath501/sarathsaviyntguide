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
      bookmarks: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: []
      }
      connector_bookmarks: {
        Row: {
          connector_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          connector_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          connector_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connector_bookmarks_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "connectors"
            referencedColumns: ["id"]
          },
        ]
      }
      connector_progress: {
        Row: {
          connector_id: string
          id: string
          lab_done: boolean
          sections_done: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          connector_id: string
          id?: string
          lab_done?: boolean
          sections_done?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          connector_id?: string
          id?: string
          lab_done?: boolean
          sections_done?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connector_progress_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "connectors"
            referencedColumns: ["id"]
          },
        ]
      }
      connectors: {
        Row: {
          category: string
          content: Json
          created_at: string
          difficulty: string
          id: string
          name: string
          position: number
          published: boolean
          summary: string
          support_type: string
          updated_at: string
        }
        Insert: {
          category: string
          content?: Json
          created_at?: string
          difficulty?: string
          id: string
          name: string
          position?: number
          published?: boolean
          summary?: string
          support_type?: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: Json
          created_at?: string
          difficulty?: string
          id?: string
          name?: string
          position?: number
          published?: boolean
          summary?: string
          support_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      interviews: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          level: string
          score: number | null
          topic: string
          transcript: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          level: string
          score?: number | null
          topic: string
          transcript?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          level?: string
          score?: number | null
          topic?: string
          transcript?: Json
          user_id?: string
        }
        Relationships: []
      }
      labs: {
        Row: {
          area: string
          created_at: string
          difficulty: string
          fix: string
          id: string
          published: boolean
          root_cause: string
          steps: Json
          symptom: string
          title: string
        }
        Insert: {
          area?: string
          created_at?: string
          difficulty?: string
          fix?: string
          id?: string
          published?: boolean
          root_cause?: string
          steps?: Json
          symptom: string
          title: string
        }
        Update: {
          area?: string
          created_at?: string
          difficulty?: string
          fix?: string
          id?: string
          published?: boolean
          root_cause?: string
          steps?: Json
          symptom?: string
          title?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed_at: string
          id: string
          lesson_id: string
          module_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          lesson_id: string
          module_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          lesson_id?: string
          module_id?: string
          user_id?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          content: Json
          created_at: string
          diagram_image_url: string | null
          diagram_key: string | null
          id: string
          module_id: string
          points: Json
          position: number
          published: boolean
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          diagram_image_url?: string | null
          diagram_key?: string | null
          id: string
          module_id: string
          points?: Json
          position?: number
          published?: boolean
          summary?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          diagram_image_url?: string | null
          diagram_key?: string | null
          id?: string
          module_id?: string
          points?: Json
          position?: number
          published?: boolean
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string
          id: string
          level: string
          num: number
          published: boolean
          summary: string
          title: string
        }
        Insert: {
          created_at?: string
          id: string
          level?: string
          num: number
          published?: boolean
          summary?: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          num?: number
          published?: boolean
          summary?: string
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          message: string
          read_at: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          message: string
          read_at?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          message?: string
          read_at?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          experience_level: string
          full_name: string | null
          id: string
          last_lesson_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          experience_level?: string
          full_name?: string | null
          id: string
          last_lesson_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          experience_level?: string
          full_name?: string | null
          id?: string
          last_lesson_id?: string | null
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          created_at: string
          id: string
          is_certification: boolean
          module_id: string
          score: number
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_certification?: boolean
          module_id: string
          score: number
          total: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_certification?: boolean
          module_id?: string
          score?: number
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          correct_index: number
          created_at: string
          difficulty: string
          exam_track: string
          explanation: string
          id: string
          is_certification: boolean
          module_id: string
          options: Json
          question: string
        }
        Insert: {
          correct_index: number
          created_at?: string
          difficulty?: string
          exam_track?: string
          explanation?: string
          id?: string
          is_certification?: boolean
          module_id: string
          options: Json
          question: string
        }
        Update: {
          correct_index?: number
          created_at?: string
          difficulty?: string
          exam_track?: string
          explanation?: string
          id?: string
          is_certification?: boolean
          module_id?: string
          options?: Json
          question?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
