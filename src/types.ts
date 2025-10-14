export type UUID = string;

export interface Progress {
  percent: number;
  bytesDownloaded: number;
  speedBytesPerSec?: number;
}
