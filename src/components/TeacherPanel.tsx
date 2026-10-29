"use client";

import { useState, useEffect } from "react";

const sampleTips = [
  "Control the center with your pawns and pieces early in the game.",
  "Develop your knights and bishops before moving the same piece twice.",
  "Castle early to keep your king safe.",
  "Look for forks – attacking two pieces at once is powerful.",
  "Don't bring your queen out too early.",
];

type TeacherPanelProps = {
  /** Live analysis text from the board when Analysis is on */
  analysisFeedback?: string | null;
};

export default function TeacherPanel({ analysisFeedback }: TeacherPanelProps) {
  const [message, setMessage] = useState(
    "Hello! I'm your Chess Teacher. Turn on Analysis on the board to get feedback after every move, or ask me anything below."
  );
  const [input, setInput] = useState("");

  useEffect(() => {
    if (analysisFeedback) {
      setMessage(analysisFeedback);
    }
  }, [analysisFeedback]);

  function sendMessage() {
    if (!input.trim()) return;

    setMessage(
      `You asked: "${input}"\n\nGreat question! (Full AI teacher coming soon). For now, remember: ${
        sampleTips[Math.floor(Math.random() * sampleTips.length)]
      }`
    );
    setInput("");
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
          className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition"
        >
          Ask
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {["Explain openings", "Show a fork", "King safety tips"].map((q) => (
          <button
            key={q}
            onClick={() => {
              setInput(q);
            }}
            className="text-xs px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded-full transition"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
