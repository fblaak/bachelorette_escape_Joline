"use client";

import { useEffect, useMemo, useState } from "react";
import type { PlayerStateResponse } from "@/lib/types";

const TEAM_THEME: Record<
  string,
  {
    page: string;
    card: string;
    subtleCard: string;
    text: string;
    button: string;
    input: string;
  }
> = {
  red: {
    page: "bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500",
    card: "bg-white/18 border-white/30",
    subtleCard: "bg-white/14 border-white/25",
    text: "text-white",
    button: "bg-white text-rose-600 hover:bg-rose-50",
    input: "bg-white text-zinc-900 placeholder:text-zinc-400",
  },
  blue: {
    page: "bg-gradient-to-br from-sky-500 via-cyan-500 to-blue-600",
    card: "bg-white/18 border-white/30",
    subtleCard: "bg-white/14 border-white/25",
    text: "text-white",
    button: "bg-white text-sky-700 hover:bg-sky-50",
    input: "bg-white text-zinc-900 placeholder:text-zinc-400",
  },
  green: {
    page: "bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600",
    card: "bg-white/18 border-white/30",
    subtleCard: "bg-white/14 border-white/25",
    text: "text-white",
    button: "bg-white text-emerald-700 hover:bg-emerald-50",
    input: "bg-white text-zinc-900 placeholder:text-zinc-400",
  },
  yellow: {
    page: "bg-gradient-to-br from-amber-300 via-yellow-300 to-orange-300",
    card: "bg-white/55 border-white/70",
    subtleCard: "bg-white/45 border-white/60",
    text: "text-amber-950",
    button: "bg-amber-950 text-white hover:bg-amber-900",
    input: "bg-white text-zinc-900 placeholder:text-zinc-400",
  },
};

const DEFAULT_THEME = {
  page:
    "bg-[linear-gradient(135deg,#fb7185_0%,#f472b6_25%,#60a5fa_50%,#34d399_75%,#facc15_100%)]",
  card: "bg-white/80 border-white/90",
  subtleCard: "bg-white/65 border-white/80",
  text: "text-rose-950",
  button: "bg-rose-600 text-white hover:bg-rose-700",
  input: "bg-white text-zinc-900 placeholder:text-zinc-400",
};

const COLOR_LABELS: Record<string, string> = {
  red: "rood",
  blue: "blauw",
  green: "groen",
  yellow: "geel",
};

function getColorLabel(color?: string | null) {
  if (!color) return "";
  return COLOR_LABELS[color.toLowerCase()] ?? color;
}

export default function PlayPage() {
  const [state, setState] = useState<PlayerStateResponse | null>(null);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    const playerId = localStorage.getItem("playerId");
    const sessionId = localStorage.getItem("playerSessionId");

    async function loadState() {
      if (!playerId || !sessionId) {
        setError("Geen actieve spelersessie gevonden");
        return;
      }

      try {
        const res = await fetch(
          `/api/player-state?playerId=${playerId}&sessionId=${sessionId}`,
          { cache: "no-store" }
        );

        const json = await res.json();

        if (!res.ok) {
          setError(json.error ?? "Kon spelerstatus niet laden");
          return;
        }

        setState(json);
        setError("");
      } catch {
        setError("Kon spelerstatus niet laden");
      }
    }

    loadState();
    const interval = setInterval(loadState, 3000);
    return () => clearInterval(interval);
  }, []);

  async function submitFinalCode() {
    const playerId = localStorage.getItem("playerId");
    const sessionId = localStorage.getItem("playerSessionId");

    try {
      const res = await fetch("/api/submit-final-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId, sessionId, code }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Onbekende fout");
        return;
      }

      setError("");
      setCode("");
    } catch {
      setError("Versturen mislukt");
    }
  }

const theme = useMemo(() => {
  const color = state?.color?.toLowerCase?.() ?? "";
  const useTeamColor =
    state?.currentScreen === "show_color" ||
    state?.currentScreen === "solve_clue";

  if (useTeamColor) {
    return TEAM_THEME[color] ?? DEFAULT_THEME;
  }

  return DEFAULT_THEME;
}, [state?.color, state?.currentScreen]);

  if (!state) {
    return (
      <main
        className={`min-h-screen ${theme.page} ${theme.text} flex items-center justify-center p-6`}
      >
        <div
          className={`rounded-[32px] border ${theme.card} px-8 py-6 text-lg font-semibold shadow-xl backdrop-blur`}
        >
          Laden...
        </div>
      </main>
    );
  }

  return (
    <main
      className={`min-h-screen ${theme.page} ${theme.text} flex items-center justify-center p-4 sm:p-6`}
    >
      <div className="w-full max-w-md">
        <div
          className={`rounded-[36px] border ${theme.card} p-6 sm:p-8 text-center shadow-2xl backdrop-blur`}
        >
          <p className="text-xs uppercase tracking-[0.35em] opacity-75">
            Bachelorette Escape
          </p>

          <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
            {state.roundTitle || "Escape Route"}
          </h1>

          <div className="mt-8">
            {state.currentScreen === "waiting" && (
              <div className="space-y-4">
                <p className="text-4xl">⏳</p>
                <p className="text-2xl font-bold">Wacht op de volgende opdracht</p>
              </div>
            )}

            {state.currentScreen === "gather" && (
              <div className="space-y-4">
                <p className="text-4xl">📱</p>
                <p className="text-3xl font-extrabold">Alle telefoons bij elkaar</p>
              </div>
            )}

            {state.currentScreen === "show_color" && (
              <div className="space-y-5">
                <p className="text-lg opacity-85">Jouw teamkleur is</p>
                <div
                  className={`rounded-[28px] border ${theme.subtleCard} p-8 shadow-lg`}
                >
                  <p className="text-5xl font-black uppercase tracking-wide">
                    {getColorLabel(state.color)}
                  </p>
                </div>
              </div>
            )}

            {state.currentScreen === "solve_clue" && (
              <div className="space-y-5">
                <p className="text-4xl">🧩</p>
                <p className="text-3xl font-extrabold">
                  Pak de envelop van jouw kleur
                </p>
                <div
                  className={`rounded-[28px] border ${theme.subtleCard} p-6 shadow-lg`}
                >
                  <p className="text-4xl font-black uppercase">
                    {getColorLabel(state.color)}
                  </p>
                </div>
              </div>
            )}

            {state.currentScreen === "enter_final_code" && (
              <div className="space-y-5">
                <p className="text-4xl">🔐</p>
                <p className="text-3xl font-extrabold">Kom weer samen</p>
                <p className="text-base opacity-90">
                  Voer de gezamenlijke 4-cijfercode in.
                </p>

                <input
                  className={`w-full rounded-2xl ${theme.input} p-4 text-center text-3xl font-bold shadow-md outline-none`}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="1234"
                />

                <button
                  className={`w-full rounded-2xl px-5 py-4 text-lg font-semibold shadow-md transition ${theme.button}`}
                  onClick={submitFinalCode}
                >
                  Controleer code
                </button>

                {error ? (
                  <div className="rounded-3xl border-2 border-red-400 bg-white px-4 py-4 text-center shadow-md">
                    <p className="text-lg font-extrabold text-red-700">❌ Foute code</p>
                    <p className="mt-2 text-base font-medium text-red-600">{error}</p>
                  </div>
                ) : null}
              </div>
            )}

            {state.currentScreen === "correct" && (
              <div className="space-y-4">
                <p className="text-4xl">✨</p>
                <p className="text-3xl font-extrabold">Goed gedaan</p>
                {state.successText ? (
                  <p className="text-base opacity-90">{state.successText}</p>
                ) : null}
                {state.nextHint ? (
                  <div
                    className={`mt-4 rounded-2xl border ${theme.subtleCard} p-4`}
                  >
                    <p className="text-sm uppercase tracking-[0.2em] opacity-70">
                      Volgende hint
                    </p>
                    <p className="mt-2 text-lg font-semibold">{state.nextHint}</p>
                  </div>
                ) : null}
              </div>
            )}

            {state.currentScreen === "finished" && (
              <div className="space-y-4">
                <p className="text-5xl">🎉</p>
                <p className="text-3xl font-extrabold">
                  Jullie hebben de route afgerond
                </p>
                <p className="text-base opacity-90">
                  Tijd om te proosten op de bride-to-be!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}