export type FileDto = {
  filename: string;
}

export type BundleFormDto = {
  files: FileDto[];
  description?: string;
  parent_id?: string;
  private: boolean;
}
