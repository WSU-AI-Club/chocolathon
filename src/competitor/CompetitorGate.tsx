/* The gate. One field, one button, no account to create.

   Copy note: it never says "password". Students who read "password"
   go looking for one they set. They were emailed a team code, so the
   screen says team code, everywhere, including the error. */

import { useState } from "react";

export default function CompetitorGate({
  onUnlocked,
}: {
  onUnlocked: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Try again.");
        setBusy(false);
        return;
      }
      onUnlocked();
    } catch {
      setError("Could not reach the server. Check your connection.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-5 py-16">
      <div className="w-full max-w-sm text-center">
        <p className="eyebrow mb-4">Competitors only</p>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink">
          Chocolathon HQ
        </h1>
        <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-ink/60">
          Prompts, rules, and everything you need for September 19. Enter the
          team code we emailed you.
        </p>

        <form onSubmit={submit} className="mt-9 text-left">
          <label
            htmlFor="team-code"
            className="block font-mono text-[10px] uppercase tracking-[0.16em] text-ink/45"
          >
            Team code
          </label>
          <input
            id="team-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="cocoa-1234"
            className="mt-2 w-full rounded-none border-0 border-b-2 border-ink/20 bg-transparent px-0 py-3 font-mono text-lg tracking-[0.06em] text-ink outline-none transition-colors placeholder:text-ink/25 focus:border-gold"
          />

          {error ? (
            <p
              role="alert"
              className="mt-4 border-l-2 border-gold pl-3 text-sm leading-relaxed text-ink/70"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy || !code.trim()}
            className="btn-cta mt-7 w-full justify-center disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Checking…" : "Enter"}
          </button>
        </form>

        <p className="mt-8 text-xs leading-relaxed text-ink/45">
          Registered but no code yet? Codes go out after registration closes on
          September 10.{" "}
          <a
            href="mailto:aiclub@wichita.edu"
            className="text-ink/70 underline decoration-gold underline-offset-4"
          >
            aiclub@wichita.edu
          </a>
        </p>

        <p className="mt-10">
          <a
            href="/"
            className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40 no-underline hover:text-ink/70"
          >
            ← Back to the event page
          </a>
        </p>
      </div>
    </div>
  );
}
