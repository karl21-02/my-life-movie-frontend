export type OstTrack = {
  title: string;
  artist: string;
  spotifyUrl?: string;
};

export type SimilarMovie = {
  id: number;
  title: string;
  thumbnail: string;
  externalUrl?: string;
  provider?: string;
};

export type Movie = {
  id: number;
  title: string;
  description: string;
  thumbnail?: string;
  genre: string;
  sentiment: string;
  status: string;
  outputUrl?: string;
  thumbnailUrl?: string;
  ost: OstTrack[];
  similarMovies: SimilarMovie[];
};

export type MovieSummary = Pick<
  Movie,
  "id" | "title" | "thumbnail" | "genre" | "status" | "outputUrl" | "thumbnailUrl"
>;

export type GenerationStatus = {
  movieId: number;
  jobId: number;
  status: string;
  progress: number;
  outputUrl?: string;
  thumbnailUrl?: string;
  errorCode?: string;
  errorMessage?: string;
};
