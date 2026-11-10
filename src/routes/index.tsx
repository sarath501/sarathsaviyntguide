import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, Award, BookOpen, BriefcaseBusiness, CheckCircle2, Code2,
  Database, ExternalLink, GraduationCap, Linkedin, Mail, Network, ShieldCheck,
  Workflow, Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

const LINKEDIN_URL = "https://www.linkedin.com/in/avala-sarath-782241263/";
const PROFILE_IMAGE = "/sarath-profile.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sarath IGA Learning Portal | Practical Saviynt & IAM Learning" },
      { name: "description", content: "A practical learning space for Saviynt IGA, IAM, connectors, troubleshooting, SQL and certification preparation. Created by Sarath Avala." },
      { property: "og:title", content: "Sarath IGA Learning Portal" },
      { property: "og:description", content: "Learn identity governance through practical guides, labs and scenarios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: BookOpen, title: "Structured learning", text: "Build a strong foundation in IAM, IGA, Saviynt EIC and identity lifecycle concepts." },
  { icon: Network, title: "Connector configuration", text: "Explore AD, SAP, JDBC, REST, SCIM, Workday and SFTP integration patterns." },
  { icon: Wrench, title: "Troubleshooting guides", text: "Understand common connector failures through symptoms, diagnostics and remediation." },
  { icon: ShieldCheck, title: "Governance practice", text: "Practise access reviews, RBAC, role engineering and segregation of duties." },
  { icon: Award, title: "Certification preparation", text: "Prepare with focused question banks, timed exams and explanations." },
  { icon: Database, title: "SQL and API labs", text: "Strengthen technical skills with SQL exercises and simulated API practice." },
];

const TOPICS = [
  "Saviynt EIC", "Identity lifecycle", "Access requests", "Access certifications",
  "RBAC & SoD", "Active Directory", "SAP integrations", "REST & JDBC",
  "Workflows", "SQL analytics", "Troubleshooting", "Implementation",
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Logo />
          <nav className="flex items-center gap-2">
            <a href="#learning" className="hidden px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground sm:inline-flex">Explore</a>
            <a href="#about" className="hidden px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground sm:inline-flex">About</a>
            <Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button>
            <Button asChild size="sm"><Link to="/auth" search={{ mode: "signup" }}>Get started <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_20%,hsl(var(--primary)/0.10),transparent_42%),radial-gradient(ellipse_at_85%_70%,hsl(var(--primary)/0.07),transparent_38%)]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-24">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
                <span className="h-2 w-2 rounded-full bg-primary" />
                IAM · IGA · SAVIYNT EIC
              </div>
              <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
                Learn identity governance.
                <span className="mt-2 block text-primary">Build practical skills.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
                A focused learning space for Saviynt and IAM professionals — with practical guides, connector labs, troubleshooting, SQL practice and certification preparation.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg"><Link to="/auth" search={{ mode: "signup" }}>Start learning <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                <Button asChild size="lg" variant="outline"><a href="#learning">Explore resources</a></Button>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Practical scenarios</span>
                <span className="inline-flex items-center gap-2"><Code2 className="h-4 w-4 text-primary" /> Technical exercises</span>
                <span className="inline-flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" /> Career-focused learning</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[420px]">
              <div className="absolute -inset-4 rounded-[2rem] bg-primary/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-[1.75rem] border bg-card p-2 shadow-2xl">
                <img
                  src={PROFILE_IMAGE}
                  alt="Portrait of Sarath Avala"
                  className="aspect-[4/5] w-full rounded-[1.35rem] object-cover object-center"
                  fetchPriority="high"
                />
                <div className="absolute inset-x-2 bottom-2 rounded-b-[1.3rem] bg-gradient-to-t from-black/85 via-black/45 to-transparent px-6 pb-6 pt-20 text-white">
                  <p className="text-xl font-semibold tracking-tight">Sarath Avala</p>
                  <p className="mt-1 text-sm text-white/80">Saviynt IGA Certified Professional</p>
                  <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-white hover:underline">
                    <Linkedin className="h-4 w-4" /> Connect on LinkedIn <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
              <div className="absolute -left-5 top-10 hidden rounded-xl border bg-card/95 px-4 py-3 shadow-lg sm:block">
                <p className="text-xs text-muted-foreground">Learning focus</p>
                <p className="mt-1 text-sm font-semibold">Saviynt · IAM · IGA</p>
              </div>
            </div>
          </div>
        </section>

        <section id="learning" className="border-y bg-muted/25">
          <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Explore the portal</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Learn by understanding. Improve by practising.</h2>
                <p className="mt-4 leading-7 text-muted-foreground">Focused resources for the concepts and technical tasks used across identity governance projects.</p>
              </div>
              <Button asChild variant="outline"><Link to="/auth" search={{ mode: "signup" }}>View learning portal <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature, index) => (
                <article key={feature.title} className="group rounded-2xl border bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><feature.icon className="h-5 w-5" /></div>
                  <p className="mt-5 text-xs font-medium text-muted-foreground">0{index + 1}</p>
                  <h3 className="mt-1 text-lg font-semibold tracking-tight">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="border-y bg-muted/25">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[0.85fr_1.15fr] md:px-8 md:py-20">
            <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <img src={PROFILE_IMAGE} alt="Sarath Avala" className="aspect-[5/4] w-full object-cover object-center" loading="lazy" />
              <div className="p-5">
                <h2 className="text-xl font-semibold">Sarath Avala</h2>
                <p className="mt-1 text-sm text-muted-foreground">Creator · Saviynt IGA Certified Professional</p>
                <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"><Linkedin className="h-4 w-4" /> LinkedIn profile <ExternalLink className="h-3.5 w-3.5" /></a>
              </div>
            </div>
            <div className="self-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">About the creator</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Built from practical IAM experience.</h2>
              <p className="mt-5 leading-7 text-muted-foreground">I’m Sarath Avala, an IAM professional with around five years of experience across Saviynt IGA and SailPoint IdentityIQ. I hold the Saviynt IGA Certified Professional credential and work across implementation and support-focused IGA activities.</p>
              <p className="mt-4 leading-7 text-muted-foreground">This portal brings together structured notes, practical exercises and realistic troubleshooting scenarios to help learners and working professionals strengthen their identity governance skills.</p>
              <div className="mt-6 flex flex-wrap gap-2">{TOPICS.map((topic) => <span key={topic} className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">{topic}</span>)}</div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild><a href={LINKEDIN_URL} target="_blank" rel="noreferrer">Connect on LinkedIn <ExternalLink className="ml-2 h-4 w-4" /></a></Button>
                <Button asChild variant="outline"><a href="mailto:avalasarath01@gmail.com"><Mail className="mr-2 h-4 w-4" /> Contact</a></Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 text-center md:px-8 md:py-20">
          <div className="mx-auto max-w-2xl rounded-3xl border bg-card px-6 py-12 shadow-sm md:px-12">
            <BriefcaseBusiness className="mx-auto h-8 w-8 text-primary" />
            <h2 className="mt-5 text-3xl font-semibold tracking-tight">Ready to build your IGA skills?</h2>
            <p className="mt-3 leading-7 text-muted-foreground">Create an account to access practical learning resources, hands-on exercises and certification preparation.</p>
            <Button asChild size="lg" className="mt-7"><Link to="/auth" search={{ mode: "signup" }}>Get started <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </section>
      </main>

        <section className="border-t bg-muted/25">
          <div className="mx-auto max-w-4xl px-5 py-10 text-center md:px-8">
            <p className="text-sm font-medium">A quick note for learners</p>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Create an account using your email address and verify your email to unlock access to the full learning resources.
              If you find this page useful, please share it with others who are learning IAM and Saviynt.
            </p>
          </div>
        </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-center text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8 md:text-left">
          <p>© {new Date().getFullYear()} Sarath IGA Learning Portal · Created by Sarath Avala</p>
          <p>Independent learning resource. Not affiliated with Saviynt, Inc.</p>
          <a href="tel:+919606032995" className="hover:text-foreground">+91 9606032995</a>
        </div>
      </footer>
    </div>
  );
}
