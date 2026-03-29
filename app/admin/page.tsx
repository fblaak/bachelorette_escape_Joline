"use client";

import { useState } from "react";

type BootstrapResponse = {
  game: { id: string; current_round_number: number; name: string };
  players: Array<{
    id: string;
    display_name: string;
    is_checked_in: boolean;
    active: boolean;
  }>;
  rounds: Array<{
    id: string;
    round_number: number;
    title: string;
    intro_text: string | null;
  }>;
  currentRound: {
    id: string;
    round_number: number;
    title: string;
    intro_text: string | null;
  } | null;
  assignments: Array<{
    player_id: string;
    color: string;
    locked_by_admin: boolean;
  }>;
  clues: Array<{
    color: string;
    digit: number;
    clue_text: string | null;
    envelope_number: number | null;
  }>;
  solution: {
    final_code: string;
    success_text: string | null;
    next_hint: string | null;
  } | null;
};

const DEFAULT_CLUES = [
  { color: "red", digit: 0, clue_text: "", envelope_number: 1 },
  { color: "blue", digit: 0, clue_text: "", envelope_number: 2 },
  { color: "green", digit: 0, clue_text: "", envelope_number: 3 },
  { color: "yellow", digit: 0, clue_text: "", envelope_number: 4 },
];

export default function AdminPage() {
  const [adminPin, setAdminPin] = useState("");
  const [data, setData] = useState<BootstrapResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const [roundNumber, setRoundNumber] = useState(1);
  const [title, setTitle] = useState("");
  const [introText, setIntroText] = useState("");
  const [finalCode, setFinalCode] = useState("");
  const [successText, setSuccessText] = useState("");
  const [nextHint, setNextHint] = useState("");
  const [clues, setClues] = useState(DEFAULT_CLUES);

  async function load() {
    setStatusMessage("Bezig met laden...");

    try {
      const res = await fetch("/api/admin/bootstrap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminPin }),
      });

      const json = await res.json();

      if (!res.ok) {
        setStatusMessage(`FOUT: ${json.error ?? "onbekende fout"}`);
        return;
      }

      setData(json);
      setRoundNumber(json.game.current_round_number);
      setTitle(json.currentRound?.title ?? "");
      setIntroText(json.currentRound?.intro_text ?? "");
      setFinalCode(json.solution?.final_code ?? "");
      setSuccessText(json.solution?.success_text ?? "");
      setNextHint(json.solution?.next_hint ?? "");

      if (json.clues?.length) {
        const sortedClues = [...json.clues].sort((a, b) =>
          a.color.localeCompare(b.color)
        );
        setClues(sortedClues);
      } else {
        setClues(DEFAULT_CLUES);
      }

      setStatusMessage("Admin-data geladen");
    } catch (error) {
      console.error(error);
      setStatusMessage("FOUT: bootstrap mislukt");
    }
  }

  async function assignColors() {
    if (!data) {
      setStatusMessage("Laad eerst de admin-data");
      return;
    }

    setStatusMessage("Bezig met kleuren genereren...");

    try {
      const res = await fetch("/api/admin/assign-colors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminPin,
          gameId: data.game.id,
          roundNumber,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setStatusMessage(`FOUT: ${json.error ?? "onbekende fout"}`);
        return;
      }

      setStatusMessage("Kleuren zijn gegenereerd");
    } catch (error) {
      console.error(error);
      setStatusMessage("FOUT: kleuren genereren mislukt");
    }
  }

  async function setScreen(screen: string) {
    if (!data) {
      setStatusMessage("Laad eerst de admin-data");
      return;
    }

    setStatusMessage(`Bezig met scherm zetten op ${screen}...`);

    try {
      const res = await fetch("/api/admin/set-screen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminPin,
          gameId: data.game.id,
          roundNumber,
          screen,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setStatusMessage(`FOUT: ${json.error ?? "onbekende fout"}`);
        return;
      }

      setStatusMessage(`Scherm gezet op ${screen}`);
    } catch (error) {
      console.error(error);
      setStatusMessage("FOUT: set-screen mislukt");
    }
  }

  async function saveRoundConfig() {
  if (!data) {
    setStatusMessage("Laad eerst de admin-data");
    return;
  }

  setStatusMessage("Klik op save round config...");

  try {
    const payload = {
      adminPin,
      gameId: data.game.id,
      roundNumber,
      title,
      introText,
      clues,
      solution: {
        final_code: finalCode,
        success_text: successText,
        next_hint: nextHint,
      },
    };

    console.log("saveRoundConfig payload", payload);

    const res = await fetch("/api/admin/set-round-config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log("saveRoundConfig raw response", text);

    let json: any = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      setStatusMessage("FOUT: response is geen geldige JSON");
      return;
    }

    if (!res.ok) {
      setStatusMessage(`FOUT: ${json.error ?? "onbekende fout"}`);
      return;
    }

    setStatusMessage("Rondeconfig opgeslagen");
  } catch (error) {
    console.error("saveRoundConfig error", error);
    setStatusMessage("FOUT: save round config mislukt");
  }
}

  async function loadSelectedRound() {
    if (!data) {
      setStatusMessage("Laad eerst de admin-data");
      return;
    }

    setStatusMessage(`Bezig met ronde ${roundNumber} laden...`);

    try {
      const res = await fetch("/api/admin/load-round", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminPin,
          gameId: data.game.id,
          roundNumber,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setStatusMessage(`FOUT: ${json.error ?? "onbekende fout"}`);
        return;
      }

      setTitle(json.round?.title ?? "");
      setIntroText(json.round?.intro_text ?? "");
      setFinalCode(json.solution?.final_code ?? "");
      setSuccessText(json.solution?.success_text ?? "");
      setNextHint(json.solution?.next_hint ?? "");

      if (json.clues?.length) {
        const sortedClues = [...json.clues].sort((a, b) =>
          a.color.localeCompare(b.color)
        );
        setClues(sortedClues);
      } else {
        setClues(DEFAULT_CLUES);
      }

      setStatusMessage(`Ronde ${roundNumber} geladen`);
    } catch (error) {
      console.error(error);
      setStatusMessage("FOUT: gekozen ronde laden mislukt");
    }
  }

function updateClue(
    index: number,
    key: "digit" | "clue_text" | "envelope_number",
    value: string | number
  ) {
    const copy = [...clues];
    copy[index] = {
      ...copy[index],
      [key]: value,
    };
    setClues(copy);
  }

  return (
    <main className="p-6 max-w-5xl flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Admin</h1>

      <div className="flex gap-3">
        <input
        className="border rounded-xl p-3"
        type="number"
        value={roundNumber}
        onChange={(e) => setRoundNumber(Number(e.target.value))}
      />

      <button className="border rounded-xl p-3" onClick={loadSelectedRound}>
        Laad gekozen ronde
      </button>
        <button className="border rounded-xl px-4" onClick={load}>
          Laden
        </button>
      </div>

      <div className="border rounded-xl p-3 bg-gray-50">
        <p className="font-semibold">Status</p>
        <p>{statusMessage || "Nog geen actie uitgevoerd"}</p>
      </div>

      {!data ? null : (
        <>
          <section className="border rounded-2xl p-4 flex flex-col gap-3">
            <h2 className="text-2xl font-semibold">Game</h2>
            <p>
              <strong>Naam:</strong> {data.game.name}
            </p>
            <p>
              <strong>Game ID:</strong> {data.game.id}
            </p>
          </section>

          <section className="border rounded-2xl p-4 flex flex-col gap-3">
            <h2 className="text-2xl font-semibold">Rondeconfig</h2>

            <input
              className="border rounded-xl p-3"
              type="number"
              value={roundNumber}
              onChange={(e) => setRoundNumber(Number(e.target.value))}
            />

            <input
              className="border rounded-xl p-3"
              placeholder="Ronde titel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              className="border rounded-xl p-3"
              placeholder="Introtekst"
              value={introText}
              onChange={(e) => setIntroText(e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {clues.map((clue, index) => (
                <div
                  key={clue.color}
                  className="border rounded-xl p-3 flex flex-col gap-2"
                >
                  <p className="font-semibold uppercase">{clue.color}</p>

                  <input
                    className="border rounded-lg p-2"
                    type="number"
                    placeholder="Digit"
                    value={clue.digit}
                    onChange={(e) =>
                      updateClue(index, "digit", Number(e.target.value))
                    }
                  />

                  <input
                    className="border rounded-lg p-2"
                    type="number"
                    placeholder="Envelopnummer"
                    value={clue.envelope_number ?? ""}
                    onChange={(e) =>
                      updateClue(index, "envelope_number", e.target.value)
                    }
                  />

                  <input
                    className="border rounded-lg p-2"
                    placeholder="Clue tekst"
                    value={clue.clue_text ?? ""}
                    onChange={(e) =>
                      updateClue(index, "clue_text", e.target.value)
                    }
                  />
                </div>
              ))}
            </div>

            <input
              className="border rounded-xl p-3"
              placeholder="Final code, bv 9742"
              value={finalCode}
              onChange={(e) => setFinalCode(e.target.value)}
            />

            <textarea
              className="border rounded-xl p-3"
              placeholder="Success tekst"
              value={successText}
              onChange={(e) => setSuccessText(e.target.value)}
            />

            <textarea
              className="border rounded-xl p-3"
              placeholder="Volgende hint"
              value={nextHint}
              onChange={(e) => setNextHint(e.target.value)}
            />

            <button className="border rounded-xl p-3" onClick={saveRoundConfig}>
              Save round config
            </button>
          </section>

          <section className="border rounded-2xl p-4 flex flex-col gap-3">
            <h2 className="text-2xl font-semibold">Ronde sturen</h2>

            <div className="flex flex-wrap gap-3">
              <button className="border rounded-xl px-4 py-2" onClick={assignColors}>
                Genereer kleuren
              </button>
              <button
                className="border rounded-xl px-4 py-2"
                onClick={() => setScreen("waiting")}
              >
                Waiting
              </button>
              <button
                className="border rounded-xl px-4 py-2"
                onClick={() => setScreen("gather")}
              >
                Gather
              </button>
              <button
                className="border rounded-xl px-4 py-2"
                onClick={() => setScreen("show_color")}
              >
                Show color
              </button>
              <button
                className="border rounded-xl px-4 py-2"
                onClick={() => setScreen("solve_clue")}
              >
                Solve clue
              </button>
              <button
                className="border rounded-xl px-4 py-2"
                onClick={() => setScreen("enter_final_code")}
              >
                Enter final code
              </button>
              <button
                className="border rounded-xl px-4 py-2"
                onClick={() => setScreen("correct")}
              >
                Correct
              </button>
              <button
                className="border rounded-xl px-4 py-2"
                onClick={() => setScreen("finished")}
              >
                Finished
              </button>
            </div>
          </section>

          <section className="border rounded-2xl p-4 flex flex-col gap-3">
            <h2 className="text-2xl font-semibold">Spelers</h2>

            {data.players.map((player) => (
              <div
                key={player.id}
                className="border rounded-xl p-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{player.display_name}</p>
                  <p className="text-sm">
                    checked in: {String(player.is_checked_in)}
                  </p>
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}