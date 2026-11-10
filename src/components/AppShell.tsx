import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { LayoutDashboard, BookOpen, Award, Wrench, Database, MessagesSquare, Route as RouteIcon, User, Shield, LogOut, Menu, X, Plug, NotebookPen, ChartNoAxesCombined, Medal, Users, BriefcaseBusiness, GraduationCap, Search, ArrowRight, Command, CalendarDays, BookText, ClipboardCheck, ChevronDown, ChevronRight, Workflow, ScrollText, } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useProfile } from "@/hooks/use-auth";
import { useCurriculum } from "@/lib/curriculum";
import { useConnectors } from "@/lib/connectors";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { PortalFooter } from "./IgaVisual";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Your learning progress and recent activity" },
  { to: "/activity", label: "Activity & Achievements", icon: CalendarDays, description: "Learning calendar, streaks and achievement badges" },
  { to: "/learn", label: "Learning Center", icon: BookOpen, description: "Saviynt modules, lessons and IGA concepts" },
  { to: "/glossary", label: "IGA Glossary", icon: BookText, description: "Search IAM, IGA, Saviynt and integration terminology" },
  { to: "/rules-center", label: "Saviynt Rules Center", icon: ScrollText, description: "Technical rules, birthright, user update rules, policies and SoD" },
  { to: "/certification", label: "Certification Prep", icon: Award, description: "Professional and Advanced practice exams" },
  { to: "/access-review", label: "Access Review Simulator", icon: ClipboardCheck, description: "Practice access certification and reviewer decisions" },
  { to: "/implementation-simulator", label: "Implementation Simulator", icon: Workflow, description: "Practise an end-to-end Saviynt EIC implementation project" },
  { to: "/connectors", label: "Connectors Learning Center", icon: Plug, description: "Connector guides, integrations and comparison" },
  { to: "/labs", label: "Troubleshooting Center", icon: Wrench, description: "Connector error library, diagnostic guides and hands-on labs" },
  { to: "/sql", label: "SQL Practice", icon: Database, description: "SQL exercises and analytics practice" },
  { to: "/interview", label: "AI Mock Interviews", icon: MessagesSquare, description: "Mock interview practice" },
  { to: "/interview-prep", label: "Interview Question Bank", icon: GraduationCap, description: "Technical, scenario and managerial questions" },
  { to: "/plan", label: "Learning Path", icon: RouteIcon, description: "Plan your learning goals and schedule" },
  { to: "/skills", label: "My Skills", icon: ChartNoAxesCombined, description: "Track your skills" },
  { to: "/certificates", label: "Certificates", icon: Medal, description: "Your learning achievements" },
  { to: "/workspace", label: "My Workspace", icon: NotebookPen, description: "Your personal learning workspace" },
  { to: "/community", label: "Community", icon: Users, description: "Connect with other learners" },
  { to: "/career", label: "Career Center", icon: BriefcaseBusiness, description: "Career resources and opportunities" },
  { to: "/profile", label: "Profile", icon: User, description: "Your account and preferences" },
] as const;

type SearchResult = { key: string; title: string; detail: string; group: string; to: "/dashboard" | "/learn" | "/certification" | "/implementation-simulator" | "/rules-center" | "/connectors" | "/labs" | "/sql" | "/interview" | "/interview-prep" | "/plan" | "/skills" | "/certificates" | "/workspace" | "/community" | "/career" | "/profile" | "/lesson/$lessonId" | "/connectors/$connectorId"; params?: { lessonId: string } | { connectorId: string } };

function GlobalSearch({ onNavigate }: { onNavigate: () => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { data: curriculum } = useCurriculum();
  const { data: connectors = [] } = useConnectors();

  const results = useMemo<SearchResult[]>(() => {
    const term = query.trim().toLowerCase();
    if (term.length < 2) return [];
    const matches: SearchResult[] = [];
    for (const item of NAV) {
      if (`${item.label} ${item.description}`.toLowerCase().includes(term)) {
        matches.push({ key: item.to, title: item.label, detail: item.description, group: "Portal sections", to: item.to });
      }
    }
    for (const module of curriculum?.modules ?? []) {
      for (const lesson of module.lessons) {
        if (`${lesson.title} ${lesson.summary} ${module.title}`.toLowerCase().includes(term)) {
          matches.push({ key: lesson.id, title: lesson.title, detail: module.title, group: "Lessons", to: "/lesson/$lessonId", params: { lessonId: lesson.id } });
        }
      }
    }
    for (const connector of connectors) {
      const searchable = [connector.name, connector.category, connector.summary, connector.support_type,
        ...(connector.content?.useCases ?? []),
        ...(connector.content?.troubleshooting ?? []).flatMap((item) => [item.error, item.cause, item.resolution]),
        ...(connector.content?.interview ?? []).map((item) => item.q),
      ].join(" ").toLowerCase();
      if (searchable.includes(term)) {
        matches.push({ key: connector.id, title: connector.name, detail: `${connector.category} · ${connector.summary}`, group: "Connector guides", to: "/connectors/$connectorId", params: { connectorId: connector.id } });
      }
    }
    return matches.slice(0, 30);
  }, [query, curriculum, connectors]);

  function close() {
    setOpen(false);
    setQuery("");
    onNavigate();
  }

  return (
    <div className="relative w-full max-w-xl">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}
          placeholder="Search lessons, connectors and portal sections…"
          aria-label="Search the learning portal"
          aria-expanded={open && query.trim().length >= 2}
          className="h-10 pl-9 pr-16"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground"><Command className="h-3 w-3" />Search</span>
      </div>
      {open && query.trim().length >= 2 && (
        <>
          <button aria-label="Close search results" className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-[min(70vh,560px)] overflow-y-auto rounded-xl border bg-popover p-2 text-popover-foreground shadow-xl">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Search results</p>
            {results.length ? (
              <div className="space-y-1">
                {results.map((result) => (
                  <Link key={result.key} to={result.to as never} params={result.params as never} onClick={close} className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="mt-0.5 rounded-md bg-muted p-1.5"><Search className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{result.title}</span><span className="block truncate text-xs text-muted-foreground">{result.detail}</span><span className="mt-0.5 block text-[10px] uppercase tracking-wide text-primary">{result.group}</span></span>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-3 py-6 text-center"><Search className="mx-auto h-6 w-6 text-muted-foreground" /><p className="mt-2 text-sm font-medium">No matching content found</p><p className="mt-1 text-xs text-muted-foreground">Try a broader term such as “access”, “SAP”, “workflow” or “certification”.</p></div>
            )}
            <p className="border-t px-3 py-2 text-[11px] text-muted-foreground">Searches published lessons, connector guides and portal sections. More content types can be added as their search data is exposed.</p>
          </div>
        </>
      )}
    </div>
  );
}

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

  const linkCls = "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-navy-muted transition-all duration-200 hover:bg-sidebar-accent hover:text-navy-foreground";
  const activeCls = "bg-sidebar-accent text-navy-foreground shadow-sm ring-1 ring-white/10";
  const location = useLocation();
  const groups = [
    { title: "Overview", hint: "Your home", icon: LayoutDashboard, items: NAV.filter(n => ["/dashboard", "/activity"].includes(n.to)) },
    { title: "Learn & Explore", hint: "Build your knowledge", icon: BookOpen, items: NAV.filter(n => ["/learn", "/glossary", "/rules-center", "/connectors", "/labs", "/sql"].includes(n.to)) },
    { title: "Practice & Assess", hint: "Test your skills", icon: ClipboardCheck, items: NAV.filter(n => ["/certification", "/access-review", "/implementation-simulator", "/interview", "/interview-prep"].includes(n.to)) },
    { title: "Growth & Career", hint: "Track your progress", icon: Award, items: NAV.filter(n => ["/plan", "/skills", "/certificates", "/career"].includes(n.to)) },
    { title: "My Space", hint: "Your personal area", icon: Users, items: NAV.filter(n => ["/workspace", "/community", "/profile"].includes(n.to)) },
  ];
  const activeGroup = groups.find(g => g.items.some(item => location.pathname === item.to || (item.to !== "/dashboard" && location.pathname.startsWith(item.to + "/"))))?.title ?? "Overview";
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Overview: true, "Learn & Explore": true, "Practice & Assess": false, "Growth & Career": false, "My Space": false,
  });
  useEffect(() => {
    setExpandedGroups(previous => previous[activeGroup] ? previous : { ...previous, [activeGroup]: true });
  }, [activeGroup]);

  const nav = (
    <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-2">
      <div className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-navy-muted/70">Workspace navigation</div>
      {groups.map(group => {
        const expanded = !!expandedGroups[group.title];
        const GroupIcon = group.icon;
        return (
          <section key={group.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-1.5">
            <button type="button" onClick={() => setExpandedGroups(previous => ({ ...previous, [group.title]: !previous[group.title] }))} aria-expanded={expanded} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-white/[0.06]">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.07] text-navy-foreground/80"><GroupIcon className="h-4 w-4"/></span>
              <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-navy-foreground">{group.title}</span><span className="mt-0.5 block text-[10px] text-navy-muted">{group.hint}</span></span>
              <span className="mr-1 rounded-full bg-white/[0.07] px-2 py-0.5 text-[10px] tabular-nums text-navy-muted">{group.items.length}</span>
              {expanded ? <ChevronDown className="h-4 w-4 text-navy-muted"/> : <ChevronRight className="h-4 w-4 text-navy-muted"/>}
            </button>
            {expanded && <div className="mt-1 space-y-0.5 pb-1 pl-2">
              {group.items.map(n => (
                <Link key={n.to} to={n.to} className={linkCls} activeProps={{ className: activeCls }} onClick={() => setOpen(false)}>
                  <n.icon className="h-4 w-4 shrink-0 opacity-80 group-hover:opacity-100"/> <span className="min-w-0 truncate">{n.label}</span>
                </Link>
              ))}
            </div>}
          </section>
        );
      })}
      {isAdmin && <div className="mt-1 border-t border-navy-line pt-2"><Link to="/admin" className={linkCls} activeProps={{ className: activeCls }} onClick={() => setOpen(false)}><Shield className="h-4 w-4"/> Admin</Link></div>}
    </nav>
  );

  return (
    <div className="learning-shell min-h-screen lg:flex">
      <aside className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-64 shrink-0 flex-col gap-4 overflow-y-auto bg-gradient-to-b from-navy via-navy to-[#101d36] p-3 transition-transform lg:sticky lg:top-0 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between rounded-2xl px-2 pb-1 pt-2">
          <Logo light />
          <Button variant="ghost" size="icon" className="shrink-0 text-navy-muted hover:bg-sidebar-accent hover:text-navy-foreground lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></Button>
        </div>
        {nav}
        <div className="border-t border-navy-line pt-4">
          <div className="px-3 pb-3"><p className="truncate text-sm font-medium text-navy-foreground">{profile?.full_name || "Learner"}</p><p className="text-xs text-navy-muted">{profile?.experience_level}</p></div>
          <Button variant="ghost" onClick={signOut} className={`${linkCls} w-full justify-start`}><LogOut className="h-4 w-4" /> Sign out</Button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-navy/50 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-card px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} className="lg:hidden"><Menu className="h-5 w-5" /></Button>
          <div className="hidden sm:block"><Logo /></div>
          <GlobalSearch onNavigate={() => setOpen(false)} />
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">{children}</main>
        <PortalFooter />
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string | undefined; action?: ReactNode }) {
  return (
    <div className="page-header mb-7 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>{subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}</div>
      {action}
    </div>
  );
}
