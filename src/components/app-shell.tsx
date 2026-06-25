"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  Users,
  Vote,
  X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { IconButton } from "./ui";

const adminOnlyRoutes: string[] = [];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isReady, logout, state } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (!currentUser) router.replace("/login");
  }, [currentUser, isReady, router]);

  const navItems = useMemo(() => {
    return [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Members", href: "/members", icon: Users },
      { label: "Contributions", href: "/contributions", icon: ClipboardList },
      { label: "Projects", href: "/projects", icon: BriefcaseBusiness },
      { label: "Transactions", href: "/transactions", icon: ReceiptText },
      { label: "Reports", href: "/reports", icon: BarChart3 },
      { label: "Voting", href: "/voting", icon: Vote },
    ];
  }, []);

  const blocked =
    currentUser?.role === "member" &&
    adminOnlyRoutes.some((route) => pathname.startsWith(route));

  useEffect(() => {
    if (blocked) router.replace("/dashboard");
  }, [blocked, router]);

  if (!isReady || !currentUser || blocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-slate-950" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[min(18rem,calc(100vw-1.25rem))] border-r border-slate-800 bg-slate-950 text-white transition-transform lg:w-72 lg:translate-x-0",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-24 items-center justify-between border-b border-slate-800 px-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-white">
              <Image
                src="/team-syndicate-logo-sidebar.jpg"
                alt="Team Syndicate"
                width={64}
                height={64}
                className="h-full w-full object-cover"
                priority
              />
            </span>
            <span>
              <span className="block text-sm font-semibold">
                {state.settings.groupName}
              </span>
            </span>
          </Link>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-md text-slate-300 hover:bg-slate-900 lg:hidden"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="max-h-[calc(100dvh-6rem)] space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white",
                  active && "bg-white text-slate-950 hover:bg-white hover:text-slate-950",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {menuOpen ? (
        <button
          type="button"
          aria-label="Close menu overlay"
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-3 backdrop-blur sm:px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-md border border-slate-300 bg-white text-slate-800 lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">
                {currentUser.name}
              </p>
              <p className="text-xs capitalize text-slate-500">
                {currentUser.role}
              </p>
            </div>
          </div>
          <IconButton
            icon={LogOut}
            label="Logout"
            variant="secondary"
            onClick={logout}
          />
        </header>

        <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-4 sm:px-4 sm:py-6 md:gap-6 md:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
