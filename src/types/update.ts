export interface AppVersion {
  version: string;
  download_url: string;
  forceUpdate: boolean;
  created_at: string;
}

export interface AppVersionError {
  success: boolean;
  message: string;
}
