"use client";

import { useState, useEffect } from "react";
import ChessBoard from "@/components/ChessBoard";
import TeacherPanel from "@/components/TeacherPanel";
import DailyTask from "@/components/DailyTask";
import Auth from "@/components/Auth";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type Section = "home" | "play" | "lesson" | "learn" | "puzzle";
type PlayMode = "menu" | "bot" | "users" | "yourself" | "coach";

export default function Home() {
  const [section, setSection] = useState<Section>("home");
  const [playMode, setPlayMode] = useState<PlayMode>("menu");
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
    setPlayMode("menu");
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
      <main className="min-h-screen bg-neutral-950 text-white relative overflow-hidden">
        {/* Chess pattern background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Header */}
        <header className="relative max-w-5xl mx-auto px-4 pt-8 pb-6 flex items-center justify-between">
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
        <div className="relative max-w-5xl mx-auto px-4 text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-3">
            Improve Your Chess
          </h2>
          <p className="text-neutral-400 text-lg">
            Play, learn, and solve puzzles — completely free
          </p>
        </div>

        {/* Main Action Bubbles */}
        <div className="relative max-w-4xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 gap-5 mb-16">
          <button
            onClick={() => {
              setSection("play");
              setPlayMode("menu");
            }}
            className="group relative bg-gradient-to-br from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 rounded-3xl p-8 text-left transition-all duration-200 shadow-lg hover:shadow-emerald-900/40 hover:-translate-y-1"
          >
            <div className="text-5xl mb-4">♟️</div>
            <h3 className="text-2xl font-bold mb-2">Play Game</h3>
            <p className="text-emerald-100 text-sm">
              Play against bots, friends, or the coach
            </p>
          </button>

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
      </main>
    );
  }

  // ========== PLAY MENU ==========
  if (section === "play" && playMode === "menu") {
    return (
      <main className="min-h-screen bg-neutral-950 text-white relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-3xl mx-auto px-4 pt-8">
          <button
            onClick={() => setSection("home")}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition text-sm mb-8"
          >
            ← Back to Home
          </button>

          <h2 className="text-3xl font-bold mb-2">Play Chess</h2>
          <p className="text-neutral-400 mb-10">Choose how you want to play</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Play vs Bot */}
            <button
              onClick={() => setPlayMode("bot")}
              className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-2xl p-6 text-left transition-all hover:-translate-y-0.5"
            >
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="text-xl font-bold mb-1">Play vs Bot</h3>
              <p className="text-neutral-400 text-sm">
                Challenge the computer with different difficulty levels
              </p>
            </button>

            {/* Play vs Other Users */}
            <button
              onClick={() => setPlayMode("users")}
              className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-2xl p-6 text-left transition-all hover:-translate-y-0.5"
            >
              <div className="text-4xl mb-3">👥</div>
              <h3 className="text-xl font-bold mb-1">Play vs Players</h3>
              <p className="text-neutral-400 text-sm">
                Play online against other users around the world
              </p>
            </button>

            {/* Play vs Yourself */}
            <button
              onClick={() => setPlayMode("yourself")}
              className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-2xl p-6 text-left transition-all hover:-translate-y-0.5"
            >
              <div className="text-4xl mb-3">🧘</div>
              <h3 className="text-xl font-bold mb-1">Play vs Yourself</h3>
              <p className="text-neutral-400 text-sm">
                Free practice board — move both sides
              </p>
            </button>

            {/* Play vs Coach */}
            <button
              onClick={() => setPlayMode("coach")}
              className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-2xl p-6 text-left transition-all hover:-translate-y-0.5"
            >
              <div className="text-4xl mb-3">🎓</div>
              <h3 className="text-xl font-bold mb-1">Play vs Coach</h3>
              <p className="text-neutral-400 text-sm">
                Play while the coach gives you tips and feedback
              </p>
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ========== OTHER SECTIONS / PLAY MODES ==========
  return (
    <main className="min-h-screen bg-neutral-950 text-white p-4 md:p-6">
      {/* Top bar */}
      <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between">
        <button
          onClick={() => {
            if (section === "play" && playMode !== "menu") {
              setPlayMode("menu");
            } else {
              setSection("home");
              setPlayMode("menu");
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition text-sm"
        >
          ← Back
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

      {/* PLAY vs BOT / YOURSELF / COACH */}
      {(playMode === "bot" || playMode === "yourself" || playMode === "coach") && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-neutral-900 rounded-2xl p-4 md:p-6 border border-neutral-800">
              <ChessBoard />
            </div>
          </div>
          <div>
            {playMode === "coach" ? (
              <TeacherPanel />
            ) : (
              <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
                <h3 className="font-semibold mb-2">
                  {playMode === "bot" && "Playing vs Bot"}
                  {playMode === "yourself" && "Free Practice"}
                </h3>
                <p className="text-neutral-400 text-sm">
                  {playMode === "bot" && "Choose difficulty on the board controls."}
                  {playMode === "yourself" && "You control both White and Black."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PLAY vs USERS (coming soon) */}
      {playMode === "users" && (
        <div className="max-w-xl mx-auto text-center py-20">
          <div className="text-6xl mb-6">🌍</div>
          <h2 className="text-2xl font-bold mb-3">Play vs Other Players</h2>
          <p className="text-neutral-400 mb-6">
            Online multiplayer is coming soon. We will add matchmaking so you can play against real people around the world.
          </p>
          <button
            onClick={() => setPlayMode("menu")}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-medium transition"
          >
            Back to Play Menu
          </button>
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
