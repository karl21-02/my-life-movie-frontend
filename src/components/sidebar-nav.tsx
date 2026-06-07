"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { APP_ROUTES } from "@/lib/routes";

const navItems = [
  { label: "영화 관리", href: APP_ROUTES.movies, icon: "🎬" },
  { label: "영화 생성", href: APP_ROUTES.createMovie, icon: "✨" },
  { label: "프로필", href: APP_ROUTES.profile, icon: "👤" },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside
      className="flex w-44 flex-shrink-0 flex-col gap-1 px-3 py-8"
      style={{
        backgroundColor: "rgba(10, 20, 40, 0.7)",
        backdropFilter: "blur(12px)",
        borderRight: "1px solid rgba(251,191,36,0.15)",
      }}
    >
      {/* 로고 */}
      <div className="mb-8 px-2">
        <div className="text-xs font-bold tracking-[0.2em] text-amber-400 uppercase mb-0.5">
          My Life Movie
        </div>
        <div className="h-px w-full bg-gradient-to-r from-amber-400/40 to-transparent" />
      </div>

      {navItems.map((item) => {
        const isActive = isActiveNavItem(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              isActive
                ? "text-amber-400"
                : "text-zinc-400 hover:text-zinc-100"
            }`}
            style={
              isActive
                ? {
                    background:
                      "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))",
                    border: "1px solid rgba(251,191,36,0.25)",
                    boxShadow: "0 0 12px rgba(251,191,36,0.1)",
                  }
                : {
                    border: "1px solid transparent",
                  }
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </aside>
  );
}

function isActiveNavItem(pathname: string, href: string): boolean {
  if (href === APP_ROUTES.movies) {
    return pathname === APP_ROUTES.movies || pathname.startsWith(`${APP_ROUTES.movies}/`);
  }
  if (href === APP_ROUTES.createMovie) {
    return pathname === APP_ROUTES.createMovie || pathname.startsWith(`${APP_ROUTES.createMovie}/`);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
