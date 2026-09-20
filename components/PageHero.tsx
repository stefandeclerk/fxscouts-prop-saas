import { HeaderWaves } from "@/components/Waves";

// Header for the inner pages (sign in, sign up): the Gateway's compact wave
// header, inverted to light with navy type.
export default function PageHero({ title, sub, children, compact = false }: { title: React.ReactNode; sub?: React.ReactNode; children?: React.ReactNode; compact?: boolean }) {
  return (
    <section className="relative isolate overflow-hidden bg-white text-ink">
      <div className="absolute inset-0 -z-30 bg-[radial-gradient(120%_90%_at_10%_0%,#f5f8fc_0%,#ffffff_50%,#ffffff_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(45%_55%_at_0%_30%,rgba(208,109,231,0.14)_0%,rgba(208,109,231,0)_100%),radial-gradient(45%_60%_at_100%_0%,rgba(29,172,223,0.16)_0%,rgba(29,172,223,0)_100%)]" />
      <HeaderWaves cut="#ffffff" />
      <div className={`relative mx-auto max-w-[1160px] px-5 pt-28 md:px-8 md:pt-32 ${compact ? "pb-28 md:pb-32" : "pb-32 md:pb-40"}`}>
        <div className="mx-auto flex max-w-[720px] flex-col items-center text-center">
          <h1 className="rise rise-1 mb-3 text-[34px] font-bold leading-[1.08] tracking-[-0.02em] md:text-[46px]">{title}</h1>
          {sub && <p className="rise rise-2 mx-auto max-w-[600px] text-[16px] leading-relaxed text-ink/70 md:text-[17px]">{sub}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}
