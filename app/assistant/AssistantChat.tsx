"use client";
import { useRef, useState, type FormEvent } from "react";
import { assistantTestCases } from "../config/assistantTestCases";
type Answer = { text: string; links: { label: string; href: string }[] };
type Turn = { question: string; answers: Answer[] };
export default function AssistantChat({
  stagingTest = false,
}: {
  stagingTest?: boolean;
}) {
  const [testCase, setTestCase] = useState(assistantTestCases[0]);
  const [turns, setTurns] = useState<Turn[]>([]),
    [question, setQuestion] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null),
    sequence = useRef(0);
  function clear() {
    sequence.current++;
    controller.current?.abort();
    setTurns([]);
    setQuestion("");
    setError("");
    // Keep the local send lock until the aborted fetch has actually settled.
  }
  async function send(e: FormEvent) {
    e.preventDefault();
    if (controller.current || !question.trim()) return;
    const current = ++sequence.current;
    const q = question.trim();
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-monetcore-request-id": crypto.randomUUID(),
          ...(stagingTest ? { "x-monetcore-test-case": testCase } : {}),
        },
        body: JSON.stringify({
          messages: [...turns.slice(-5).map((t) => t.question), q],
        }),
        signal: abort.signal,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error ||
            "The assistant is unavailable. Please contact Monetcore.",
        );
      if (current === sequence.current) {
        setTurns((t) => [
          ...t.slice(-9),
          { question: q, answers: data.answers },
        ]);
        setQuestion("");
      }
    } catch (e) {
      if (current === sequence.current)
        setError(
          e instanceof Error ? e.message : "Please contact Monetcore directly.",
        );
    } finally {
      if (controller.current === abort) {
        setBusy(false);
        controller.current = null;
      }
    }
  }
  return (
    <section
      aria-label="Monetcore AI conversation"
      className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold">Ask about Monetcore</h2>
        <button
          type="button"
          onClick={clear}
          className="min-h-11 rounded-xl border border-slate-400 px-4 font-semibold"
        >
          Clear Conversation
        </button>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">Example questions</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {[
          "What services do you offer?",
          "What does Smart Starter include?",
          "What does annual renewal cover?",
          "Is the AI Receptionist available?",
        ].map((q) => (
          <button
            key={q}
            type="button"
            disabled={busy}
            onClick={() => setQuestion(q)}
            className="min-h-11 rounded-xl bg-blue-50 px-3 py-2 text-left text-sm font-semibold text-blue-900 disabled:opacity-60"
          >
            {q}
          </button>
        ))}
      </div>
      <div
        role="log"
        aria-label="Conversation history"
        aria-live="polite"
        aria-relevant="additions"
        className="mt-6 space-y-6 break-words"
      >
        {turns.map((t, i) => (
          <div key={i}>
            <p className="rounded-2xl bg-indigo-50 p-4">
              <strong>You: </strong>
              {t.question}
            </p>
            {t.answers.map((a, j) => (
              <div
                key={j}
                className="mt-3 rounded-2xl border border-slate-200 p-4 leading-7"
              >
                <p>
                  <strong>Monetcore AI Assistant: </strong>
                  {a.text}
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {a.links.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      className="font-semibold text-blue-800 underline underline-offset-4"
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <form onSubmit={send} className="mt-6">
        {stagingTest && (
          <label
            className="mb-5 block text-sm font-semibold"
            htmlFor="assistant-test-case"
          >
            Synthetic staging test case
            <select
              id="assistant-test-case"
              value={testCase}
              onChange={(e) => setTestCase(e.target.value)}
              disabled={busy}
              className="mt-2 block min-h-11 w-full rounded-xl border border-slate-500 bg-white p-3 text-slate-950"
            >
              {assistantTestCases.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
            <span className="mt-2 block font-normal text-slate-600">
              Use fictional questions only. Direct owner testing has no shared
              request allowance or spending cap. Failed requests may incur charges.
            </span>
          </label>
        )}
        <label htmlFor="assistant-question" className="font-semibold">
          Your question
        </label>
        <textarea
          id="assistant-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
          maxLength={1000}
          rows={3}
          aria-describedby="assistant-help"
          className="mt-2 w-full rounded-xl border border-slate-500 bg-white p-3 text-slate-950"
        />
        <p id="assistant-help" className="mt-2 text-sm text-slate-600">
          Up to 1,000 characters. Please do not share personal, sensitive or
          confidential information. Conversation history stays in page memory
          and clears when you leave or reload this page.
        </p>
        <button
          disabled={busy}
          className="mt-4 min-h-11 rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Checking approved information…" : "Ask Monetcore"}
        </button>
        <p role="status" className="mt-3 text-sm text-slate-700">
          {busy ? "Waiting for the assistant." : ""}
        </p>
        {error && (
          <p
            role="alert"
            className="mt-3 rounded-xl border border-red-300 bg-red-50 p-4 text-red-900"
          >
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
