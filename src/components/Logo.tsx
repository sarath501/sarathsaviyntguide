export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--primary)" />
          <stop offset="1" stopColor="var(--chart-2)" />
        </linearGradient>
      </defs>
      <path d="M16 2 4 6.5v8.2C4 22.3 9.1 28.4 16 30c6.9-1.6 12-7.7 12-15.3V6.5L16 2Z" fill="url(#lg)" />
      <circle cx="16" cy="13" r="3.6" fill="none" stroke="var(--primary-foreground)" strokeWidth="2" />
      <path d="M16 16.6v7M16 20h3M16 22.8h2" stroke="var(--primary-foreground)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className={`font-display text-lg font-semibold ${light ? "text-navy-foreground" : "text-foreground"}`}>
        IGA Academy <span className="text-primary">AI</span>
      </span>
    </span>
  );
}
