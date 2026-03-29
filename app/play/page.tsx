"use client";

import { useEffect, useMemo, useState } from "react";
import type { PlayerStateResponse } from "@/lib/types";
import {
  Hourglass,
  Smartphone,
  Puzzle,
  Sparkles,
  PartyPopper,
  Lock,
  CheckCircle,
} from "lucide-react";

type Theme = {
  page: string;
  card: string;
  subtleCard: string;
  text: string;
  mutedText: string;
  button: string;
  input: string;
  icon: string;
  accentRing: string;
};

const TEAM_THEME: Record<string, Theme> = {
  red: {
    page: "bg-gradient-to-br from-red-300 via-red-400 to-rose-400",
    card: "bg-white/20 border-white/35",
    subtleCard: "bg-white/16 border-white/28",
    text: "text-white",
    mutedText: "text-white/85",
    button: "bg-white text-red-600 hover:bg-red-50",
    input:
      "bg-white text-zinc-900 placeholder:text-zinc-400 border-white/80 focus:border-white",
    icon: "text-red-100",
    accentRing: "ring-white/20",
  },
  blue: {
    page: "bg-gradient-to-br from-sky-400 via-blue-500 to-blue-700",
    card: "bg-white/18 border-white/30",
    subtleCard: "bg-white/14 border-white/24",
    text: "text-white",
    mutedText: "text-white/85",
    button: "bg-white text-blue-700 hover:bg-blue-50",
    input:
      "bg-white text-zinc-900 placeholder:text-zinc-400 border-white/80 focus:border-white",
    icon: "text-sky-100",
    accentRing: "ring-white/20",
  },
  green: {
    page: "bg-gradient-to-br from-emerald-400 via-green-500 to-green-700",
    card: "bg-white/18 border-white/30",
    subtleCard: "bg-white/14 border-white/24",
    text: "text-white",
    mutedText: "text-white/85",
    button: "bg-white text-green-700 hover:bg-green-50",
    input:
      "bg-white text-zinc-900 placeholder:text-zinc-400 border-white/80 focus:border-white",
    icon: "text-emerald-100",
    accentRing: "ring-white/20",
  },
  yellow: {
    page: "bg-gradient-to-br from-yellow-200 via-amber-200 to-yellow-300",
    card: "bg-white/60 border-white/80",
    subtleCard: "bg-white/50 border-white/70",
    text: "text-amber-950",
    mutedText: "text-amber-950/80",
    button: "bg-amber-950 text-white hover:bg-amber-900",
    input:
      "bg-white text-zinc-900 placeholder:text-zinc-400 border-amber-100 focus:border-amber-300",
    icon: "text-amber-500",
    accentRing: "ring-amber-200/70",
  },
};

const DEFAULT_THEME: Theme = {
  page:
    "bg-[linear-gradient(145deg,#fb7185_0%,#f472b6_24%,#60a5fa_52%,#34d399_76%,#facc15_100%)]",
  card: "bg-white/82 border-white/90",
  subtleCard: "bg-white/68 border-white/80",
  text: "text-rose-950",
  mutedText: "text-rose-950/75",
  button: "bg-rose-600 text-white hover:bg-rose-700",
  input:
    "bg-white text-zinc-900 placeholder:text-zinc-400 border-rose-100 focus:border-rose-300",
  icon: "text-rose-500",
  accentRing: "ring-rose-100/80",
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
          className={`w-full max-w-sm rounded-[32px] border ${theme.card} px-8 py-8 text-center shadow-2xl backdrop-blur`}
        >
          <div
            className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/40 ring-8 ${theme.accentRing}`}
          >
            <Hourglass className={`h-8 w-8 ${theme.icon}`} />
          </div>
          <p className="text-lg font-semibold">Laden...</p>
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
          className={`rounded-[36px] border ${theme.card} p-6 text-center shadow-2xl backdrop-blur sm:p-8`}
        >
          <p className={`text-xs uppercase tracking-[0.35em] ${theme.mutedText}`}>
            Vrijgezellen escape
          </p>

          <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
            {state.roundTitle || "Escape Route"}
          </h1>

          <div className="mt-8">
            {state.currentScreen === "waiting" && (
              <div className="space-y-5">
                <div
                  className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/35 ring-8 ${theme.accentRing}`}
                >
                  <Hourglass className={`h-10 w-10 ${theme.icon}`} />
                </div>
                <p className="text-2xl font-bold sm:text-3xl">
                  Wacht op de volgende opdracht
                </p>
              </div>
            )}

            {state.currentScreen === "gather" && (
              <div className="space-y-5">
                <div
                  className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/35 ring-8 ${theme.accentRing}`}
                >
                  <Smartphone className={`h-10 w-10 ${theme.icon}`} />
                </div>
                <p className="text-3xl font-extrabold">Alle telefoons bij elkaar</p>
              </div>
            )}

            {state.currentScreen === "show_color" && (
              <div className="space-y-5">
                <div
                  className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/28 ring-8 ${theme.accentRing}`}
                >
                  <Sparkles className={`h-10 w-10 ${theme.icon}`} />
                </div>

                <p className={`text-lg font-medium ${theme.mutedText}`}>
                  Jouw teamkleur is
                </p>

                <div
                  className={`rounded-[30px] border ${theme.subtleCard} p-8 shadow-xl`}
                >
                  <p className="text-5xl font-black uppercase tracking-wide sm:text-6xl">
                    {getColorLabel(state.color)}
                  </p>
                </div>
              </div>
            )}

            {state.currentScreen === "solve_clue" && (
              <div className="space-y-5">
                <div
                  className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/28 ring-8 ${theme.accentRing}`}
                >
                  <Puzzle className={`h-10 w-10 ${theme.icon}`} />
                </div>

                <p className="text-3xl font-extrabold sm:text-4xl">
                  Pak de envelop van jouw kleur
                </p>

                <div
                  className={`rounded-[30px] border ${theme.subtleCard} p-6 shadow-xl`}
                >
                  <p className="text-4xl font-black uppercase sm:text-5xl">
                    {getColorLabel(state.color)}
                  </p>
                </div>
              </div>
            )}

            {state.currentScreen === "enter_final_code" && (
              <div className="space-y-5">
                <div
                  className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/35 ring-8 ${theme.accentRing}`}
                >
                  <Lock className={`h-10 w-10 ${theme.icon}`} />
                </div>

                <p className="text-3xl font-extrabold">Kom weer samen</p>
                <p className={`text-base ${theme.mutedText}`}>
                  Voer de gezamenlijke 4-cijfercode in.
                </p>

                <input
                  className={`w-full rounded-2xl border ${theme.input} p-4 text-center text-3xl font-bold shadow-md outline-none transition`}
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
                  <div className="rounded-[28px] border-2 border-red-300 bg-white/95 px-4 py-4 text-center shadow-lg">
                    <p className="text-xl font-extrabold text-red-700">
                      ❌ Foute code
                    </p>
                    <p className="mt-2 text-base font-medium text-red-600">
                      {error}
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            {state.currentScreen === "correct" && (
              <div className="space-y-5">
                <div
                  className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/35 ring-8 ${theme.accentRing}`}
                >
                  <CheckCircle className={`h-16 w-16 ${theme.icon} animate-bounce`} />
                </div>

                {state.successText ? (
                  <p className={`text-base leading-7 ${theme.mutedText}`}>
                    {state.successText}
                  </p>
                ) : null}

                {state.nextHint ? (
                  <div
                    className={`mt-4 rounded-[26px] border ${theme.subtleCard} p-5 shadow-md`}
                  >
                    <p
                      className={`text-sm uppercase tracking-[0.2em] ${theme.mutedText}`}
                    >
                      Volgende hint
                    </p>
                    <p className="mt-3 text-lg font-semibold leading-7">
                      {state.nextHint}
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            {state.currentScreen === "finished" && (
              <div className="space-y-5">
                <div
                  className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/35 ring-8 ${theme.accentRing}`}
                >
                  <PartyPopper className={`h-10 w-10 ${theme.icon}`} />
                </div>

                <p className="text-3xl font-extrabold">
                  Jullie hebben de route afgerond
                </p>
                <p className={`text-base leading-7 ${theme.mutedText}`}>
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