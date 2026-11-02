import type { StudyJob, StudyJobSummary } from "../study/web-types.ts";

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
      aula_contributors: { Row: { user_id: string; enabled: boolean }; Insert: never; Update: never; Relationships: [] };
      aula_study_jobs: { Row: StudyJob; Insert: never; Update: never; Relationships: [] };
    };
    Views: { aula_study_latest: { Row: StudyJobSummary; Relationships: [] } };
    Functions: {
      aula_can_contribute: { Args: Record<string, never>; Returns: boolean };
      aula_complete_upload: { Args: { upload_id: string }; Returns: undefined };
      aula_delete_upload: { Args: { upload_id: string }; Returns: undefined };
      aula_claim_study_job: { Args: { p_upload_id: string; p_owner_id: string; p_version: string }; Returns: { job: StudyJob; claimed: boolean } };
      aula_finish_study_job: { Args: { p_job_id: string; p_status: string; p_error: string | null; p_kit: unknown }; Returns: boolean };
    };
    Enums: { [K in never]: never };
    CompositeTypes: { [K in never]: never };
  };
};
