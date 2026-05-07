"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "영화 관리", href: "/movies" },
  { label: "영화 생성", href: "/movies/create" },
  { label: "프로필", href: "/profile" },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="flex w-36 flex-shrink-0 flex-col gap-1 border-r border-zinc-800 bg-zinc-900 px-3 py-8">
      {navItems.map((item) => {
        const isActive =
          item.href === "/movies"
            ? pathname === "/movies" || pathname.startsWith("/movies/")
            : pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-zinc-800 text-amber-400"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </aside>
  );
}
