"use client";

import { useState } from "react";

export default function DailyTask() {
  const [completed, setCompleted] = useState(false);
  const [streak, setStreak] = useState(3); // demo value

  return (
    <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
      <h2 className="text-xl font-semibold mb-1">Daily Task</h2>
      <p className="text-neutral-400 text-sm mb-6">Complete today's challenge to keep your streak alive</p>

      <div className="bg-neutral-950 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-emerald-400">Today's Puzzle</span>
          <span className="text-xs bg-neutral-800 px-2 py-1 rounded">Easy</span>
        </div>
        <p className="text-sm mb-4">
          White to move. Find the best move that wins material.
        </p>
        <div className="text-xs text-neutral-500">
          (Interactive puzzle board will appear here soon)
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-400">Current streak</p>
          <p className="text-2xl font-bold text-orange-400">{streak} days 🔥</p>
        </div>

        <button
          onClick={() => {
            setCompleted(true);
            setStreak((s) => s + 1);
          }}
          disabled={completed}
          className={`px-5 py-2.5 rounded-xl font-medium transition ${
            completed
              ? "bg-neutral-700 text-neutral-400 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-500 text-white"
          }`}
        >
          {completed ? "Completed ✓" : "Mark as Done"}
        </button>
      </div>
    </div>
  );
}
