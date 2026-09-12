"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";

const SYMPTOM_OPTIONS = [
  "fever",
  "headache",
  "fatigue",
  "chest pain",
  "shortness of breath",
  "nausea",
  "dizziness",
  "cough",
] as const;

type FormErrors = Record<string, string>;

export default function AnalyzePage() {
  const router = useRouter();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [heartRate, setHeartRate] = useState("");
  const [temperature, setTemperature] = useState("");
  const [spo2, setSpo2] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");
  const [age, setAge] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputClass = useMemo(
    () =>
      "w-full rounded-xl border border-[#2a3a5c] bg-[#111827] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500",
    []
  );

  function toggleSymptom(symptom: string) {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  }

  function validate(): FormErrors {
    const next: FormErrors = {};

    const hr = Number(heartRate);
    if (!heartRate.trim() || Number.isNaN(hr) || hr < 20 || hr > 300) {
      next.heartRate = "Heart rate must be a number between 20 and 300.";
    }

    const temp = Number(temperature);
    if (!temperature.trim() || Number.isNaN(temp) || temp < 30 || temp > 45) {
      next.temperature = "Temperature must be a number between 30 and 45 °C.";
    }

    const oxygen = Number(spo2);
    if (!spo2.trim() || Number.isNaN(oxygen) || oxygen < 50 || oxygen > 100) {
      next.spo2 = "Oxygen level must be a number between 50 and 100.";
    }

    if (!bloodPressure.trim()) {
      next.bloodPressure = "Blood pressure is required (e.g. 120/80).";
    } else if (!/^\d{2,3}\s*\/\s*\d{2,3}$/.test(bloodPressure.trim())) {
      next.bloodPressure = "Use a format like 120/80.";
    }

    const ageValue = Number(age);
    if (!age.trim() || Number.isNaN(ageValue) || ageValue < 1 || ageValue > 120) {
      next.age = "Age must be a number between 1 and 120.";
    }

    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symptoms: selectedSymptoms,
          heart_rate: Number(heartRate),
          temperature: Number(temperature),
          spo2: Number(spo2),
          blood_pressure: bloodPressure.trim(),
          age: Number(age),
          user_id: "demo-user",
        }),
      });

      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const detail =
          payload &&
          typeof payload === "object" &&
          "detail" in payload &&
          (payload as { detail: unknown }).detail;

        if (typeof detail === "string") {
          throw new Error(detail);
        }

        if (Array.isArray(detail)) {
          const messages = detail
            .map((item) => {
              if (item && typeof item === "object" && "msg" in item) {
                return String((item as { msg: unknown }).msg);
              }
              return null;
            })
            .filter(Boolean);
          throw new Error(messages.join(" ") || "Invalid input. Please check your values.");
        }

        throw new Error("Unable to analyze your health data. Please try again.");
      }

      localStorage.setItem("healthResult", JSON.stringify(payload));
      router.push("/result");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while contacting the server.";
      setSubmitError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">Enter Your Health Data</h1>
        <p className="mt-2 text-slate-400">
          Select symptoms and enter your vitals for an AI risk assessment.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        <div>
          <label className="mb-3 block text-sm font-medium text-slate-200">Symptoms</label>
          <div className="flex flex-wrap gap-2">
            {SYMPTOM_OPTIONS.map((symptom) => {
              const selected = selectedSymptoms.includes(symptom);
              return (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => toggleSymptom(symptom)}
                  className={`rounded-full border px-3 py-1.5 text-sm capitalize transition ${
                    selected
                      ? "border-emerald-400 bg-emerald-500/20 text-emerald-300"
                      : "border-[#2a3a5c] bg-[#111827] text-slate-300 hover:border-slate-400"
                  }`}
                >
                  {symptom}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="heartRate" className="mb-2 block text-sm font-medium text-slate-200">
              Heart Rate (bpm)
            </label>
            <input
              id="heartRate"
              type="number"
              inputMode="numeric"
              value={heartRate}
              onChange={(e) => setHeartRate(e.target.value)}
              className={inputClass}
              placeholder="e.g. 72"
            />
            {errors.heartRate && (
              <p className="mt-1.5 text-sm text-red-400">{errors.heartRate}</p>
            )}
          </div>

          <div>
            <label htmlFor="temperature" className="mb-2 block text-sm font-medium text-slate-200">
              Temperature (°C)
            </label>
            <input
              id="temperature"
              type="number"
              inputMode="decimal"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className={inputClass}
              placeholder="e.g. 36.8"
            />
            {errors.temperature && (
              <p className="mt-1.5 text-sm text-red-400">{errors.temperature}</p>
            )}
          </div>

          <div>
            <label htmlFor="spo2" className="mb-2 block text-sm font-medium text-slate-200">
              Oxygen Level (%)
            </label>
            <input
              id="spo2"
              type="number"
              inputMode="numeric"
              value={spo2}
              onChange={(e) => setSpo2(e.target.value)}
              className={inputClass}
              placeholder="e.g. 98"
            />
            {errors.spo2 && <p className="mt-1.5 text-sm text-red-400">{errors.spo2}</p>}
          </div>

          <div>
            <label htmlFor="bloodPressure" className="mb-2 block text-sm font-medium text-slate-200">
              Blood Pressure (e.g. 120/80)
            </label>
            <input
              id="bloodPressure"
              type="text"
              value={bloodPressure}
              onChange={(e) => setBloodPressure(e.target.value)}
              className={inputClass}
              placeholder="120/80"
            />
            {errors.bloodPressure && (
              <p className="mt-1.5 text-sm text-red-400">{errors.bloodPressure}</p>
            )}
          </div>

          <div className="sm:col-span-2 sm:max-w-xs">
            <label htmlFor="age" className="mb-2 block text-sm font-medium text-slate-200">
              Age
            </label>
            <input
              id="age"
              type="number"
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className={inputClass}
              placeholder="e.g. 28"
            />
            {errors.age && <p className="mt-1.5 text-sm text-red-400">{errors.age}</p>}
          </div>
        </div>

        {submitError && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-base font-semibold text-[#0a0f1e] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        >
          {loading ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#0a0f1e]/30 border-t-[#0a0f1e]" />
              Analyzing...
            </>
          ) : (
            "Analyze My Health"
          )}
        </button>
      </form>
    </section>
  );
}
