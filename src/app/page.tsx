"use client";

import { useState, useEffect } from "react";
import ChessBoard from "@/components/ChessBoard";
import TeacherPanel from "@/components/TeacherPanel";
import DailyTask from "@/components/DailyTask";
import Auth from "@/components/Auth";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type Section = "home" | "play" | "lesson" | "learn" | "puzzle";

export default function Home() {
  const [section, setSection] = useState<Section>("home");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setSection("home");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <p className="text-neutral-400">Loading...</p>
      </div>
    );
  }

  // Login screen
  if (!user) {
    return (
      <main className="min-h-screen p-4 md:p-8 flex items-center justify-center bg-neutral-950">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight">♔ Chess Teacher</h1>
            <p className="text-neutral-400 mt-2">Learn chess with an AI coach</p>
          </div>
          <Auth />
        </div>
      </main>
    );
  }

  // ========== HOME PAGE ==========
  if (section === "home") {
    return (
      <main className="min-h-screen bg-neutral-950 text-white">
        {/* Header */}
        <header className="max-w-5xl mx-auto px-4 pt-8 pb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">♔</span>
            <h1 className="text-2xl font-bold">Chess Teacher</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-400 hidden sm:inline">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Hero */}
        <div className="max-w-5xl mx-auto px-4 text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-3">
            Improve Your Chess
          </h2>
          <p className="text-neutral-400 text-lg">
            Play, learn, and solve puzzles — completely free
          </p>
        </div>

        {/* Main Action Bubbles */}
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 gap-5 mb-16">
          {/* Play Game */}
          <button
            onClick={() => setSection("play")}
            className="group relative bg-gradient-to-br from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 rounded-3xl p-8 text-left transition-all duration-200 shadow-lg hover:shadow-emerald-900/40 hover:-translate-y-1"
          >
            <div className="text-5xl mb-4">♟️</div>
            <h3 className="text-2xl font-bold mb-2">Play Game</h3>
            <p className="text-emerald-100 text-sm">
              Play against the computer with different difficulty levels
            </p>
          </button>

          {/* Take Lesson */}
          <button
            onClick={() => setSection("lesson")}
            className="group relative bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 rounded-3xl p-8 text-left transition-all duration-200 shadow-lg hover:shadow-blue-900/40 hover:-translate-y-1"
          >
            <div className="text-5xl mb-4">📚</div>
            <h3 className="text-2xl font-bold mb-2">Take Lesson</h3>
            <p className="text-blue-100 text-sm">
              Structured lessons from beginner to advanced
            </p>
          </button>

          {/* Learn */}
          <button
            onClick={() => setSection("learn")}
            className="group relative bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 rounded-3xl p-8 text-left transition-all duration-200 shadow-lg hover:shadow-purple-900/40 hover:-translate-y-1"
          >
            <div className="text-5xl mb-4">🧠</div>
            <h3 className="text-2xl font-bold mb-2">Learn</h3>
            <p className="text-purple-100 text-sm">
              Ask the AI teacher anything about chess
            </p>
          </button>

          {/* Puzzle */}
          <button
            onClick={() => setSection("puzzle")}
            className="group relative bg-gradient-to-br from-orange-600 to-orange-800 hover:from-orange-500 hover:to-orange-700 rounded-3xl p-8 text-left transition-all duration-200 shadow-lg hover:shadow-orange-900/40 hover:-translate-y-1"
          >
            <div className="text-5xl mb-4">🧩</div>
            <h3 className="text-2xl font-bold mb-2">Puzzle</h3>
            <p className="text-orange-100 text-sm">
              Solve daily puzzles and train your tactics
            </p>
          </button>
        </div>

        {/* Footer tip */}
        <p className="text-center text-neutral-500 text-sm pb-10">
          Choose a mode above to get started
        </p>
      </main>
    );
  }

  // ========== OTHER SECTIONS ==========
  return (
    <main className="min-h-screen bg-neutral-950 text-white p-4 md:p-6">
      {/* Top bar with back button */}
      <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between">
        <button
          onClick={() => setSection("home")}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition text-sm"
        >
          ← Back to Home
        </button>

        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-400 hidden sm:inline">
            {user.email}
          </span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* PLAY SECTION */}
      {section === "play" && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-neutral-900 rounded-2xl p-4 md:p-6 border border-neutral-800">
              <ChessBoard />
            </div>
          </div>
          <div>
            <TeacherPanel />
          </div>
        </div>
      )}

      {/* LESSON SECTION */}
      {section === "lesson" && (
        <div className="max-w-3xl mx-auto">
          <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
            <h2 className="text-2xl font-bold mb-2">Lessons</h2>
            <p className="text-neutral-400 mb-6">
              Structured lessons to improve your chess step by step
            </p>

            <div className="space-y-3">
              {[
                { title: "1. How the Pieces Move", level: "Beginner" },
                { title: "2. Opening Principles", level: "Beginner" },
                { title: "3. Basic Tactics – Forks", level: "Beginner" },
                { title: "4. Basic Tactics – Pins & Skewers", level: "Intermediate" },
                { title: "5. King Safety & Castling", level: "Intermediate" },
                { title: "6. Simple Endgames", level: "Intermediate" },
              ].map((lesson, i) => (
                <button
                  key={i}
                  className="w-full flex items-center justify-between p-4 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition text-left"
                >
                  <span className="font-medium">{lesson.title}</span>
                  <span className="text-xs px-2 py-1 bg-neutral-700 rounded-full text-neutral-300">
                    {lesson.level}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LEARN SECTION */}
      {section === "learn" && (
        <div className="max-w-2xl mx-auto">
          <TeacherPanel />
        </div>
      )}

      {/* PUZZLE SECTION */}
      {section === "puzzle" && (
        <div className="max-w-2xl mx-auto">
          <DailyTask />
        </div>
      )}
    </main>
  );
}
