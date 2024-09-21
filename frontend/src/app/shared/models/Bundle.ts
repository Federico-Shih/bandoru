export type BundleUploadResponse = {
  bandoru_id: string;
  post_urls: PresignedUrlResponse[];
}

export type PresignedUrlResponse = {
  url: string;
  file_id: string;
}
