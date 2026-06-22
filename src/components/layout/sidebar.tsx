"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, X } from "lucide-react";
import { NAV_GROUPS } from "@/components/layout/nav";
import { cn } from "@/lib/utils";

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-700 text-white shadow-sm">
              <BarChart3 className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-900">Anuhar CRM</p>
              <p className="text-[11px] text-slate-400">Performance Suite</p>
            </div>
          </Link>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.title}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        )}
                      >
                        <item.icon
                          className={cn("h-[18px] w-[18px]", active ? "text-primary" : "text-slate-400 group-hover:text-slate-600")}
                        />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer card */}
        <div className="border-t border-slate-100 p-3">
          <div className="rounded-xl bg-gradient-to-br from-primary to-blue-700 p-4 text-white">
            <p className="text-sm font-semibold">Daily report ready?</p>
            <p className="mt-0.5 text-xs text-blue-100">Upload today&apos;s leads &amp; followups.</p>
            <Link
              href="/upload"
              onClick={onClose}
              className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur hover:bg-white/25"
            >
              Upload now
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
