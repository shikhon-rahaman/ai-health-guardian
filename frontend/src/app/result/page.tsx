"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  colorFromScore,
  playAlertBeep,
  scoreFromRiskLevel,
} from "@/lib/healthScore";

type HealthResult = {
  risk_level: "Low" | "Medium" | "High" | "Critical" | string;
  diagnosis: string;
  recommendations: string[];
  disclaimer: string;
};

const RING_SIZE = 220;
const STROKE = 14;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function isValidResult(value: unknown): value is HealthResult {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.risk_level === "string" &&
    typeof obj.diagnosis === "string" &&
    Array.isArray(obj.recommendations) &&
    typeof obj.disclaimer === "string"
  );
}

function HealthScoreRing({ score }: { score: number }) {
  const [displayScore, setDisplayScore] = useState(0);
  const [progress, setProgress] = useState(0);
  const color = colorFromScore(score);

  useEffect(() => {
    let frame = 0;
    const duration = 1500;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayScore(Math.round(score * eased));
      setProgress(eased);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const offset = CIRCUMFERENCE * (1 - (progress * score) / 100);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          className="rotate-[-90deg]"
          aria-hidden
        >
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="#1f2a44"
            strokeWidth={STROKE}
          />
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{
              filter: `drop-shadow(0 0 10px ${color}66)`,
              transition: "stroke 0.3s ease",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-5xl font-bold tabular-nums tracking-tight sm:text-6xl"
            style={{ color }}
          >
            {displayScore}
          </span>
          <span className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            / 100
          </span>
        </div>
      </div>
      <p className="mt-4 text-lg font-semibold text-white">Health Score</p>
      <p className="mt-1 text-sm text-slate-400">AI-assessed wellness index</p>
    </div>
  );
}

export default function ResultPage() {
  const [result, setResult] = useState<HealthResult | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("healthResult");
      if (!raw) {
        setResult(null);
      } else {
        const parsed: unknown = JSON.parse(raw);
        setResult(isValidResult(parsed) ? parsed : null);
      }
    } catch {
      setResult(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (result?.risk_level === "Critical") {
      playAlertBeep();
    }
  }, [result]);

  const score = useMemo(
    () => (result ? scoreFromRiskLevel(result.risk_level) : 0),
    [result]
  );
  const riskColor = useMemo(
    () => (result ? colorFromScore(score) : "#94a3b8"),
    [result, score]
  );

  if (!loaded) {
    return (
      <section className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center px-4 py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400/30 border-t-emerald-400" />
      </section>
    );
  }

  if (!result) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="mb-3 text-2xl font-bold text-white sm:text-3xl">No result found</h1>
        <p className="mb-8 text-slate-400">
          Run a health analysis first to see your AI risk assessment here.
        </p>
        <Link
          href="/analyze"
          className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-[#0a0f1e] transition hover:bg-emerald-400"
        >
          Go to Analyze
        </Link>
      </section>
    );
  }

  const isCritical = result.risk_level === "Critical";
  const isHigh = result.risk_level === "High";

  return (
    <div className="relative">
      {/* Upgrade 2 — Emergency / High alert banners */}
      {isCritical && (
        <div className="animate-alert-flash w-full border-b border-red-500/60 bg-red-600 px-4 py-3 text-center sm:px-6">
          <p className="text-sm font-bold text-white sm:text-base">
            ⚠️ CRITICAL HEALTH RISK DETECTED — Call emergency services immediately: 112
          </p>
        </div>
      )}
      {isHigh && (
        <div className="w-full border-b border-orange-500/50 bg-orange-500/20 px-4 py-3 text-center sm:px-6">
          <p className="text-sm font-semibold text-orange-200 sm:text-base">
            ⚠️ High Risk Detected — Please consult a doctor today
          </p>
        </div>
      )}

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Upgrade 1 — Animated health score hero */}
        <div className="mb-10 flex flex-col items-center">
          <HealthScoreRing score={score} />
          <div
            className={`mt-6 inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold text-white ${
              isCritical ? "animate-critical-pulse" : ""
            }`}
            style={{ backgroundColor: riskColor }}
          >
            Risk: {result.risk_level}
          </div>
        </div>

        {(isCritical || isHigh) && (
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {isCritical && (
              <a
                href="tel:112"
                className="animate-critical-pulse inline-flex items-center justify-center rounded-xl bg-red-600 px-8 py-4 text-lg font-bold text-white transition hover:bg-red-500"
              >
                CALL 112
              </a>
            )}
            {isHigh && (
              <a
                href="https://www.google.com/maps/search/doctor+near+me"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-orange-400"
              >
                Find Nearby Doctor
              </a>
            )}
          </div>
        )}

        <div className="mb-8 rounded-2xl border border-[#1f2a44] bg-[#111827]/70 p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xl" aria-hidden>
              🩺
            </span>
            <h2 className="text-xl font-semibold text-white">AI Diagnosis</h2>
          </div>
          <p className="leading-relaxed text-slate-300">{result.diagnosis}</p>
        </div>

        <div className="mb-8 rounded-2xl border border-[#1f2a44] bg-[#111827]/70 p-5 sm:p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">Recommendations</h2>
          <ul className="space-y-3">
            {(result.recommendations ?? []).slice(0, 5).map((item, index) => (
              <li key={`${index}-${item}`} className="flex items-start gap-3 text-slate-300">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm text-emerald-400">
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mb-8 text-xs leading-relaxed text-slate-500 sm:text-sm">
          {result.disclaimer}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/analyze"
            className="rounded-xl bg-emerald-500 px-6 py-3 text-center font-semibold text-[#0a0f1e] transition hover:bg-emerald-400"
          >
            Check Again
          </Link>
          <Link
            href="/history"
            className="rounded-xl border border-[#2a3a5c] px-6 py-3 text-center font-semibold text-white transition hover:border-emerald-400/50 hover:bg-white/5"
          >
            View History
          </Link>
        </div>
      </section>
    </div>
  );
}
