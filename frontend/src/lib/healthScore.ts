/**
 * Shared health score helpers used by result + history pages.
 */

export type RiskLevel = "Low" | "Medium" | "High" | "Critical" | string;

/** Representative score within each risk band (0–100). */
export function scoreFromRiskLevel(riskLevel: RiskLevel): number {
  switch (riskLevel) {
    case "Low":
      return 92;
    case "Medium":
      return 70;
    case "High":
      return 40;
    case "Critical":
      return 12;
    default:
      return 50;
  }
}

export function colorFromScore(score: number): string {
  if (score >= 85) return "#10b981";
  if (score >= 55) return "#f59e0b";
  if (score >= 25) return "#f97316";
  return "#ef4444";
}

export function colorFromRiskLevel(riskLevel: RiskLevel): string {
  return colorFromScore(scoreFromRiskLevel(riskLevel));
}

/** Subtle emergency beep via Web Audio API — no external audio file. */
export function playAlertBeep(): void {
  if (typeof window === "undefined") return;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const beep = (start: number, freq: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    };

    beep(now, 880, 0.18);
    beep(now + 0.28, 660, 0.22);

    window.setTimeout(() => {
      void ctx.close();
    }, 800);
  } catch {
    // Ignore audio failures (autoplay policy, unsupported browsers)
  }
}
