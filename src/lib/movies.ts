import { apiClient } from "@/lib/api";
import type { Movie, MovieSummary } from "@/types/movie";

// TODO: 백엔드 API 연동 시 mock 데이터 제거 후 apiClient 호출로 교체
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_MOVIES !== "false";
const MOVIES_API_BASE_PATH = "/api/movies";

const mockMovies: Movie[] = [
  {
    id: 1,
    title: "나의 로맨틱 코드 여정",
    description:
      "새벽까지 이어지는 디버깅 세션, 동료들과 나눈 진솔한 대화, 그리고 배포가 성공하던 순간의 짜릿함. 코드 한 줄 한 줄에 녹아든 나의 이야기를 담은 따뜻한 성장 로맨스.",
    thumbnail: "https://picsum.photos/seed/movie1/400/600",
    genre: "로맨스",
    sentiment: "따뜻함",
    ost: [
      { title: "Dynamite", artist: "BTS", spotifyUrl: "https://open.spotify.com/track/0t1kP63rueHleOhQkYSXFY" },
      { title: "좋은 날", artist: "아이유", spotifyUrl: "https://open.spotify.com/track/1rfofaqEpACxVEHIZBJe6W" },
    ],
    similarMovies: [
      { id: 2, title: "청춘의 기록", thumbnail: "https://picsum.photos/seed/movie2/400/600" },
      { id: 3, title: "소울 사운드트랙", thumbnail: "https://picsum.photos/seed/movie3/400/600" },
    ],
  },
  {
    id: 2,
    title: "청춘의 기록",
    description:
      "스물셋, 첫 사회생활의 두려움과 설렘. 카카오톡 대화창에 가득 찬 친구들과의 일상, 이력서를 고쳐 쓰며 보낸 밤들. 그 모든 순간이 모여 완성된 나만의 청춘 드라마.",
    thumbnail: "https://picsum.photos/seed/movie2/400/600",
    genre: "드라마",
    sentiment: "설렘",
    ost: [
      { title: "Feel Good", artist: "Dua Lipa" },
      { title: "봄날", artist: "BTS", spotifyUrl: "https://open.spotify.com/track/5rSoHSXqYZfSGDNLh2VqJF" },
    ],
    similarMovies: [
      { id: 1, title: "나의 로맨틱 코드 여정", thumbnail: "https://picsum.photos/seed/movie1/400/600" },
      { id: 3, title: "소울 사운드트랙", thumbnail: "https://picsum.photos/seed/movie3/400/600" },
    ],
  },
  {
    id: 3,
    title: "소울 사운드트랙",
    description:
      "Spotify 플레이리스트에 담긴 800곡의 이야기. 슬플 때 들었던 곡, 달릴 때 들었던 비트, 새벽 감성으로 반복 재생했던 그 노래들이 만들어낸 나만의 음악 영화.",
    thumbnail: "https://picsum.photos/seed/movie3/400/600",
    genre: "뮤지컬",
    sentiment: "그리움",
    ost: [
      { title: "Blinding Lights", artist: "The Weeknd" },
      { title: "Celebrity", artist: "아이유" },
    ],
    similarMovies: [
      { id: 1, title: "나의 로맨틱 코드 여정", thumbnail: "https://picsum.photos/seed/movie1/400/600" },
      { id: 2, title: "청춘의 기록", thumbnail: "https://picsum.photos/seed/movie2/400/600" },
    ],
  },
];

export async function getMovies(): Promise<MovieSummary[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return mockMovies.map(({ id, title, thumbnail, genre }) => ({
      id,
      title,
      thumbnail,
      genre,
    }));
  }
  return apiClient<MovieSummary[]>(MOVIES_API_BASE_PATH);
}

export async function getMovie(id: number): Promise<Movie> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    const movie = mockMovies.find((m) => m.id === id);
    if (!movie) throw new Error("Movie not found");
    return movie;
  }
  return apiClient<Movie>(`${MOVIES_API_BASE_PATH}/${id}`);
}

export async function deleteMovie(id: number): Promise<void> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return;
  }
  return apiClient<void>(`${MOVIES_API_BASE_PATH}/${id}`, { method: "DELETE" });
}

export async function downloadMovie(id: number): Promise<{ message: string }> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return { message: "다운로드가 준비되었습니다." };
  }
  return apiClient<{ message: string }>(`${MOVIES_API_BASE_PATH}/${id}/download`);
}

export async function shareMovie(id: number): Promise<{ share_url: string; message: string }> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    const share_url = `${window.location.origin}/movies/${id}`;
    return { share_url, message: "공유 링크가 생성되었습니다." };
  }
  return apiClient<{ share_url: string; message: string }>(`${MOVIES_API_BASE_PATH}/${id}/share`, {
    method: "POST",
  });
}
