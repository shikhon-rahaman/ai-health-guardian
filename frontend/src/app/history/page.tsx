"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { API_URL } from "@/lib/config";
import { colorFromScore, scoreFromRiskLevel } from "@/lib/healthScore";

type HistoryItem = {
  id?: string;
  created_at?: string;
  risk_level?: string;
  result?: {
    diagnosis?: string;
  };
  diagnosis?: string;
};

type ChartPoint = {
  date: string;
  fullDate: string;
  score: number;
  risk: string;
};

const RISK_COLORS: Record<string, string> = {
  Low: "#10b981",
  Medium: "#f59e0b",
  High: "#f97316",
  Critical: "#ef4444",
};

function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getDiagnosisPreview(item: HistoryItem): string {
  const diagnosis = item.result?.diagnosis || item.diagnosis || "";
  if (!diagnosis) return "No diagnosis available";
  return diagnosis.length > 90 ? `${diagnosis.slice(0, 90)}…` : diagnosis;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-[#2a3a5c] bg-[#111827] px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-white">{point.fullDate}</p>
      <p className="mt-1 text-slate-300">
        Score: <span style={{ color: colorFromScore(point.score) }}>{point.score}</span>
      </p>
      <p className="text-slate-400">Risk: {point.risk}</p>
    </div>
  );
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setLoading(true);
      setError(false);

      try {
        const response = await fetch(`${API_URL}/history/demo-user`);
        if (!response.ok) {
          throw new Error("Failed to load history");
        }
        const data: unknown = await response.json();
        if (!cancelled) {
          setItems(Array.isArray(data) ? (data as HistoryItem[]) : []);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  const chartData = useMemo(() => {
    // History API returns newest first — reverse for chronological chart
    const chronological = [...items].reverse();
    return chronological.map((item): ChartPoint => {
      const score = scoreFromRiskLevel(item.risk_level || "Medium");
      return {
        date: formatShortDate(item.created_at),
        fullDate: formatDate(item.created_at),
        score,
        risk: item.risk_level || "Unknown",
      };
    });
  }, [items]);

  const avgScore = useMemo(() => {
    if (!chartData.length) return 0;
    return Math.round(
      chartData.reduce((sum, point) => sum + point.score, 0) / chartData.length
    );
  }, [chartData]);

  const lineColor = colorFromScore(avgScore || 50);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Analysis History</h1>
          <p className="mt-2 text-slate-400">Your last 10 health assessments</p>
        </div>
        <Link
          href="/analyze"
          className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-2.5 text-center font-semibold text-[#0a0f1e] transition hover:bg-emerald-400"
        >
          New Analysis
        </Link>
      </div>

      {loading && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading history">
          <div className="skeleton mb-6 h-64 w-full rounded-2xl" />
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="skeleton h-14 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-6 text-center text-red-300">
          Failed to load history. Please try again.
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-xl border border-[#1f2a44] bg-[#111827]/60 px-4 py-10 text-center text-slate-300">
          No analyses yet. Check your health first.
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          {/* Upgrade 3 — Health trend chart */}
          <div className="mb-8 rounded-2xl border border-[#1f2a44] bg-[#111827]/70 p-4 sm:p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Your Health Trend</h2>
            {chartData.length < 2 ? (
              <p className="py-12 text-center text-slate-400">
                Complete at least 2 analyses to see your trend
              </p>
            ) : (
              <div className="h-64 w-full sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={lineColor} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1f2a44" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: "#1f2a44" }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="#64748b"
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: "#1f2a44" }}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke={lineColor}
                      strokeWidth={2.5}
                      fill="url(#scoreGradient)"
                      dot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "#fff", stroke: lineColor, strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#1f2a44]">
            <table className="min-w-full divide-y divide-[#1f2a44] text-left text-sm">
              <thead className="bg-[#111827]">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-300 sm:px-5">Date</th>
                  <th className="px-4 py-3 font-semibold text-slate-300 sm:px-5">Risk Level</th>
                  <th className="px-4 py-3 font-semibold text-slate-300 sm:px-5">Diagnosis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2a44] bg-[#0d1424]">
                {items.map((item, index) => {
                  const risk = item.risk_level || "Unknown";
                  const color = RISK_COLORS[risk] ?? "#64748b";
                  return (
                    <tr key={item.id || `${item.created_at}-${index}`} className="align-top">
                      <td className="whitespace-nowrap px-4 py-4 text-slate-300 sm:px-5">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-4 py-4 sm:px-5">
                        <span
                          className="inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white"
                          style={{ backgroundColor: color }}
                        >
                          {risk}
                        </span>
                      </td>
                      <td className="max-w-md px-4 py-4 text-slate-300 sm:px-5">
                        {getDiagnosisPreview(item)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
