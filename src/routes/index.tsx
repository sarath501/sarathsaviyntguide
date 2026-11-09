import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Award,
  Wrench,
  MessagesSquare,
  Bot,
  Database,
  ArrowRight,
  ShieldCheck,
  Network,
  Linkedin,
  ExternalLink,
  GraduationCap,
  Code2,
  Mail,
  PhoneCall,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useCurriculum } from "@/lib/curriculum";

const LINKEDIN_URL = "https://www.linkedin.com/in/avala-sarath-782241263/";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sarath IGA Learning Portal | Saviynt & Identity Governance" },
      {
        name: "description",
        content:
          "Learn Saviynt IGA through structured lessons, practical labs, troubleshooting guides and certification preparation. Created by Sarath Avala.",
      },
      { property: "og:title", content: "Sarath IGA Learning Portal" },
      {
        property: "og:description",
        content: "Practical learning for Saviynt, IAM and Identity Governance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: BookOpen,
    title: "Structured Saviynt learning",
    text: "Understand IGA concepts, EIC architecture, implementation flows and core platform capabilities.",
  },
  {
    icon: Award,
    title: "Certification preparation",
    text: "Build confidence with practice questions, timed exams and explanations.",
  },
  {
    icon: Wrench,
    title: "Hands-on troubleshooting",
    text: "Work through practical scenarios involving connectors, integrations and common incidents.",
  },
  {
    icon: MessagesSquare,
    title: "Interview preparation",
    text: "Practice technical, scenario-based and managerial questions for IAM and IGA roles.",
  },
  {
    icon: Bot,
    title: "AI learning assistance",
    text: "Get guided support while exploring Saviynt concepts, configuration and SQL topics.",
  },
  {
    icon: Database,
    title: "Diagrams and SQL practice",
    text: "Explore identity lifecycle flows, governance concepts, analytics and query exercises.",
  },
];

const EXPERTISE = [
  "Saviynt EIC",
  "Identity Governance & Administration",
  "SailPoint IIQ",
  "Active Directory",
  "SAP integrations",
  "REST & JDBC connectors",
  "Access Requests",
  "Access Certifications",
  "RBAC & SoD",
  "Workflows & Analytics",
];

function Landing() {
  const { data: cur } = useCurriculum();
  const MODULES = cur?.modules ?? [];

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-hero text-navy-foreground">
        <div className="mx-auto max-w-6xl px-6">
          <header className="flex flex-wrap items-center justify-between gap-4 py-6">
            <Logo light />
            <nav className="flex items-center gap-2">
              <a
                href="#about"
                className="hidden rounded-md px-3 py-2 text-sm text-navy-muted transition-colors hover:bg-sidebar-accent hover:text-navy-foreground sm:inline-flex"
              >
                About the creator
              </a>
              <Button asChild variant="ghost" className="text-navy-foreground hover:bg-sidebar-accent hover:text-navy-foreground">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild>
                <Link to="/auth" search={{ mode: "signup" }}>Get started</Link>
              </Button>
            </nav>
          </header>

          <div className="grid items-center gap-12 py-16 md:grid-cols-[1.15fr_0.85fr] md:py-24">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-navy-line bg-navy/40 px-3 py-1.5 text-xs font-medium text-navy-muted">
                <ShieldCheck className="h-3.5 w-3.5" />
                SAVIYNT EIC · IAM · IDENTITY GOVERNANCE
              </div>
              <h1 className="max-w-3xl text-4xl font-bold leading-[1.12] tracking-tight md:text-6xl">
                Build real-world skills in
                <span className="mt-2 block text-primary-foreground">Identity Governance.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-navy-muted">
                Learn Saviynt with practical explanations, guided labs, troubleshooting scenarios and focused certification preparation — all in one place.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Explore the learning portal <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-navy-line bg-transparent text-navy-foreground hover:bg-sidebar-accent hover:text-navy-foreground">
                  <a href={LINKEDIN_URL} target="_blank" rel="noreferrer">
                    Connect on LinkedIn <Linkedin className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-navy-muted">
                <span className="inline-flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Certification-focused learning</span>
                <span className="inline-flex items-center gap-2"><Code2 className="h-4 w-4" /> Practical technical exercises</span>
              </div>
            </div>

            <div className="rounded-2xl border border-navy-line bg-navy/60 p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-muted">Learning roadmap</p>
                <span className="rounded-full bg-sidebar-accent px-2.5 py-1 text-xs text-navy-foreground">Saviynt IGA</span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold">From fundamentals to implementation</h2>
              <p className="mt-2 text-sm leading-6 text-navy-muted">
                Follow a structured path and strengthen your understanding one topic at a time.
              </p>
              <ul className="mt-6 space-y-3">
                {MODULES.length > 0 ? MODULES.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 rounded-lg border border-navy-line/70 bg-background/5 px-3 py-2.5 text-sm">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sidebar-accent font-mono text-xs font-semibold">{m.num}</span>
                    <span className="min-w-0 flex-1">{m.title}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-navy-muted" />
                  </li>
                )) : (
                  <li className="rounded-lg border border-navy-line/70 bg-background/5 px-3 py-3 text-sm text-navy-muted">
                    Sign in to explore the complete learning roadmap.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Learn by doing</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Your practical workspace for Saviynt and IGA
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Go beyond theory with learning resources designed around the concepts, tasks and problem-solving skills used in Identity Governance projects.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article key={f.title} className="group rounded-xl border bg-card p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="about" className="border-y bg-muted/30">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[0.8fr_1.2fr] md:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Meet the creator</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">About me</h2>
            <div className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">SA</div>
              <h3 className="mt-4 text-xl font-semibold">Sarath Avala</h3>
              <p className="mt-1 text-sm text-muted-foreground">Creator · Saviynt IGA Certified Professional</p>
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <Linkedin className="h-4 w-4" /> View LinkedIn profile <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <div className="mt-5 border-t pt-4">
                <p className="text-sm font-medium">Need help with the portal?</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">If you face any issue while using the learning portal, please contact me.</p>
                <a href="mailto:avalasarath01@gmail.com" className="mt-3 flex items-center gap-2 text-sm text-primary hover:underline">
                  <Mail className="h-4 w-4" /> avalasarath01@gmail.com
                </a>
                <a href="tel:+919606032995" className="mt-2 flex items-center gap-2 text-sm text-primary hover:underline">
                  <PhoneCall className="h-4 w-4" /> +91 9606032995
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <p className="text-base leading-8 text-foreground">
              Hello! I’m Sarath Avala, an Identity and Access Management (IAM) professional with around five years of experience across Saviynt IGA and SailPoint IdentityIQ. I hold the Saviynt IGA Certified Professional credential and work across implementation and support-focused IGA activities.
            </p>
            <p className="leading-7 text-muted-foreground">
              My technical interests include identity lifecycle management, access requests, access certifications, role-based access control, segregation of duties, connector integrations, workflows, analytics and troubleshooting. I have worked with integration areas such as Active Directory, SAP, Workday, REST and JDBC.
            </p>
            <p className="leading-7 text-muted-foreground">
              I created this learning portal to make Saviynt and Identity Governance concepts easier to understand through structured notes, practical exercises and realistic troubleshooting scenarios. The goal is to help learners, working professionals and interview candidates build skills they can apply in real IAM environments.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {EXPERTISE.map((item) => (
                <span key={item} className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">{item}</span>
              ))}
            </div>
            <Button asChild className="mt-2">
              <a href={LINKEDIN_URL} target="_blank" rel="noreferrer">
                Connect with me on LinkedIn <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14 text-center md:py-16">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Ready to strengthen your Saviynt skills?</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Create an account and start exploring the learning resources, practice activities and interview preparation tools.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/auth" search={{ mode: "signup" }}>Get started <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </section>

      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Sarath IGA Learning Portal · Created by Sarath Avala</p>
        <p className="mt-2">Learn Identity Governance. Master Saviynt. Build your IAM career.</p>
        <p className="mt-2">Independent learning resource. Not affiliated with Saviynt, Inc.</p>
      </footer>
    </div>
  );
}
