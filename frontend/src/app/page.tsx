"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  left: `${(i * 17 + 7) % 100}%`,
  size: 2 + (i % 4),
  duration: `${12 + (i % 10)}s`,
  delay: `${(i % 8) * 0.7}s`,
  opacity: 0.25 + (i % 5) * 0.08,
}));

const STEPS = [
  {
    title: "Enter Symptoms",
    description: "Share vitals and symptoms in under a minute with a guided, clinician-inspired form.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <path d="M9 5a2 2 0 012-2h2a2 2 0 012 2v0a2 2 0 01-2 2h-2a2 2 0 01-2-2v0z" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    title: "AI Analyzes",
    description: "Groq-powered LLaMA models evaluate risk patterns across vitals in near real time.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1" />
      </svg>
    ),
  },
  {
    title: "Get Instant Results",
    description: "Receive a health score, diagnosis insights, and five actionable next steps instantly.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <path d="M22 4L12 14.01l-3-3" />
      </svg>
    ),
  },
];

const STATS = [
  { value: "< 3 seconds", label: "Analysis Time" },
  { value: "95% Accuracy", label: "AI Precision" },
  { value: "24/7 Available", label: "Always On" },
  { value: "100% Private", label: "Your Data is Safe" },
];

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

export default function HomePage() {
  const howItWorks = useInView(0.15);
  const stats = useInView(0.2);

  return (
    <div className="relative overflow-hidden bg-[#0a0f1e]">
      {/* Floating particles */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {PARTICLES.map((p) => (
          <span
            key={p.id}
            className="particle"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              animationDuration: p.duration,
              animationDelay: p.delay,
              opacity: p.opacity,
              background:
                p.id % 3 === 0
                  ? "rgba(16,185,129,0.55)"
                  : p.id % 3 === 1
                    ? "rgba(59,130,246,0.45)"
                    : "rgba(148,163,184,0.4)",
            }}
          />
        ))}
      </div>

      {/* Hero */}
      <section className="relative flex min-h-[calc(100vh-65px)] items-center justify-center px-4 py-20 sm:px-6">
        <div
          aria-hidden
          className="animate-gradient-bg pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.2),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(59,130,246,0.18),_transparent_50%),linear-gradient(135deg,#0a0f1e_0%,#0d1528_45%,#0a0f1e_100%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl"
        />

        <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-emerald-300 sm:text-sm">
            <span className="animate-pulse-dot inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
            LIVE AI MONITORING
          </div>

          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            AI Health Guardian
          </h1>

          <p className="mb-10 max-w-xl text-base text-slate-300 sm:text-lg">
            Detect health risks instantly using artificial intelligence
          </p>

          <div className="flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href="/analyze"
              className="rounded-xl bg-emerald-500 px-6 py-3 text-center text-base font-semibold text-[#0a0f1e] transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#0a0f1e]"
            >
              Check My Health Now
            </Link>
            <Link
              href="/history"
              className="rounded-xl border border-[#2a3a5c] bg-transparent px-6 py-3 text-center text-base font-semibold text-white transition hover:border-emerald-400/50 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-[#0a0f1e]"
            >
              View History
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
            HOW IT WORKS
          </p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            From symptoms to clarity in three steps
          </h2>
        </div>

        <div
          ref={howItWorks.ref}
          className="grid gap-6 md:grid-cols-3"
        >
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className={`rounded-2xl border border-[#1f2a44] bg-[#111827]/55 p-6 transition hover:border-emerald-500/40 hover:bg-[#111827]/80 ${
                howItWorks.visible ? "animate-fade-up" : "opacity-0"
              }`}
              style={{ animationDelay: howItWorks.visible ? `${index * 0.15}s` : undefined }}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                {step.icon}
              </div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Step {index + 1}
              </p>
              <h3 className="mb-2 text-xl font-semibold text-white">{step.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 border-y border-[#1f2a44] bg-[#0d1424]/80">
        <div
          ref={stats.ref}
          className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-14 sm:px-6 lg:grid-cols-4"
        >
          {STATS.map((stat, index) => (
            <div
              key={stat.label}
              className={`text-center ${stats.visible ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: stats.visible ? `${index * 0.1}s` : undefined }}
            >
              <p className="text-2xl font-bold text-emerald-400 sm:text-3xl">{stat.value}</p>
              <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="relative z-10 mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
          Your health insights, on demand
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-slate-400">
          Built for VoltHacks 2026 — a premium AI health experience that feels like a product, not a prototype.
        </p>
        <Link
          href="/analyze"
          className="inline-flex rounded-xl bg-emerald-500 px-8 py-3.5 font-semibold text-[#0a0f1e] transition hover:bg-emerald-400"
        >
          Start Free Analysis
        </Link>
      </section>

      <footer className="relative z-10 border-t border-[#1f2a44] px-4 py-8 text-center text-sm text-slate-500 sm:px-6">
        Built for VoltHacks 2026 · AI Health Guardian · Powered by Groq AI
      </footer>
    </div>
  );
}
