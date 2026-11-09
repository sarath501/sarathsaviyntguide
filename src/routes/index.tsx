import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Award, Wrench, MessagesSquare, Bot, Database, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { MODULES } from "@/lib/content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sarath IGA Learning Portal — Master Saviynt Identity Governance" },
      { name: "description", content: "Learn Saviynt EIC, practice troubleshooting, prepare for certification and ace IAM interviews with AI." },
      { property: "og:title", content: "Sarath IGA Learning Portal — Master Saviynt Identity Governance" },
      { property: "og:description", content: "Learn Saviynt EIC, practice troubleshooting, prepare for certification and ace IAM interviews with AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: BookOpen, title: "11 structured modules", text: "From IAM basics to SoD, connectors and advanced IGA." },
  { icon: Award, title: "Certification prep", text: "Timed practice exams with explanations for every answer." },
  { icon: Wrench, title: "Troubleshooting lab", text: "Real production incidents: diagnose, then reveal the fix." },
  { icon: MessagesSquare, title: "AI mock interviews", text: "Adaptive interviewer with scored, detailed feedback." },
  { icon: Bot, title: "AI tutor", text: "Ask anything about Saviynt — configs, SQL, architecture." },
  { icon: Database, title: "Real progress tracking", text: "Every stat comes from your own activity." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <section className="bg-hero text-navy-foreground">
        <div className="mx-auto max-w-6xl px-6">
          <header className="flex items-center justify-between py-6">
            <Logo light />
            <div className="flex gap-2">
              <Button asChild variant="ghost" className="text-navy-foreground hover:bg-sidebar-accent hover:text-navy-foreground">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild><Link to="/auth" search={{ mode: "signup" }}>Get started</Link></Button>
            </div>
          </header>
          <div className="grid gap-10 py-20 md:grid-cols-[1.2fr_1fr] md:py-28">
            <div>
              <p className="mb-4 inline-block rounded-full border border-navy-line px-3 py-1 text-xs text-navy-muted">Saviynt EIC · IGA · IAM</p>
              <h1 className="text-4xl font-semibold leading-tight md:text-6xl">Learn Identity Governance.</h1>
              <p className="mt-3 text-2xl text-navy-muted md:text-3xl">Master Saviynt. Build your IAM career.</p>
              <p className="mt-6 max-w-lg text-navy-muted">A complete learning platform for Saviynt engineers — structured lessons, hands-on troubleshooting, certification practice and AI-powered interview coaching.</p>
              <Button asChild size="lg" className="mt-8">
                <Link to="/auth" search={{ mode: "signup" }}>Start learning free <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="rounded-xl border border-navy-line bg-navy/60 p-5">
              <p className="mb-3 text-xs uppercase tracking-wider text-navy-muted">Curriculum</p>
              <ul className="space-y-2">
                {MODULES.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 text-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-sidebar-accent font-mono text-xs">{m.num}</span>
                    {m.title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-semibold">Everything you need to become a Saviynt expert</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6 shadow-card">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">© {new Date().getFullYear()} Sarath IGA Learning Portal. Not affiliated with Saviynt, Inc.</footer>
    </div>
  );
}
