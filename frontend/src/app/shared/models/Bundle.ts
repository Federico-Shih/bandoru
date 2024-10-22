export type BundleUploadResponse = {
  bandoru_id: string;
  post_urls: PresignedUrlResponse[];
}

export type PresignedUrlResponse = {
  url: string;
  fields: Record<string, string>
}

export type BundleGetResponse = {
  id: string;
  parent_id?: string;
  description?: string;
  files: BundleFileGetResponse[];
  created_at: Date;
  last_modified: Date;
}

export type BundleFileGetResponse = {
  id: string;
  filename: string;
  url?: string;
}
