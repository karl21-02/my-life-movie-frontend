import SidebarNav from "@/components/sidebar-nav";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div
      className="flex min-h-screen relative"
      style={{
        backgroundColor: "#0d1b2a",
        backgroundImage: `
          radial-gradient(ellipse 90% 60% at 70% -5%, rgba(251,191,36,0.12) 0%, transparent 55%),
          radial-gradient(ellipse 60% 40% at 10% 80%, rgba(56,100,160,0.15) 0%, transparent 50%),
          radial-gradient(1px 1px at 15% 20%, rgba(255,255,255,0.6) 0%, transparent 100%),
          radial-gradient(1px 1px at 35% 8%, rgba(255,255,255,0.5) 0%, transparent 100%),
          radial-gradient(1.5px 1.5px at 55% 15%, rgba(255,255,255,0.7) 0%, transparent 100%),
          radial-gradient(1px 1px at 75% 5%, rgba(255,255,255,0.4) 0%, transparent 100%),
          radial-gradient(1px 1px at 88% 25%, rgba(255,255,255,0.5) 0%, transparent 100%),
          radial-gradient(1.5px 1.5px at 25% 40%, rgba(255,255,255,0.3) 0%, transparent 100%),
          radial-gradient(1px 1px at 65% 35%, rgba(255,255,255,0.4) 0%, transparent 100%),
          radial-gradient(1px 1px at 92% 55%, rgba(255,255,255,0.3) 0%, transparent 100%),
          radial-gradient(1.5px 1.5px at 45% 60%, rgba(255,255,255,0.25) 0%, transparent 100%),
          radial-gradient(1px 1px at 8% 55%, rgba(255,255,255,0.3) 0%, transparent 100%),
          radial-gradient(1px 1px at 80% 70%, rgba(255,255,255,0.2) 0%, transparent 100%)
        `,
      }}
    >
      <SidebarNav />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
