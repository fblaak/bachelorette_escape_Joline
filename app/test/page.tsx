"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Player = {
  id: string;
  display_name: string;
};

export default function TestPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPlayers() {
      const { data, error } = await supabase
        .from("players")
        .select("id, display_name")
        .order("display_name");

      if (error) {
        setError(error.message);
        return;
      }

      setPlayers(data ?? []);
    }

    loadPlayers();
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-4">Supabase test</h1>

      {error ? <p className="text-red-600">{error}</p> : null}

      <ul className="list-disc pl-6">
        {players.map((player) => (
          <li key={player.id}>{player.display_name}</li>
        ))}
      </ul>
    </main>
  );
}