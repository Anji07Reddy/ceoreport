"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, ChevronDown, LogOut, Menu, Search, Settings, User } from "lucide-react";
import { ALL_NAV } from "@/components/layout/nav";

export function Header({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const title = ALL_NAV.find((n) => (n.href === "/" ? pathname === "/" : pathname.startsWith(n.href)))?.label ?? "Dashboard";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setProfileOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/opportunities?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6">
      <button onClick={onMenu} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden">
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="hidden text-lg font-semibold text-slate-900 sm:block">{title}</h1>

      {/* Search */}
      <form onSubmit={onSearch} className="ml-auto hidden flex-1 justify-end md:flex">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads, contacts…"
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </form>

      <div ref={ref} className="ml-auto flex items-center gap-1 md:ml-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              <p className="px-2 py-1.5 text-sm font-semibold text-slate-900">Notifications</p>
              <div className="space-y-1">
                <NotifItem title="Overdue follow-ups need attention" time="Today" />
                <NotifItem title="New daily leads ready to upload" time="Today" />
                <NotifItem title="Weekly performance summary available" time="Yesterday" />
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-700 text-xs font-bold text-white">
              AH
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-sm font-semibold text-slate-900">Admin</span>
              <span className="block text-[11px] text-slate-400">Management</span>
            </span>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="text-sm font-semibold text-slate-900">Anuhar Homes</p>
                <p className="text-xs text-slate-400">admin@anuhar.com</p>
              </div>
              <MenuLink href="/settings" icon={<User className="h-4 w-4" />} label="Profile" />
              <MenuLink href="/settings" icon={<Settings className="h-4 w-4" />} label="Settings" />
              <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function NotifItem({ title, time }: { title: string; time: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg px-2 py-2 hover:bg-slate-50">
      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
      <div>
        <p className="text-sm text-slate-700">{title}</p>
        <p className="text-[11px] text-slate-400">{time}</p>
      </div>
    </div>
  );
}

function MenuLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
      {icon}
      {label}
    </Link>
  );
}
