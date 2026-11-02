export type Upload = {
  id: string;
  owner_id: string;
  subject_slug: string;
  title: string;
  author_name: string;
  original_name: string;
  byte_size: number;
  sha256: string;
  rights_confirmed: boolean;
  object_path: string;
  status: "uploading" | "stored";
  created_at: string;
};

export type UploadInsert = Pick<Upload,
  "id" | "subject_slug" | "title" | "author_name" | "original_name" | "byte_size" | "sha256" | "rights_confirmed"
>;

// Contratto del piccolo schema SQL, senza CLI o generazione di tipi obbligatorie.
export type UploadDatabase = {
  public: {
    Tables: {
      aula_uploads: { Row: Upload; Insert: UploadInsert; Update: never; Relationships: [] };
    };
    Views: { [K in never]: never };
    Functions: {
      aula_can_contribute: { Args: Record<string, never>; Returns: boolean };
      aula_complete_upload: { Args: { upload_id: string }; Returns: undefined };
      aula_delete_upload: { Args: { upload_id: string }; Returns: undefined };
    };
    Enums: { [K in never]: never };
    CompositeTypes: { [K in never]: never };
  };
};
