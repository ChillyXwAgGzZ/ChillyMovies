export { MockDownloader, Downloader, DownloadJob } from "./downloader";
export { MockMetadataFetcher, MetadataFetcher, MediaMetadata } from "./metadata";
export { StorageManager } from "./storage";
export { withRetry } from "./retry";
export { info, error } from "./logger";

export class Backend {
  downloader: any;
  metadata: any;
  storage: any;

  constructor(opts: { downloader: any; metadata: any; storage: any }) {
    this.downloader = opts.downloader;
    this.metadata = opts.metadata;
    this.storage = opts.storage;
  }

  async startDownload(job: any) {
    await this.downloader.start(job);
  }
}
