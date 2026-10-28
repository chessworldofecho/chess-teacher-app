"use client";

import { useState } from "react";
import ChessBoard from "@/components/ChessBoard";
import TeacherPanel from "@/components/TeacherPanel";
import DailyTask from "@/components/DailyTask";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"play" | "lessons" | "daily">("play");

  return (
    <main className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          ♔ Chess Teacher
        </h1>
        <p className="text-neutral-400 mt-1">
          Learn chess with an AI coach • Daily tasks • Interactive lessons
        </p>
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
