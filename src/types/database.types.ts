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
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      answer_keys: {
        Row: {
          answer_id: string
          created_at: string
          created_by: string | null
          id: string
          is_correct: boolean
          question_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          answer_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_correct?: boolean
          question_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          answer_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_correct?: boolean
          question_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "answer_keys_answer_fk"
            columns: ["answer_id", "question_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id", "question_id"]
          },
        ]
      }
      answers: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          question_id: string
          text: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          question_id: string
          text: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          question_id?: string
          text?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          course_id: string
          created_at: string
          created_by: string | null
          id: string
          readable_id: string
          requested_delivery: boolean
          student_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          readable_id?: string
          requested_delivery?: boolean
          student_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          readable_id?: string
          requested_delivery?: boolean
          student_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          owner_id: string | null
          price: number
          published: boolean
          thumbnail_path: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id?: string | null
          price?: number
          published?: boolean
          thumbnail_path?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          price?: number
          published?: boolean
          thumbnail_path?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      module_files: {
        Row: {
          created_at: string
          created_by: string | null
          file_name: string | null
          file_path: string
          id: string
          module_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_path: string
          id?: string
          module_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_path?: string
          id?: string
          module_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_files_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      module_progress: {
        Row: {
          completed: boolean
          created_at: string
          created_by: string | null
          id: string
          module_id: string
          quiz_done: boolean
          student_id: string
          task_done: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          completed?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          module_id: string
          quiz_done?: boolean
          student_id: string
          task_done?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          completed?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          module_id?: string
          quiz_done?: boolean
          student_id?: string
          task_done?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          order: number
          title: string
          updated_at: string
          updated_by: string | null
          video_url: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          order: number
          title: string
          updated_at?: string
          updated_by?: string | null
          video_url?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          order?: number
          title?: string
          updated_at?: string
          updated_by?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          course_id: string
          created_at: string
          created_by: string | null
          id: string
          price: number
          status: Database["public"]["Enums"]["purchase_status"]
          student_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          price: number
          status?: Database["public"]["Enums"]["purchase_status"]
          student_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          price?: number
          status?: Database["public"]["Enums"]["purchase_status"]
          student_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          quiz_id: string
          text: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          quiz_id: string
          text: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          quiz_id?: string
          text?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          module_id: string
          passing_score: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          module_id: string
          passing_score: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          module_id?: string
          passing_score?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: true
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      task_files: {
        Row: {
          created_at: string
          created_by: string | null
          file_name: string | null
          file_path: string
          id: string
          task_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_path: string
          id?: string
          task_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_path?: string
          id?: string
          task_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_files_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_messages: {
        Row: {
          attachment_path: string | null
          body: string
          created_at: string
          created_by: string | null
          id: string
          sender_id: string
          submission_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          attachment_path?: string | null
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          sender_id: string
          submission_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          attachment_path?: string | null
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          sender_id?: string
          submission_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_messages_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "task_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      task_submissions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          status: Database["public"]["Enums"]["task_submission_status"]
          student_id: string
          task_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          status?: Database["public"]["Enums"]["task_submission_status"]
          student_id: string
          task_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          status?: Database["public"]["Enums"]["task_submission_status"]
          student_id?: string
          task_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          module_id: string
          text: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          module_id: string
          text: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          module_id?: string
          text?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: true
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_module: { Args: { p_module_id: string }; Returns: boolean }
      can_access_question: { Args: { p_question_id: string }; Returns: boolean }
      can_access_quiz: { Args: { p_quiz_id: string }; Returns: boolean }
      can_access_task: { Args: { p_task_id: string }; Returns: boolean }
      can_author_course: { Args: { p_course_id: string }; Returns: boolean }
      can_author_module: { Args: { p_module_id: string }; Returns: boolean }
      can_author_question: { Args: { p_question_id: string }; Returns: boolean }
      can_author_quiz: { Args: { p_quiz_id: string }; Returns: boolean }
      can_author_task: { Args: { p_task_id: string }; Returns: boolean }
      can_review_submission: {
        Args: { p_submission_id: string }
        Returns: boolean
      }
      has_approved_purchase: { Args: { p_course_id: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      is_teacher: { Args: never; Returns: boolean }
      next_certificate_readable_id: { Args: never; Returns: string }
      owns_course: { Args: { p_course_id: string }; Returns: boolean }
      owns_submission: { Args: { p_submission_id: string }; Returns: boolean }
      safe_uuid: { Args: { p_value: string }; Returns: string }
      teaches_student: { Args: { p_student_id: string }; Returns: boolean }
    }
    Enums: {
      purchase_status: "requested" | "denied" | "approved"
      task_submission_status: "pending" | "needs_revision" | "approved"
      user_role: "admin" | "student" | "teacher"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      purchase_status: ["requested", "denied", "approved"],
      task_submission_status: ["pending", "needs_revision", "approved"],
      user_role: ["admin", "student", "teacher"],
    },
  },
} as const
