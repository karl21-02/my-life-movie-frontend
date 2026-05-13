import { MoviesClient } from "@/app/movies/MoviesClient";

export const metadata = {
  title: "내 영화 목록 | My Life Movie",
};

export default function MoviesPage() {
  return <MoviesClient />;
}
