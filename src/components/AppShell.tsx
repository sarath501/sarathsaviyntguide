import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, BookOpen, Award, Wrench, MessagesSquare, Bot, Route as RouteIcon, User, Shield, LogOut, Menu, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useProfile } from "@/hooks/use-auth";
import { Logo } from "./Logo";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/learn", label: "Learning Center", icon: BookOpen },
  { to: "/certification", label: "Certification Prep", icon: Award },
  { to: "/labs", label: "Troubleshooting Lab", icon: Wrench },
  { to: "/interview", label: "Mock Interviews", icon: MessagesSquare },
  { to: "/tutor", label: "AI Tutor", icon: Bot },
  { to: "/plan", label: "Learning Path", icon: RouteIcon },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data: isAdmin } = useIsAdmin();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const linkCls =
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-navy-muted transition-colors hover:bg-sidebar-accent hover:text-navy-foreground";
  const activeCls = "bg-sidebar-accent text-navy-foreground";

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map((n) => (
        <Link key={n.to} to={n.to} className={linkCls} activeProps={{ className: activeCls }} onClick={() => setOpen(false)}>
          <n.icon className="h-4 w-4" /> {n.label}
        </Link>
      ))}
      {isAdmin && (
        <Link to="/admin" className={linkCls} activeProps={{ className: activeCls }} onClick={() => setOpen(false)}>
          <Shield className="h-4 w-4" /> Admin
        </Link>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col gap-6 bg-navy p-4 transition-transform lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-2 pt-2">
          <Logo light />
          <button className="text-navy-muted lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        {nav}
        <div className="border-t border-navy-line pt-4">
          <div className="px-3 pb-3">
            <p className="truncate text-sm font-medium text-navy-foreground">{profile?.full_name || "Learner"}</p>
            <p className="text-xs text-navy-muted">{profile?.experience_level}</p>
          </div>
          <button onClick={signOut} className={`${linkCls} w-full`}>
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-navy/50 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b bg-card px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <Logo />
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string | undefined; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
