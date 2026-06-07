import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-svh bg-[#120f0f] text-[#fff8ed]">
      <section className="relative isolate flex min-h-[92svh] overflow-hidden">
        <div aria-hidden className="splash-backdrop absolute inset-0" />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,rgba(18,15,15,0)_0%,#120f0f_82%)]"
        />

        <div className="relative z-10 mx-auto flex min-h-[92svh] w-full max-w-7xl flex-col px-6 py-5 sm:px-10 lg:px-12">
          <header className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="text-base font-semibold text-[#fff8ed]"
              aria-label="My Life Movie 홈"
            >
              MY LIFE MOVIE
            </Link>
            <nav
              className="hidden items-center gap-8 text-sm font-medium text-[#f6e7cf]/78 sm:flex"
              aria-label="주요 메뉴"
            >
              <a className="transition hover:text-[#fff8ed]" href="#story">
                Story
              </a>
              <a className="transition hover:text-[#fff8ed]" href="#start">
                Start
              </a>
            </nav>
          </header>

          <div className="flex flex-1 items-center py-16 lg:py-10">
            <div className="max-w-3xl pt-20 sm:pt-24 lg:pt-32">
              <p className="mb-5 text-sm font-semibold text-[#f1c76a]">
                PERSONAL CINEMA ARCHIVE
              </p>
              <h1 className="max-w-4xl text-5xl font-semibold leading-[1.04] text-[#fff8ed] sm:text-6xl lg:text-7xl">
                나의 하루들이
                <br />
                한 편의 영화가 되는 곳
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#f6e7cf]/82 sm:text-xl">
                흩어진 기록을 모아 장르와 장면, 포스터와 음악이 있는
                나만의 인생 영화로 엮어냅니다.
              </p>
              <div
                id="start"
                className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <Link
                  href="/auth/signup"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-[#f1c76a] px-6 text-base font-semibold text-[#1b1510] transition hover:bg-[#ffdc86] focus:outline-none focus:ring-2 focus:ring-[#fff8ed] focus:ring-offset-2 focus:ring-offset-[#120f0f]"
                >
                  영화 만들기
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-[#fff8ed]/28 px-6 text-base font-semibold text-[#fff8ed] transition hover:border-[#fff8ed]/60 hover:bg-[#fff8ed]/8 focus:outline-none focus:ring-2 focus:ring-[#fff8ed] focus:ring-offset-2 focus:ring-offset-[#120f0f]"
                >
                  로그인
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="story"
        className="border-t border-[#fff8ed]/10 bg-[#120f0f] px-6 py-8 sm:px-10 lg:px-12"
      >
        <div className="mx-auto grid max-w-7xl gap-4 text-sm font-medium text-[#f6e7cf]/78 sm:grid-cols-3">
          <p>기록을 모으고</p>
          <p>서사를 발견하고</p>
          <p>나만의 영화로 남깁니다</p>
        </div>
      </section>
    </main>
  );
}
