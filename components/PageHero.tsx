// Dark wave header for the inner pages (sign in, sign up). Plum, not navy.
export default function PageHero({ title, sub, children, compact = false }: { title: React.ReactNode; sub?: React.ReactNode; children?: React.ReactNode; compact?: boolean }) {
  return (
    <section className="relative isolate overflow-hidden bg-plum text-white">
      <div className="absolute inset-0 -z-30 bg-[radial-gradient(120%_90%_at_10%_0%,#4a2aa8_0%,#2f1a70_45%,#2a1660_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(45%_55%_at_0%_30%,rgba(208,109,231,0.3)_0%,rgba(208,109,231,0)_100%),radial-gradient(45%_60%_at_100%_0%,rgba(0,188,188,0.28)_0%,rgba(0,188,188,0)_100%)]" />
      <svg aria-hidden className="pointer-events-none absolute inset-0 -z-10 h-full w-full" viewBox="0 0 1440 400" preserveAspectRatio="none">
        <defs>
          <linearGradient id="ph1" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#d06de7" stopOpacity="0.5" /><stop offset="55%" stopColor="#6f5ff4" stopOpacity="0.5" /><stop offset="100%" stopColor="#1dacdf" stopOpacity="0.5" /></linearGradient>
          <linearGradient id="ph2" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#6f5ff4" stopOpacity="0.9" /><stop offset="60%" stopColor="#1dacdf" stopOpacity="0.9" /><stop offset="100%" stopColor="#00bcbc" stopOpacity="0.9" /></linearGradient>
        </defs>
        <path fill="url(#ph1)" d="M0,250 C240,190 420,340 720,270 C1000,210 1200,150 1440,240 L1440,400 L0,400 Z" />
        <path fill="url(#ph2)" d="M0,340 C300,300 520,420 820,350 C1100,300 1260,290 1440,330 L1440,400 L0,400 Z" />
      </svg>
      <svg aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[-1px] z-0 h-[70px] w-full md:h-[90px]" viewBox="0 0 1440 160" preserveAspectRatio="none"><path fill="#ffffff" d="M0,96 C240,150 420,30 720,70 C1000,108 1200,150 1440,60 L1440,160 L0,160 Z" /></svg>
      <div className={`relative mx-auto max-w-[1160px] px-5 pt-28 md:px-8 md:pt-32 ${compact ? "pb-28 md:pb-32" : "pb-32 md:pb-40"}`}>
        <div className="mx-auto flex max-w-[720px] flex-col items-center text-center">
          <h1 className="rise rise-1 mb-3 text-[34px] font-bold leading-[1.08] tracking-[-0.02em] md:text-[46px]">{title}</h1>
          {sub && <p className="rise rise-2 mx-auto max-w-[600px] text-[16px] leading-relaxed text-white/70 md:text-[17px]">{sub}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}
