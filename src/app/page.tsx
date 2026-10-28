"use client";

import { useState, useEffect } from "react";
import ChessBoard from "@/components/ChessBoard";
import TeacherPanel from "@/components/TeacherPanel";
import DailyTask from "@/components/DailyTask";
import Auth from "@/components/Auth";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"play" | "lessons" | "daily">("play");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
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
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <p className="text-neutral-400">Loading...</p>
      </div>
    );
  }

  // Show login/signup if not logged in
  if (!user) {
    return (
      <main className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              ♔ Chess Teacher
            </h1>
            <p className="text-neutral-400 mt-2">
              Learn chess with an AI coach
            </p>
          </div>
          <Auth />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            ♔ Chess Teacher
          </h1>
          <p className="text-neutral-400 mt-1">
            Learn chess with an AI coach • Daily tasks • Interactive lessons
          </p>
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

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto mb-6 flex gap-2">
        {(["play", "lessons", "daily"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-emerald-600 text-white"
                : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            }`}
          >
            {tab === "play" && "Play & Practice"}
            {tab === "lessons" && "Lessons"}
            {tab === "daily" && "Daily Task"}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chess Board Area */}
        <div className="lg:col-span-2">
          <div className="bg-neutral-900 rounded-2xl p-4 md:p-6 border border-neutral-800">
            <ChessBoard />
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {activeTab === "play" && <TeacherPanel />}
          {activeTab === "lessons" && (
            <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
              <h2 className="text-xl font-semibold mb-4">Lessons</h2>
              <p className="text-neutral-400 text-sm">
                Structured lessons coming soon. Start with the basics or jump into tactics.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="p-3 bg-neutral-800 rounded-lg">1. How pieces move</li>
                <li className="p-3 bg-neutral-800 rounded-lg">2. Opening principles</li>
                <li className="p-3 bg-neutral-800 rounded-lg">3. Basic tactics (forks, pins)</li>
              </ul>
            </div>
          )}
          {activeTab === "daily" && <DailyTask />}
        </div>
      </div>
    </main>
  );
}
