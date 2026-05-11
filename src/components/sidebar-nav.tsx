"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { APP_ROUTES } from "@/lib/routes";

const navItems = [
  { label: "영화 관리", href: APP_ROUTES.movies },
  { label: "영화 생성", href: APP_ROUTES.createMovie },
  { label: "프로필", href: APP_ROUTES.profile },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="flex w-36 flex-shrink-0 flex-col gap-1 border-r border-zinc-800 bg-zinc-900 px-3 py-8">
      {navItems.map((item) => {
        const isActive = isActiveNavItem(pathname, item.href);

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

function isActiveNavItem(pathname: string, href: string): boolean {
  if (href === APP_ROUTES.movies) {
    return pathname === APP_ROUTES.movies || pathname.startsWith(`${APP_ROUTES.movies}/`);
  }

  if (href === APP_ROUTES.createMovie) {
    return pathname === APP_ROUTES.createMovie || pathname.startsWith(`${APP_ROUTES.createMovie}/`);
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
