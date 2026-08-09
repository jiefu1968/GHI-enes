"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Invalid access code");
      return;
    }
    router.push("/chat");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-harvest-border bg-harvest-panel p-8 shadow-glow"
      >
        <div className="mb-6 text-center">
          <div className="text-4xl">🌾</div>
          <h1 className="mt-2 font-serif text-xl tracking-wide text-harvest-gold">
            Global Harvest Initiative
          </h1>
          <p className="mt-1 text-sm text-harvest-textDim">Global Harvest Initiative</p>
        </div>

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-harvest-textDim">
          Access code · Código de acceso
        </label>
        <input
          autoFocus
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="mb-4 w-full rounded-lg border border-white/10 bg-harvest-panel2 px-3 py-2 text-harvest-text outline-none focus:border-harvest-gold"
          placeholder="••••••••"
        />

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading || !code}
          className="w-full rounded-lg bg-harvest-goldDeep px-4 py-2 font-semibold text-harvest-bg transition hover:bg-harvest-gold disabled:opacity-40"
        >
          {loading ? "Checking…" : "Sign in"}
        </button>

        <p className="mt-4 text-center text-xs text-harvest-textDim">
          Are you a mentor? · ¿Eres mentor?{" "}
          <a href="/mentor-login" className="text-harvest-gold hover:underline">
            Sign in as mentor · Ingresar como mentor
          </a>
        </p>
      </form>
    </main>
  );
}
