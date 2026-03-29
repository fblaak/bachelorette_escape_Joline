"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Player = {
  id: string;
  display_name: string;
  is_checked_in: boolean;
};

export default function JoinPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerId, setPlayerId] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    async function loadPlayers() {
      setIsLoadingPlayers(true);

      const { data, error } = await supabase
        .from("players")
        .select("id, display_name, is_checked_in")
        .eq("active", true)
        .order("display_name");

      if (!error && data) {
        setPlayers(data);
      } else {
        setError("Kon de spelerslijst niet laden");
      }

      setIsLoadingPlayers(false);
    }

    loadPlayers();
  }, []);

  async function handleJoin() {
    setError("");

    if (!playerId) {
      setError("Kies eerst je naam");
      return;
    }

    if (!joinCode.trim()) {
      setError("Vul eerst de toegangscode in");
      return;
    }

    setIsJoining(true);

    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId, joinCode }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Kon niet deelnemen");
        return;
      }

      localStorage.setItem("playerId", json.playerId);
      localStorage.setItem("playerSessionId", json.sessionId);
      window.location.href = "/play";
    } catch (e) {
      console.error(e);
      setError("Aanmelden mislukt. Probeer het opnieuw.");
    } finally {
      setIsJoining(false);
    }
  }

  const availablePlayers = players.filter(
    (p) => !p.is_checked_in || p.id === playerId
  );

  return (
    <main className="min-h-screen bg-[linear-gradient(160deg,#fff1f2_0%,#fdf2f8_25%,#eff6ff_55%,#fefce8_100%)] px-4 py-6 text-rose-950 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md items-center justify-center">
        <div className="w-full rounded-[32px] border border-white/80 bg-white/80 p-6 shadow-2xl shadow-rose-100 backdrop-blur sm:p-8">
          <div className="text-center">
            <p className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-rose-700">
              Vrijgezellen escape
            </p>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Doe mee
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600 sm:text-base">
              Kies je naam, vul de toegangscode in en start het spel.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-700">Jouw naam</span>
              <select
                className="rounded-2xl border border-rose-200 bg-rose-50/60 px-4 py-4 text-lg outline-none transition focus:border-rose-400 focus:bg-white"
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                disabled={isLoadingPlayers || isJoining}
              >
                <option value="">
                  {isLoadingPlayers ? "Spelers laden..." : "Kies je naam"}
                </option>
                {availablePlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.display_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-700">
                Toegangscode
              </span>
              <input
                className="rounded-2xl border border-rose-200 bg-rose-50/60 px-4 py-4 text-lg outline-none transition focus:border-rose-400 focus:bg-white"
                placeholder="Voer de toegangscode in"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void handleJoin();
                  }
                }}
                disabled={isJoining}
              />
            </label>

            <button
              className="rounded-2xl bg-gradient-to-r from-rose-500 to-fuchsia-500 px-5 py-4 text-lg font-semibold text-white shadow-md transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleJoin}
              disabled={isJoining || isLoadingPlayers}
            >
              {isJoining ? "Bezig met aanmelden..." : "Start spel"}
            </button>

            {error ? (
              <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-center shadow-sm">
                <p className="text-base font-bold text-red-700">
                  Aanmelden mislukt
                </p>
                <p className="mt-1 text-sm text-red-600">{error}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}