export type FileDto = {
  filename: string;
  bundleText: string;
}

export type PossibleFileDto = {
  fileName: string | null | undefined;
  bundleText: string | null | undefined;
}

export const fromPartialFile = ({ fileName, bundleText }: PossibleFileDto): FileDto => {
  return {
    filename: fileName ?? '',
    bundleText: bundleText ?? '',
  }
}

export type BundleFormDto = {
  files: FileDto[];
  description?: string;
  parent_id?: string;
  private: boolean;
}
