import { notFound } from "next/navigation";

import { MovieDetailClient } from "@/app/movies/[id]/MovieDetailClient";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "영화 상세 | My Life Movie",
};

export default async function MovieDetailPage({ params }: Props) {
  const { id } = await params;
  const movieId = Number(id);

  if (!Number.isInteger(movieId) || movieId <= 0) {
    notFound();
  }

  return <MovieDetailClient movieId={movieId} />;
}
