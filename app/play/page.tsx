"use client";

import { useEffect, useState } from "react";
import type { PlayerStateResponse } from "@/lib/types";

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
    }

    loadState();
    const interval = setInterval(loadState, 3000);
    return () => clearInterval(interval);
  }, []);

  async function submitFinalCode() {
    const playerId = localStorage.getItem("playerId");
    const sessionId = localStorage.getItem("playerSessionId");

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
  }

  if (error && !state) {
    return (
      <main className="min-h-screen p-6">
        <h1 className="text-3xl font-bold">Play</h1>
        <p className="text-red-600 mt-4">{error}</p>
      </main>
    );
  }

  if (!state) {
    return <main className="p-6">Laden...</main>;
  }

  return (
    <main className="min-h-screen p-6 flex flex-col justify-center items-center text-center gap-6">
      <h1 className="text-3xl font-bold">{state.roundTitle || "Escape Route"}</h1>

      {state.currentScreen === "waiting" && (
        <p className="text-2xl">Wacht op de volgende opdracht</p>
      )}

      {state.currentScreen === "gather" && (
        <p className="text-3xl font-bold">Alle telefoons bij elkaar</p>
      )}

      {state.currentScreen === "show_color" && (
        <div className="w-full max-w-sm rounded-3xl border p-10">
          <p className="text-xl mb-4">Jouw teamkleur</p>
          <p className="text-5xl font-extrabold uppercase">{state.color}</p>
        </div>
      )}

      {state.currentScreen === "solve_clue" && (
        <div className="flex flex-col gap-4">
          <p className="text-2xl font-bold">Pak de envelop van jouw kleur</p>
          <p className="text-5xl font-extrabold uppercase">{state.color}</p>
          <p>Los samen het raadsel op en onthoud jullie cijfer.</p>
        </div>
      )}

      {state.currentScreen === "enter_final_code" && (
        <div className="w-full max-w-sm flex flex-col gap-4">
          <p className="text-2xl font-bold">Kom weer samen</p>
          <p>Voer de gezamenlijke 4-cijfercode in.</p>

          <input
            className="border rounded-xl p-4 text-center text-2xl"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={4}
            inputMode="numeric"
            placeholder="1234"
          />

          <button
            className="border rounded-2xl p-4 font-semibold"
            onClick={submitFinalCode}
          >
            Controleer code
          </button>

          {error ? <p className="text-red-600">{error}</p> : null}
        </div>
      )}

      {state.currentScreen === "correct" && (
        <div className="flex flex-col gap-4">
          <p className="text-3xl font-bold">Goed gedaan</p>
          {state.successText ? <p>{state.successText}</p> : null}
          {state.nextHint ? <p className="text-lg">{state.nextHint}</p> : null}
        </div>
      )}

      {state.currentScreen === "finished" && (
        <p className="text-3xl font-bold">Jullie hebben de route afgerond 🎉</p>
      )}
    </main>
  );
}