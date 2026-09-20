"use client";

import { Info, X } from "lucide-react";
import { useEffect, useId } from "react";


export function PageHeader({ title, sub, children }: { title: string; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="mb-1 text-[22px] font-bold tracking-tight">{title}</h1>
        {sub && <p className="text-muted">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function CardHeader({ title, tip, children }: { title: string; tip?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
      <h2 className="flex items-center gap-1.5 text-[15px] font-semibold">{title}{tip && <Tip text={tip} />}</h2>
      {children}
    </div>
  );
}

// Hover or focus the icon to read `text`. Shown with CSS alone (see .tip in
// globals.css); the text also reaches screen readers through aria-describedby.
export function Tip({ text }: { text: string }) {
  const id = useId();
  return (
    <span className="tip">
      <button type="button" aria-describedby={id} aria-label="More information" className="tip-btn"><Info className="h-3.5 w-3.5" strokeWidth={2} /></button>
      <span role="tooltip" id={id} className="tip-box">{text}</span>
    </span>
  );
}

export function Stat({ label, value, suffix, detail, tip }: { label: string; value: React.ReactNode; suffix?: string; detail?: React.ReactNode; tip?: string }) {
  return (
    <div className="card px-5 py-4">
      <div className="flex items-center gap-1.5 text-[13px] text-muted">{label}{tip && <Tip text={tip} />}</div>
      <div className="mt-1 text-[26px] font-bold tracking-tight">
        {value}
        {suffix && <span className="ml-1.5 text-[15px] font-medium text-muted">{suffix}</span>}
      </div>
      {detail && <div className="mt-1 text-xs text-muted">{detail}</div>}
    </div>
  );
}

const DOT: Record<string, string> = {
  ok: "bg-good",
  run: "bg-info animate-pulse",
  pend: "bg-muted",
  warn: "bg-warn",
  bad: "bg-bad",
};

export type Tone = keyof typeof DOT;

export function Status({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-[7px] whitespace-nowrap font-medium">
      <span className={`h-2 w-2 rounded-full ${DOT[tone]}`} />
      {children}
    </span>
  );
}

export function toneForState(state: string): Tone {
  return ({ pending: "pend", connected: "ok", syncing: "run", retrying: "warn", reconnect_required: "bad", disconnected: "pend" } as Record<string, Tone>)[state] ?? "pend";
}

export function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="mb-4 flex flex-col gap-1.5">
      <span className="text-[13px] font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Modal({ open, onClose, title, children, footer, width = "max-w-[560px]" }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/35 p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${width} max-h-[calc(100vh-48px)] overflow-auto rounded-[14px] bg-surface shadow-[0_20px_60px_rgba(0,39,79,0.25)]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted hover:bg-bg hover:text-ink">
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function Note({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-line px-3.5 py-3 text-[13px]">{children}</div>;
}
