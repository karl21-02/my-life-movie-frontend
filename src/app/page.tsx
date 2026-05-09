import Link from "next/link";

const scenes = [
  {
    title: "Scene 01",
    caption: "기억",
    className: "from-[#f7c873] via-[#c55b3c] to-[#251413]",
  },
  {
    title: "Scene 02",
    caption: "음악",
    className: "from-[#55c7a5] via-[#2f6768] to-[#171b22]",
  },
  {
    title: "Scene 03",
    caption: "대화",
    className: "from-[#efeee7] via-[#b85656] to-[#1a1114]",
  },
  {
    title: "Scene 04",
    caption: "포스터",
    className: "from-[#f0d46e] via-[#2a7568] to-[#151313]",
  },
];

export default function Home() {
  return (
    <main className="min-h-svh bg-[#120f0f] text-[#fff8ed]">
      <section className="relative isolate flex min-h-[92svh] overflow-hidden">
        <div aria-hidden className="splash-backdrop absolute inset-0" />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,15,15,0.96)_0%,rgba(18,15,15,0.82)_42%,rgba(18,15,15,0.18)_100%)]"
        />
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

          <div className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[minmax(0,0.92fr)_minmax(380px,0.72fr)] lg:py-10">
            <div className="max-w-3xl">
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

            <div
              className="relative hidden min-h-[620px] lg:block"
              aria-hidden="true"
            >
              <div className="splash-projector absolute left-0 top-1/2 h-[520px] w-[420px] -translate-y-1/2" />
              <div className="splash-reel absolute right-0 top-1/2 grid w-[460px] -translate-y-1/2 rotate-3 grid-cols-2 gap-4">
                {scenes.map((scene) => (
                  <div
                    key={scene.title}
                    className={`relative min-h-64 overflow-hidden rounded-lg border border-[#fff8ed]/18 bg-gradient-to-br ${scene.className} p-4 shadow-2xl shadow-black/40`}
                  >
                    <div className="absolute inset-x-4 top-4 flex justify-between text-[11px] font-semibold uppercase text-[#fff8ed]/78">
                      <span>{scene.title}</span>
                      <span>00:0{scene.title.at(-1)}</span>
                    </div>
                    <div className="absolute inset-x-5 bottom-5">
                      <div className="h-24 rounded-md border border-[#fff8ed]/18 bg-[#fff8ed]/12 backdrop-blur-[1px]" />
                      <p className="mt-3 text-2xl font-semibold text-[#fff8ed]">
                        {scene.caption}
                      </p>
                    </div>
                    <div className="absolute left-0 top-0 h-full w-7 border-r border-black/30 bg-black/38" />
                  </div>
                ))}
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
