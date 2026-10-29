"use client";

import { useState, useEffect } from "react";

type TeacherPanelProps = {
  /** Live analysis text from the board when Analysis is on */
  analysisFeedback?: string | null;
};

export default function TeacherPanel({ analysisFeedback }: TeacherPanelProps) {
  const [message, setMessage] = useState(
    "Hello! I'm your Chess Teacher. Ask me anything about openings, tactics, endgames, or the current game. Turn on Analysis on the board for move-by-move tips."
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (analysisFeedback) {
      setMessage(analysisFeedback);
    }
  }, [analysisFeedback]);

  async function sendMessage(questionOverride?: string) {
    const question = (questionOverride ?? input).trim();
    if (!question || loading) return;

    setLoading(true);
    setMessage("Thinking...");
    setInput("");

    try {
      const res = await fetch("/api/teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          context: analysisFeedback || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(
          data?.error ||
            "Could not reach the teacher. Check that GEMINI_API_KEY is set on the server."
        );
        return;
      }

      setMessage(`You asked: "${question}"\n\n${data.answer}`);
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800 h-full flex flex-col">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>♟</span> Chess Teacher
      </h2>

      <div className="flex-1 bg-neutral-950 rounded-xl p-4 mb-4 text-sm leading-relaxed overflow-y-auto min-h-[180px] whitespace-pre-wrap">
        {message}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask the teacher anything..."
          disabled={loading}
          className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-60"
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition"
        >
          {loading ? "..." : "Ask"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {["Explain openings", "Show a fork", "King safety tips"].map((q) => (
          <button
            key={q}
            onClick={() => sendMessage(q)}
            disabled={loading}
            className="text-xs px-3 py-1 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 rounded-full transition"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
