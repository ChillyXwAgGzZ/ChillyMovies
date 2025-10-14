export interface StartDownloadRequest {
  id: string;
  sourceType: "torrent" | "youtube" | "http" | "local";
  sourceUrn: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StatusResponse {
  id: string;
  status: string;
  progress?: { percent: number; bytesDownloaded: number };
}
