"use client";
import { useId, useState } from "react";
const scenarios = [
  {
    id: "support",
    name: "AI Customer Support",
    intro:
      "Welcome to our fictional business. Ask about services, hours or speaking to a person.",
    prompts: [
      "What services are available?",
      "What are your business hours?",
      "I need a human adviser",
    ],
    reply:
      "We can explain services and collect an enquiry. A staff member confirms availability, scope and pricing.",
  },
  {
    id: "receptionist",
    name: "AI Receptionist",
    intro:
      "You have reached a simulated receptionist. How can we direct your enquiry?",
    prompts: [
      "I would like an appointment",
      "Our office is closed",
      "Please hand me over",
    ],
    reply:
      "I can record an appointment request for staff review. This simulation does not check a real calendar or book a time.",
  },
  {
    id: "lead",
    name: "AI Lead Qualification",
    intro:
      "Let’s qualify a fictional project: what does the business need, and when?",
    prompts: [
      "A retail CRM this quarter",
      "A website; budget to be discussed",
      "Follow up next month",
    ],
    reply:
      "Sample qualification: record the business goal, timing and budget readiness. Route a defined project to discovery; nurture an early enquiry with consent.",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Automation",
    intro:
      "A local preview of an opted-in enquiry workflow. No WhatsApp account is connected.",
    prompts: [
      "Show an enquiry workflow",
      "Customer asks to stop",
      "Send to our sales team",
    ],
    reply:
      "Illustrative flow: receive an opted-in enquiry → identify the topic → create a review task → hand over to staff. Messaging templates, consent and usage fees need separate approval.",
  },
  {
    id: "appointment",
    name: "Appointment Scheduling",
    intro: "Explore a scheduling conversation without creating a booking.",
    prompts: [
      "Request a morning consultation",
      "Can you confirm a time?",
      "What happens next?",
    ],
    reply:
      "Collect the preferred date and timezone, check an approved availability source, then request confirmation. This local demo cannot reserve a real slot.",
  },
];
export default function ConversationDemo({
  initial = "support",
}: {
  initial?: string;
}) {
  const [mode, setMode] = useState(initial);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; text: string }[]>(
    [],
  );
  const id = useId();
  const scenario = scenarios.find((s) => s.id === mode)!;
  function send(text: string) {
    if (!text.trim()) return;
    const reply = /human|hand|sales team/i.test(text)
      ? "Handoff preview: a fictional staff review task is ready. No person has been notified."
      : /stop/i.test(text)
        ? "Opt-out preview: follow-up stops in this example. No real subscription was changed."
        : /hours|closed/i.test(text)
          ? "Business-hours example: a request received outside the configured hours waits for the next staff review. Actual business hours are agreed in implementation."
          : scenario.reply;
    setMessages((current) => [
      ...current.slice(-10),
      { role: "You", text: text.trim() },
      { role: "Simulated assistant", text: reply },
    ]);
    setInput("");
  }
  return (
    <div className="experience">
      <div className="demo-toolbar">
        <span className="demo-badge">Rule-based conversation simulation</span>
        <button
          onClick={() => {
            setMessages([]);
            setInput("");
          }}
        >
          Reset conversation
        </button>
      </div>
      <div className="demo-switches" aria-label="Conversation scenarios">
        {scenarios.map((s) => (
          <button
            key={s.id}
            aria-pressed={mode === s.id}
            onClick={() => {
              setMode(s.id);
              setMessages([]);
              setInput("");
            }}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div className="conversation-layout">
        <aside>
          <h3>{scenario.name}</h3>
          <p>
            No live AI, calls, calendar or messages. Use fictional details only;
            nothing is sent or saved to a server.
          </p>
          <h4>Try a scenario</h4>
          {scenario.prompts.map((p) => (
            <button className="demo-prompt" key={p} onClick={() => send(p)}>
              {p} ↗
            </button>
          ))}
        </aside>
        <div>
          <div
            className="demo-messages"
            role="log"
            aria-label="Simulated conversation"
          >
            <p className="demo-message assistant">{scenario.intro}</p>
            {messages.map((m, i) => (
              <div
                className={`demo-message ${m.role === "You" ? "visitor" : "assistant"}`}
                key={i}
              >
                <span>{m.role}</span>
                <p>{m.text}</p>
              </div>
            ))}
          </div>
          <form
            className="demo-chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <label htmlFor={id}>Your fictional enquiry</label>
            <div>
              <input
                id={id}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={400}
                required
                placeholder="Ask about a sample service…"
              />
              <button className="demo-run" type="submit">
                Send in demo
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
