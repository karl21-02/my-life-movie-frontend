"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { isUnauthenticatedError } from "@/features/auth/errors";
import { loadCurrentUser, logoutCurrentUser } from "@/features/auth/session-actions";
import type { AuthUser } from "@/features/auth/types";
import { APP_ROUTES } from "@/lib/routes";

type ProfileState =
  | { status: "loading" }
  | { status: "ready"; user: AuthUser }
  | { status: "unauthenticated" }
  | { status: "error"; message: string };

export function ProfileSummary() {
  const router = useRouter();
  const [state, setState] = useState<ProfileState>({ status: "loading" });
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let ignore = false;

    loadCurrentUser()
      .then((user) => {
        if (!ignore) {
          setState({ status: "ready", user });
        }
      })
      .catch((error: unknown) => {
        if (ignore) {
          return;
        }

        if (isUnauthenticatedError(error)) {
          setState({ status: "unauthenticated" });
          return;
        }

        setState({
          status: "error",
          message: "프로필 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
        });
      });

    return () => {
      ignore = true;
    };
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logoutCurrentUser();
      router.replace(`${APP_ROUTES.auth.login}?next=${encodeURIComponent(APP_ROUTES.profile)}`);
    } catch {
      setState({
        status: "error",
        message: "로그아웃을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.",
      });
      setIsLoggingOut(false);
    }
  }

  if (state.status === "loading") {
    return (
      <section className="max-w-xl rounded-lg border border-zinc-800 bg-zinc-950 p-6">
        <p className="text-sm text-zinc-400">프로필 정보를 불러오는 중입니다.</p>
      </section>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <section className="max-w-xl rounded-lg border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="text-base font-semibold text-zinc-50">로그인이 필요합니다</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          프로필을 확인하려면 먼저 계정으로 로그인해주세요.
        </p>
        <Link
          href={`${APP_ROUTES.auth.login}?next=${encodeURIComponent(APP_ROUTES.profile)}`}
          className="mt-5 inline-flex h-10 items-center rounded-lg bg-amber-400 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300"
        >
          로그인으로 이동
        </Link>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="max-w-xl rounded-lg border border-red-900/60 bg-red-950/30 p-6">
        <h2 className="text-base font-semibold text-red-200">프로필 오류</h2>
        <p className="mt-2 text-sm leading-6 text-red-100/80">{state.message}</p>
      </section>
    );
  }

  const { user } = state;

  return (
    <section className="max-w-xl rounded-lg border border-zinc-800 bg-zinc-950 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-amber-300">MY LIFE MOVIE</p>
          <h2 className="mt-2 text-2xl font-bold text-zinc-50">
            {user.display_name || "이름 없는 사용자"}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">{user.email}</p>
        </div>
        <span className="rounded-full border border-emerald-700/50 bg-emerald-950 px-3 py-1 text-xs font-semibold text-emerald-300">
          {user.status}
        </span>
      </div>

      <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500">권한</dt>
          <dd className="mt-1 font-medium text-zinc-100">{user.role}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">가입일</dt>
          <dd className="mt-1 font-medium text-zinc-100">
            {formatDate(user.created_at)}
          </dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={APP_ROUTES.movies}
          className="inline-flex h-10 items-center rounded-lg border border-zinc-700 px-4 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-800"
        >
          영화 목록으로 이동
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="inline-flex h-10 items-center rounded-lg bg-zinc-800 px-4 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoggingOut ? "로그아웃 중" : "로그아웃"}
        </button>
      </div>
    </section>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
  }).format(new Date(value));
}
