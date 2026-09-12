"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { API_URL } from "@/lib/config";

type ChatRole = "user" | "assistant";

type ChatBubble = {
  id: string;
  role: ChatRole;
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatBubble[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi — I'm your AI Health Assistant. Ask me about symptoms, vitals, or general wellness. For emergencies, call 112.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setError("");
    setInput("");

    const userMessage: ChatBubble = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setLoading(true);

    // Last 5 messages (excluding the welcome-only edge cases) for backend context
    const historyPayload = nextMessages
      .filter((m) => m.id !== "welcome")
      .slice(-5)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: historyPayload.slice(0, -1), // prior context only; message sent separately
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
        throw new Error(
          typeof detail === "string"
            ? detail
            : "Unable to reach the health assistant. Please try again."
        );
      }

      const reply =
        payload &&
        typeof payload === "object" &&
        "response" in payload &&
        typeof (payload as { response: unknown }).response === "string"
          ? (payload as { response: string }).response
          : null;

      if (!reply) {
        throw new Error("Received an empty response from the assistant.");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: reply,
        },
      ]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-65px)] max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">Ask AI Health Assistant</h1>
        <p className="mt-2 text-slate-400">
          Get clear, responsible answers to your health questions.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[#1f2a44] bg-[#111827]/60">
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5" style={{ maxHeight: "58vh" }}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%] sm:text-base ${
                  message.role === "user"
                    ? "rounded-br-md bg-emerald-500 text-[#0a0f1e]"
                    : "rounded-bl-md border border-[#2a3a5c] bg-[#0d1424] text-slate-200"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-[#2a3a5c] bg-[#0d1424] px-4 py-3 text-sm text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-400/30 border-t-emerald-400" />
                  Thinking…
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="border-t border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 border-t border-[#1f2a44] p-4 sm:flex-row sm:items-end"
        >
          <label htmlFor="chat-input" className="sr-only">
            Your health question
          </label>
          <textarea
            id="chat-input"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about symptoms, vitals, or wellness…"
            className="w-full resize-none rounded-xl border border-[#2a3a5c] bg-[#0a0f1e] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="shrink-0 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-[#0a0f1e] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Send
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">
        Not a substitute for professional medical advice. Seek emergency care when needed.
      </p>
    </section>
  );
}
