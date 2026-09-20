// The FxScouts wave bands, exactly the Gateway's paths and brand colours.
// `tone="light"` draws them over a light hero (the inverse of the Gateway's
// dark hero); `tone="dark"` over navy. `cut` is the colour of the section
// that follows, drawn as the bottom cut-out wave.

const G = {
  wg1: ["#d06de7", "#6f5ff4", "#1dacdf"],
  wg2: ["#1dacdf", "#00bcbc", "#6f5ff4"],
  wg3: ["#6f5ff4", "#1dacdf", "#00bcbc"],
};

export function HeroWaves({ tone, cut, id = "h" }: { tone: "light" | "dark"; cut: string; id?: string }) {
  const o = tone === "light" ? [0.8, 0.78, 1] : [0.55, 0.5, 0.9];
  return (
    <>
      <svg aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[380px] w-full md:h-[560px]" viewBox="0 0 1440 600" preserveAspectRatio="none">
        <defs>
          {(["wg1", "wg2", "wg3"] as const).map((k, i) => (
            <linearGradient key={k} id={`${id}-${k}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor={G[k][0]} stopOpacity={o[i]} /><stop offset="55%" stopColor={G[k][1]} stopOpacity={o[i]} /><stop offset="100%" stopColor={G[k][2]} stopOpacity={o[i]} />
            </linearGradient>
          ))}
        </defs>
        <path fill={`url(#${id}-wg1)`} d="M0,288 C240,168 420,448 720,328 C1000,218 1180,88 1440,228 L1440,600 L0,600 Z" />
        <path fill={`url(#${id}-wg2)`} d="M0,394 C260,314 480,534 760,414 C1040,294 1240,234 1440,344 L1440,600 L0,600 Z" />
        <path fill={`url(#${id}-wg3)`} d="M0,470 C300,400 520,600 820,500 C1100,410 1260,380 1440,450 L1440,600 L0,600 Z" />
      </svg>
      <svg aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[-1px] z-0 h-[110px] w-full md:h-[150px]" viewBox="0 0 1440 160" preserveAspectRatio="none">
        <path fill={cut} d="M0,96 C240,150 420,30 720,70 C1000,108 1200,150 1440,60 L1440,160 L0,160 Z" />
      </svg>
    </>
  );
}

// The compact header waves (sign in / sign up), Gateway paths.
export function HeaderWaves({ cut, id = "ph" }: { cut: string; id?: string }) {
  return (
    <>
      <svg aria-hidden className="pointer-events-none absolute inset-0 -z-10 h-full w-full" viewBox="0 0 1440 400" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`${id}1`} x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#d06de7" stopOpacity="0.5" /><stop offset="55%" stopColor="#6f5ff4" stopOpacity="0.5" /><stop offset="100%" stopColor="#1dacdf" stopOpacity="0.5" /></linearGradient>
          <linearGradient id={`${id}2`} x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#6f5ff4" stopOpacity="0.9" /><stop offset="60%" stopColor="#1dacdf" stopOpacity="0.9" /><stop offset="100%" stopColor="#00bcbc" stopOpacity="0.9" /></linearGradient>
        </defs>
        <path fill={`url(#${id}1)`} d="M0,250 C240,190 420,340 720,270 C1000,210 1200,150 1440,240 L1440,400 L0,400 Z" />
        <path fill={`url(#${id}2)`} d="M0,340 C300,300 520,420 820,350 C1100,300 1260,290 1440,330 L1440,400 L0,400 Z" />
      </svg>
      <svg aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[-1px] z-0 h-[70px] w-full md:h-[90px]" viewBox="0 0 1440 160" preserveAspectRatio="none"><path fill={cut} d="M0,96 C240,150 420,30 720,70 C1000,108 1200,150 1440,60 L1440,160 L0,160 Z" /></svg>
    </>
  );
}

// The sidebar waves, Gateway paths and colours.
export function SidebarWaves() {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 hidden h-[240px] w-full lg:block" viewBox="0 0 232 240" preserveAspectRatio="none">
      <defs>
        <linearGradient id="cw1" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#d06de7" stopOpacity="0.45" /><stop offset="55%" stopColor="#6f5ff4" stopOpacity="0.45" /><stop offset="100%" stopColor="#401e8b" stopOpacity="0.55" /></linearGradient>
        <linearGradient id="cw2" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#6f5ff4" stopOpacity="0.45" /><stop offset="50%" stopColor="#d06de7" stopOpacity="0.4" /><stop offset="100%" stopColor="#6f5ff4" stopOpacity="0.45" /></linearGradient>
        <linearGradient id="cw3" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#6f5ff4" stopOpacity="0.75" /><stop offset="60%" stopColor="#1dacdf" stopOpacity="0.7" /><stop offset="100%" stopColor="#00bcbc" stopOpacity="0.7" /></linearGradient>
      </defs>
      <path fill="url(#cw1)" d="M0,110 C40,70 70,160 116,120 C160,84 190,30 232,80 L232,240 L0,240 Z" />
      <path fill="url(#cw2)" d="M0,160 C42,130 78,200 122,160 C166,120 200,110 232,140 L232,240 L0,240 Z" />
      <path fill="url(#cw3)" d="M0,196 C48,172 84,232 132,200 C176,172 204,166 232,180 L232,240 L0,240 Z" />
    </svg>
  );
}
