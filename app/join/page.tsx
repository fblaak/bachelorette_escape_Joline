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

  useEffect(() => {
    async function loadPlayers() {
      const { data, error } = await supabase
        .from("players")
        .select("id, display_name, is_checked_in")
        .eq("active", true)
        .order("display_name");

      if (!error && data) {
        setPlayers(data);
      }
    }

    loadPlayers();
  }, []);

  async function handleJoin() {
    setError("");

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
  }

  return (
    <main className="min-h-screen p-6 flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Doe mee</h1>

      <select
        className="border rounded-xl p-4 text-lg"
        value={playerId}
        onChange={(e) => setPlayerId(e.target.value)}
      >
        <option value="">Kies je naam</option>
        {players
          .filter((p) => !p.is_checked_in || p.id === playerId)
          .map((p) => (
            <option key={p.id} value={p.id}>
              {p.display_name}
            </option>
          ))}
      </select>

      <input
        className="border rounded-xl p-4 text-lg"
        placeholder="Join code"
        value={joinCode}
        onChange={(e) => setJoinCode(e.target.value)}
      />

      <button
        className="border rounded-2xl p-4 font-semibold"
        onClick={handleJoin}
      >
        Start
      </button>

      {error ? <p className="text-red-600">{error}</p> : null}
    </main>
  );
}