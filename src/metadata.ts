export interface MediaMetadata {
  id?: number | string;
  title: string;
  overview?: string;
  year?: number;
  poster?: string;
}

export interface MetadataFetcher {
  fetchByTMDBId(tmdbId: number): Promise<MediaMetadata | null>;
  searchByTitle(title: string): Promise<MediaMetadata[]>;
}

export class MockMetadataFetcher implements MetadataFetcher {
  async fetchByTMDBId(tmdbId: number) {
    return {
      id: tmdbId,
      title: `Mock Movie ${tmdbId}`,
      overview: "This is a mocked movie for tests",
      year: 2020,
    };
  }

  async searchByTitle(title: string) {
    return [
      { id: 1, title: `${title} (result 1)`, overview: "mock", year: 2019 },
    ];
  }
}
