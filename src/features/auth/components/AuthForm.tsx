"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import { ApiError } from "@/lib/api";
import { login, signup } from "@/features/auth/api";
import { saveAuthSession } from "@/features/auth/session";
import type { AuthMode } from "@/features/auth/types";
import { logger } from "@/lib/logger";

type AuthFormProps = {
  mode: AuthMode;
};

type FormStatus = "idle" | "submitting" | "ready" | "error";

const content = {
  login: {
    eyebrow: "WELCOME BACK",
    title: "다시 나의 영화로 들어가기",
    description: "계정으로 돌아와 흩어진 기록을 영화처럼 이어갈 수 있습니다.",
    submitLabel: "로그인",
    switchLabel: "아직 계정이 없다면",
    switchHref: "/auth/signup",
    switchText: "회원가입",
    successMessage: "로그인되었습니다. 이제 나의 영화 만들기를 이어갈 수 있습니다.",
  },
  signup: {
    eyebrow: "START YOUR FILM",
    title: "나만의 영화 계정 만들기",
    description: "이메일과 비밀번호로 계정을 만들고 나의 기록을 담을 준비를 합니다.",
    submitLabel: "회원가입",
    switchLabel: "이미 계정이 있다면",
    switchHref: "/auth/login",
    switchText: "로그인",
    successMessage: "가입이 완료되었습니다. 첫 장면을 만들 준비가 끝났습니다.",
  },
} satisfies Record<AuthMode, Record<string, string>>;

export function AuthForm({ mode }: AuthFormProps) {
  const copy = content[mode];
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState<string>(
    "이메일과 비밀번호를 입력해 인증을 진행합니다.",
  );

  const isSignup = mode === "signup";
  const helperText = useMemo(() => {
    if (status === "submitting") {
      return "요청을 확인하는 중입니다.";
    }
    return message;
  }, [message, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const displayName = String(formData.get("display_name") ?? "").trim();

    try {
      const response = isSignup
        ? await signup({
          email,
          password,
          display_name: displayName || undefined,
        })
        : await login({ email, password });

      saveAuthSession(response);
      logger.info("auth_session_created", {
        mode,
        user_id: response.user.id,
      });
      setStatus("ready");
      setMessage(copy.successMessage);
    } catch (error) {
      setStatus("error");
      if (error instanceof ApiError) {
        setMessage(error.problem.detail);
        return;
      }

      setMessage("인증 요청 중 알 수 없는 오류가 발생했습니다.");
    }
  }

  return (
    <main className="min-h-svh bg-[#120f0f] text-[#fff8ed]">
      <section className="relative isolate flex min-h-svh overflow-hidden">
        <div aria-hidden className="splash-backdrop absolute inset-0" />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,15,15,0.96)_0%,rgba(18,15,15,0.84)_50%,rgba(18,15,15,0.36)_100%)]"
        />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-8 sm:px-10 lg:grid-cols-[minmax(0,0.9fr)_420px] lg:px-12">
          <div>
            <Link href="/" className="text-base font-semibold text-[#fff8ed]">
              MY LIFE MOVIE
            </Link>
            <p className="mt-20 text-sm font-semibold text-[#f1c76a]">
              {copy.eyebrow}
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
              {copy.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#f6e7cf]/78">
              {copy.description}
            </p>
          </div>

          <form
            method="post"
            onSubmit={handleSubmit}
            className="rounded-lg border border-[#fff8ed]/16 bg-[#fff8ed]/9 p-6 shadow-2xl shadow-black/35 backdrop-blur-md"
          >
            <div className="space-y-5">
              {isSignup ? (
                <label className="block">
                  <span className="text-sm font-medium text-[#f6e7cf]/82">
                    이름
                  </span>
                  <input
                    name="display_name"
                    type="text"
                    maxLength={80}
                    className="mt-2 h-12 w-full rounded-md border border-[#fff8ed]/18 bg-[#120f0f]/70 px-4 text-base text-[#fff8ed] outline-none transition placeholder:text-[#f6e7cf]/35 focus:border-[#f1c76a]"
                    placeholder="영화 크레딧에 남길 이름"
                  />
                </label>
              ) : null}

              <label className="block">
                <span className="text-sm font-medium text-[#f6e7cf]/82">
                  이메일
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={320}
                  className="mt-2 h-12 w-full rounded-md border border-[#fff8ed]/18 bg-[#120f0f]/70 px-4 text-base text-[#fff8ed] outline-none transition placeholder:text-[#f6e7cf]/35 focus:border-[#f1c76a]"
                  placeholder="name@example.com"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[#f6e7cf]/82">
                  비밀번호
                </span>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                  className="mt-2 h-12 w-full rounded-md border border-[#fff8ed]/18 bg-[#120f0f]/70 px-4 text-base text-[#fff8ed] outline-none transition placeholder:text-[#f6e7cf]/35 focus:border-[#f1c76a]"
                  placeholder="8자 이상"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={status === "submitting"}
              className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#f1c76a] px-5 text-base font-semibold text-[#1b1510] transition hover:bg-[#ffdc86] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {copy.submitLabel}
            </button>

            <p
              className={`mt-4 min-h-12 rounded-md border px-4 py-3 text-sm leading-6 ${
                status === "error"
                  ? "border-[#f1a06a]/35 bg-[#3a1e18]/60 text-[#ffd6bf]"
                  : status === "ready"
                    ? "border-[#78d6a3]/35 bg-[#173024]/60 text-[#c9f5d9]"
                  : "border-[#fff8ed]/14 bg-[#120f0f]/45 text-[#f6e7cf]/74"
              }`}
              role={status === "error" ? "alert" : "status"}
            >
              {helperText}
            </p>

            <p className="mt-5 text-center text-sm text-[#f6e7cf]/72">
              {copy.switchLabel}{" "}
              <Link
                href={copy.switchHref}
                className="font-semibold text-[#f1c76a] hover:text-[#ffdc86]"
              >
                {copy.switchText}
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
