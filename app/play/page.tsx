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
  Clock3,
  TimerOff,
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

function FireworksBackground() {
  const fireworks = [
    { left: "14%", top: "20%", delay: "0s" },
    { left: "34%", top: "12%", delay: "0.8s" },
    { left: "56%", top: "24%", delay: "1.4s" },
    { left: "78%", top: "16%", delay: "0.4s" },
    { left: "22%", top: "44%", delay: "1.8s" },
    { left: "68%", top: "42%", delay: "2.2s" },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {fireworks.map((fw, index) => (
        <div
          key={index}
          className="firework"
          style={{
            left: fw.left,
            top: fw.top,
            animationDelay: fw.delay,
          }}
        />
      ))}
    </div>
  );
}

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

function formatTimeLeft(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function PlayPage() {
  const [state, setState] = useState<PlayerStateResponse | null>(null);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [now, setNow] = useState(Date.now());
  const [frozenTimeLeftMs, setFrozenTimeLeftMs] = useState<number | null>(null);

  const currentGameResult = state?.gameResult ?? "playing";
  const currentScreen = state?.currentScreen ?? "waiting";
  const finalCodeStatus = state?.finalCodeStatus ?? "idle";
  const timerEnabled = state?.timerEnabled ?? false;
  const endsAt = state?.endsAt ?? null;
  const gameStatus = state?.gameStatus ?? "running";

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
      currentScreen === "show_color" || currentScreen === "solve_clue";

    if (useTeamColor) {
      return TEAM_THEME[color] ?? DEFAULT_THEME;
    }

    return DEFAULT_THEME;
  }, [state?.color, currentScreen]);

  const liveTimeLeftMs = useMemo(() => {
    if (!timerEnabled || !endsAt) return null;

    if (gameStatus === "paused") {
      return frozenTimeLeftMs;
    }

    return new Date(endsAt).getTime() - now;
  }, [timerEnabled, endsAt, now, gameStatus, frozenTimeLeftMs]);

  useEffect(() => {
    if (!timerEnabled) {
      setFrozenTimeLeftMs(null);
      return;
    }

    if (
      currentGameResult === "playing" &&
      gameStatus !== "paused" &&
      liveTimeLeftMs !== null
    ) {
      setFrozenTimeLeftMs(Math.max(0, liveTimeLeftMs));
    }
  }, [timerEnabled, currentGameResult, liveTimeLeftMs, gameStatus]);

  const timerExpired =
    timerEnabled &&
    currentGameResult === "playing" &&
    liveTimeLeftMs !== null &&
    liveTimeLeftMs <= 0;

  const effectiveScreen =
    gameStatus === "paused"
      ? "paused"
      : currentGameResult === "lost" || timerExpired
      ? "time_up"
      : currentScreen;

  const timeLeftMs =
    currentGameResult === "won"
      ? frozenTimeLeftMs
      : currentGameResult === "lost" || timerExpired
      ? 0
      : liveTimeLeftMs;

  const timerTone =
    timeLeftMs === null
      ? ""
      : timeLeftMs <= 5 * 60 * 1000
      ? "text-red-600"
      : timeLeftMs <= 10 * 60 * 1000
      ? "text-orange-600"
      : "text-zinc-800";

  const showGlobalSubmittingMessage =
    effectiveScreen === "enter_final_code" &&
    finalCodeStatus === "submitting";

  const showGlobalWrongMessage =
    effectiveScreen === "enter_final_code" &&
    finalCodeStatus === "wrong" &&
    !error;

  const canEnterCode = effectiveScreen === "enter_final_code";

  if (!state) {
    return (
      <main
        className={`min-h-screen ${DEFAULT_THEME.page} ${DEFAULT_THEME.text} flex items-center justify-center p-6`}
      >
        <div
          className={`w-full max-w-sm rounded-[32px] border ${DEFAULT_THEME.card} px-8 py-8 text-center shadow-2xl backdrop-blur`}
        >
          <div
            className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/40 ring-8 ${DEFAULT_THEME.accentRing}`}
          >
            <Hourglass className={`h-8 w-8 ${DEFAULT_THEME.icon}`} />
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
          <p
            className={`text-xs uppercase tracking-[0.35em] ${theme.mutedText}`}
          >
            Vrijgezellen escape
          </p>

          <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
            {state.roundTitle || "Escape Route"}
          </h1>

          {timerEnabled && timeLeftMs !== null ? (
            <div
              className={`mt-5 rounded-[24px] border ${theme.subtleCard} px-4 py-3 shadow-md`}
            >
              <div className="flex items-center justify-center gap-2">
                <Clock3 className={`h-5 w-5 ${theme.icon}`} />
                <p
                  className={`text-sm font-semibold uppercase tracking-[0.2em] ${theme.mutedText}`}
                >
                  Resterende tijd
                </p>
              </div>
              <p
                className={`mt-2 text-3xl font-black tracking-wide ${timerTone} drop-shadow-sm`}
              >
                {formatTimeLeft(timeLeftMs)}
              </p>
            </div>
          ) : null}

          <div className="mt-8">
            {effectiveScreen === "waiting" && (
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

            {effectiveScreen === "gather" && (
              <div className="space-y-5">
                <div
                  className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/35 ring-8 ${theme.accentRing}`}
                >
                  <Smartphone className={`h-10 w-10 ${theme.icon}`} />
                </div>
                <p className="text-3xl font-extrabold">
                  Alle telefoons bij elkaar
                </p>
              </div>
            )}

            {effectiveScreen === "show_color" && (
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

            {effectiveScreen === "solve_clue" && (
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

            {effectiveScreen === "enter_final_code" && (
              <div className="space-y-4">
                <div
                  className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/35 ring-8 ${theme.accentRing}`}
                >
                  <Lock className={`h-10 w-10 ${theme.icon}`} />
                </div>

                <p className="text-3xl font-extrabold">Kom weer samen</p>
                <p className={`text-base ${theme.mutedText}`}>
                  Voer de gezamenlijke 4-cijfercode in.
                </p>

                {showGlobalSubmittingMessage ? (
                  <div
                    className={`rounded-2xl border ${theme.subtleCard} px-4 py-3`}
                  >
                    <p className={`text-sm font-semibold ${theme.mutedText}`}>
                      Code wordt gecontroleerd...
                    </p>
                  </div>
                ) : null}

                {showGlobalWrongMessage ? (
                  <div
                    className={`rounded-2xl border ${theme.subtleCard} px-4 py-3`}
                  >
                    <p className="text-sm font-semibold text-red-600">
                      Er is een foute code ingevoerd.
                    </p>
                  </div>
                ) : null}

                {canEnterCode ? (
                  <>
                    <input
                      className={`w-full rounded-2xl border ${theme.input} p-4 text-center text-3xl font-bold shadow-md outline-none transition`}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      maxLength={4}
                      inputMode="numeric"
                      placeholder="1234"
                    />

                    <div className="min-h-[24px] flex items-center justify-center">
                      {error ? (
                        <p className="text-sm font-semibold text-red-700">
                          ❌ {error}
                        </p>
                      ) : null}
                    </div>

                    <button
                      className={`w-full rounded-2xl px-5 py-4 text-lg font-semibold shadow-md transition ${theme.button}`}
                      onClick={submitFinalCode}
                    >
                      Controleer code
                    </button>
                  </>
                ) : null}
              </div>
            )}

            {effectiveScreen === "correct" && (
              <div className="space-y-5">
                <div
                  className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/35 ring-8 ${theme.accentRing}`}
                >
                  <CheckCircle
                    className={`h-16 w-16 ${theme.icon} animate-bounce`}
                  />
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

            {effectiveScreen === "finished" && (
              <div className="relative space-y-5">
                <FireworksBackground />

                <div className="relative z-10 space-y-5">
                  <div
                    className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/35 ring-8 ${theme.accentRing}`}
                  >
                    <PartyPopper className={`h-10 w-10 ${theme.icon}`} />
                  </div>

                  <p className="text-3xl font-extrabold">
                    Jullie hebben de route afgerond!!
                  </p>
                  <p className={`text-base leading-7 ${theme.mutedText}`}>
                    Tijd om te proosten op de bride-to-be!
                  </p>
                </div>
              </div>
            )}

            {effectiveScreen === "time_up" && (
              <div className="space-y-5">
                <div
                  className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/35 ring-8 ${theme.accentRing}`}
                >
                  <TimerOff className="h-12 w-12 text-red-500" />
                </div>

                <p className="text-3xl font-extrabold">De tijd is op</p>
                <p className={`text-base leading-7 ${theme.mutedText}`}>
                  Jullie hebben het helaas niet op tijd gehaald.
                </p>
              </div>
            )}

            {effectiveScreen === "paused" && (
              <div className="space-y-5">
                <div
                  className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/35 ring-8 ${theme.accentRing}`}
                >
                  <span className="text-4xl">⏸️</span>
                </div>

                <p className="text-3xl font-extrabold">Pauze</p>
                <p className={`text-base leading-7 ${theme.mutedText}`}>
                  Wacht even op de spelleiding
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}