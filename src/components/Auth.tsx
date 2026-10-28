"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const supabase = createClient();

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setMessage("Logged in successfully!");
        window.location.reload(); // simple refresh for now
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage("Check your email for the confirmation link!");
      }
    } catch (error: any) {
      setMessage(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  return (
    <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
      <h2 className="text-xl font-semibold mb-4">
        {isLogin ? "Login" : "Sign Up"}
      </h2>

      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label className="block text-sm text-neutral-400 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            placeholder="••••••••"
          />
        </div>

        {message && (
          <p
            className={`text-sm ${
              message.includes("successfully") || message.includes("Check")
                ? "text-emerald-400"
                : "text-red-400"
            }`}
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-700 rounded-lg font-medium transition"
        >
          {loading ? "Loading..." : isLogin ? "Login" : "Create Account"}
        </button>
      </form>

      <p className="mt-4 text-sm text-center text-neutral-400">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setMessage("");
          }}
          className="text-emerald-400 hover:underline"
        >
          {isLogin ? "Sign up" : "Login"}
        </button>
      </p>
    </div>
  );
}
