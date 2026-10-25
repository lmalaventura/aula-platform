export type ResourceCategory = Readonly<{
  id: string;
  title: string;
}>;

export type StudyResource = Readonly<{
  id: string;
  subjectSlug: string;
  categoryId: string;
  title: string;
  description: string;
  authors: readonly string[];
  academicYear: string;
  status: string;
  provenance: string;
  reviewNote: string;
  version: string | null;
  updatedAt: string | null;
  fileUrl: string;
  pageCount: number;
  byteSize: number;
}>;
