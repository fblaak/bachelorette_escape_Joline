"use client";

import { useMemo, useState } from "react";

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

type Clue = {
  color: string;
  digit: number;
  clue_text: string;
  envelope_number: number | null;
};

const DEFAULT_CLUES: Clue[] = [
  { color: "red", digit: 0, clue_text: "", envelope_number: 1 },
  { color: "blue", digit: 0, clue_text: "", envelope_number: 2 },
  { color: "green", digit: 0, clue_text: "", envelope_number: 3 },
  { color: "yellow", digit: 0, clue_text: "", envelope_number: 4 },
];

const SCREEN_LABELS: Record<string, string> = {
  waiting: "Waiting",
  gather: "Gather",
  show_color: "Show color",
  solve_clue: "Solve clue",
  enter_final_code: "Enter final code",
  correct: "Correct",
  finished: "Finished",
};

const COLOR_STYLES: Record<
  string,
  {
    badge: string;
    card: string;
  }
> = {
  red: {
    badge: "bg-rose-500 text-white",
    card: "border-rose-200 bg-rose-50",
  },
  blue: {
    badge: "bg-sky-500 text-white",
    card: "border-sky-200 bg-sky-50",
  },
  green: {
    badge: "bg-emerald-500 text-white",
    card: "border-emerald-200 bg-emerald-50",
  },
  yellow: {
    badge: "bg-amber-400 text-amber-950",
    card: "border-amber-200 bg-amber-50",
  },
};

function getColorStyle(color: string) {
  return (
    COLOR_STYLES[color] ?? {
      badge: "bg-zinc-700 text-white",
      card: "border-zinc-200 bg-zinc-50",
    }
  );
}

export default function AdminPage() {
  const [adminPin, setAdminPin] = useState("");
  const [data, setData] = useState<BootstrapResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [roundNumber, setRoundNumber] = useState(1);
  const [title, setTitle] = useState("");
  const [introText, setIntroText] = useState("");
  const [finalCode, setFinalCode] = useState("");
  const [successText, setSuccessText] = useState("");
  const [nextHint, setNextHint] = useState("");
  const [clues, setClues] = useState<Clue[]>(DEFAULT_CLUES);

  const selectedRoundAssignments = useMemo(() => {
    if (!data) return [];
    return data.assignments;
  }, [data]);

  function requirePin() {
    if (!adminPin.trim()) {
      setStatusMessage("Vul eerst de admin pin in");
      return false;
    }
    return true;
  }

  function fillFormFromResponse(json: BootstrapResponse) {
    setData(json);
    setRoundNumber(json.game.current_round_number || 1);
    setTitle(json.currentRound?.title ?? "");
    setIntroText(json.currentRound?.intro_text ?? "");
    setFinalCode(json.solution?.final_code ?? "");
    setSuccessText(json.solution?.success_text ?? "");
    setNextHint(json.solution?.next_hint ?? "");

    if (json.clues?.length) {
      const sortedClues: Clue[] = [...json.clues]
        .sort((a, b) => a.color.localeCompare(b.color))
        .map((clue) => ({
          color: clue.color,
          digit: clue.digit ?? 0,
          clue_text: clue.clue_text ?? "",
          envelope_number: clue.envelope_number ?? null,
        }));
      setClues(sortedClues);
    } else {
      setClues(DEFAULT_CLUES);
    }
  }

  async function postJson(url: string, body: Record<string, unknown>) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let json: any = {};

    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`Response van ${url} is geen geldige JSON`);
    }

    if (!res.ok) {
      throw new Error(json.error ?? "onbekende fout");
    }

    return json;
  }

  async function load() {
    if (!requirePin()) return;

    setIsLoading(true);
    setStatusMessage(`Bezig met laden...`);

    try {
      const json = await postJson("/api/admin/bootstrap", {
        adminPin: adminPin.trim(),
      });

      fillFormFromResponse(json);
      setStatusMessage("Admin-data geladen");
    } catch (error) {
      console.error(error);
      setStatusMessage(
        `FOUT: ${error instanceof Error ? error.message : "bootstrap mislukt"}`
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function assignColors() {
    if (!data) {
      setStatusMessage("Laad eerst de admin-data");
      return;
    }
    if (!requirePin()) return;

    setIsLoading(true);
    setStatusMessage(`Bezig met kleuren genereren...`);

    try {
      await postJson("/api/admin/assign-colors", {
        adminPin: adminPin.trim(),
        gameId: data.game.id,
        roundNumber,
      });

      setStatusMessage("Kleuren zijn gegenereerd");
      await load();
    } catch (error) {
      console.error(error);
      setStatusMessage(
        `FOUT: ${error instanceof Error ? error.message : "kleuren genereren mislukt"}`
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function setScreen(screen: string) {
    if (!data) {
      setStatusMessage("Laad eerst de admin-data");
      return;
    }
    if (!requirePin()) return;

    setIsLoading(true);
    setStatusMessage(`Bezig met scherm zetten op ${screen}...`);

    try {
      await postJson("/api/admin/set-screen", {
        adminPin: adminPin.trim(),
        gameId: data.game.id,
        roundNumber,
        screen,
      });

      setStatusMessage(`Scherm gezet op ${screen}`);
    } catch (error) {
      console.error(error);
      setStatusMessage(
        `FOUT: ${error instanceof Error ? error.message : "set-screen mislukt"}`
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function saveRoundConfig() {
    if (!data) {
      setStatusMessage("Laad eerst de admin-data");
      return;
    }
    if (!requirePin()) return;

    setIsLoading(true);
    setStatusMessage(`Rondeconfig opslaan...`);

    try {
      const normalizedClues = clues.map((clue) => ({
        color: clue.color,
        digit: Number(clue.digit) || 0,
        clue_text: clue.clue_text?.trim() || "",
        envelope_number:
          clue.envelope_number === null || clue.envelope_number === undefined
            ? null
            : Number(clue.envelope_number),
      }));

      await postJson("/api/admin/set-round-config", {
        adminPin: adminPin.trim(),
        gameId: data.game.id,
        roundNumber,
        title,
        introText,
        clues: normalizedClues,
        solution: {
          final_code: finalCode,
          success_text: successText,
          next_hint: nextHint,
        },
      });

      setStatusMessage("Rondeconfig opgeslagen");
      await loadSelectedRound();
    } catch (error) {
      console.error(error);
      setStatusMessage(
        `FOUT: ${error instanceof Error ? error.message : "save round config mislukt"}`
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadSelectedRound() {
    if (!data) {
      setStatusMessage("Laad eerst de admin-data");
      return;
    }
    if (!requirePin()) return;

    setIsLoading(true);
    setStatusMessage(`Bezig met ronde ${roundNumber} laden...`);

    try {
      const json = await postJson("/api/admin/load-round", {
        adminPin: adminPin.trim(),
        gameId: data.game.id,
        roundNumber,
      });

      setTitle(json.round?.title ?? "");
      setIntroText(json.round?.intro_text ?? "");
      setFinalCode(json.solution?.final_code ?? "");
      setSuccessText(json.solution?.success_text ?? "");
      setNextHint(json.solution?.next_hint ?? "");

      if (json.clues?.length) {
        const sortedClues: Clue[] = [...json.clues]
          .sort((a, b) => a.color.localeCompare(b.color))
          .map((clue) => ({
            color: clue.color,
            digit: clue.digit ?? 0,
            clue_text: clue.clue_text ?? "",
            envelope_number: clue.envelope_number ?? null,
          }));
        setClues(sortedClues);
      } else {
        setClues(DEFAULT_CLUES);
      }

      setStatusMessage(`Ronde ${roundNumber} geladen`);
    } catch (error) {
      console.error(error);
      setStatusMessage(
        `FOUT: ${error instanceof Error ? error.message : "gekozen ronde laden mislukt"}`
      );
    } finally {
      setIsLoading(false);
    }
  }

  function updateClue(
    index: number,
    key: "digit" | "clue_text" | "envelope_number",
    value: string
  ) {
    setClues((current) => {
      const copy = [...current];

      if (key === "digit") {
        copy[index] = {
          ...copy[index],
          digit: Number(value) || 0,
        };
      } else if (key === "envelope_number") {
        copy[index] = {
          ...copy[index],
          envelope_number: value === "" ? null : Number(value),
        };
      } else {
        copy[index] = {
          ...copy[index],
          clue_text: value,
        };
      }

      return copy;
    });
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-white px-4 py-6 text-zinc-800 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-xl shadow-rose-100 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-rose-700">
                Bachelorette escape
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-rose-950 sm:text-4xl">
                Admin dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-600 sm:text-base">
                Beheer rondes, kleuren en de flow van het spel vanuit één mooi overzicht.
              </p>
            </div>

            <div className="rounded-2xl bg-gradient-to-r from-rose-500 to-fuchsia-500 px-4 py-3 text-white shadow-lg">
              <p className="text-xs uppercase tracking-[0.2em] text-white/80">Status</p>
              <p className="mt-1 text-sm font-semibold">
                {statusMessage || "Nog geen actie uitgevoerd"}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-rose-100 bg-white p-6 shadow-lg shadow-rose-100/60">
            <h2 className="text-xl font-semibold text-rose-950">Inloggen</h2>
            <p className="mt-1 text-sm text-zinc-500">Gebruik je admin pin om de game te laden.</p>

            <div className="mt-5 flex flex-col gap-3">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-zinc-700">Admin pin</span>
                <input
                  className="rounded-2xl border border-rose-200 bg-rose-50/60 px-4 py-3 outline-none transition focus:border-rose-400 focus:bg-white"
                  type="password"
                  inputMode="numeric"
                  placeholder="Voer admin pin in"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void load();
                    }
                  }}
                />
              </label>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  className="rounded-2xl bg-gradient-to-r from-rose-500 to-fuchsia-500 px-5 py-3 font-semibold text-white shadow-md transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={load}
                  disabled={isLoading}
                >
                  {isLoading ? `Bezig...` : "Inloggen / laden"}
                </button>

                {data ? (
                  <button
                    className="rounded-2xl border border-rose-200 px-5 py-3 font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                    onClick={() => {
                      setData(null);
                      setStatusMessage("Uitgelogd");
                    }}
                    disabled={isLoading}
                  >
                    Uitloggen
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-fuchsia-100 bg-gradient-to-br from-rose-100 via-pink-50 to-fuchsia-100 p-6 shadow-lg shadow-rose-100/50">
            <h2 className="text-xl font-semibold text-rose-950">Mobiele sfeer</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-700">
              Geef spelersschermen per teamkleur een eigen achtergrond en houd teksten groot, vrolijk en duidelijk.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {Object.keys(COLOR_STYLES).map((color) => {
                const style = getColorStyle(color);
                return (
                  <div key={color} className={`rounded-2xl border p-4 ${style.card}`}>
                    <div className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase ${style.badge}`}>
                      {color}
                    </div>
                    <p className="mt-3 text-sm font-medium text-zinc-700">Gebruik deze look ook op het spelersscherm.</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {!data ? (
          <section className="rounded-[28px] border border-dashed border-rose-200 bg-white p-6 text-zinc-600 shadow-sm">
            Log eerst in met je admin pin om de game te beheren.
          </section>
        ) : (
          <>
            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[28px] border border-rose-100 bg-white p-6 shadow-lg shadow-rose-100/50">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-rose-950">Game</h2>
                    <p className="mt-1 text-sm text-zinc-500">Basisinformatie van de huidige sessie.</p>
                  </div>
                  <span className="rounded-full bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700">
                    Ronde {roundNumber}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-rose-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-rose-500">Naam</p>
                    <p className="mt-2 text-lg font-semibold text-rose-950">{data.game.name}</p>
                  </div>
                  <div className="rounded-2xl bg-fuchsia-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-500">Game ID</p>
                    <p className="mt-2 break-all text-sm font-semibold text-fuchsia-950">{data.game.id}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-rose-100 bg-white p-6 shadow-lg shadow-rose-100/50">
                <h2 className="text-2xl font-semibold text-rose-950">Ronde sturen</h2>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    className="rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-3 font-semibold text-white shadow-md transition hover:scale-[1.01] disabled:opacity-50"
                    onClick={assignColors}
                    disabled={isLoading}
                  >
                    Genereer kleuren
                  </button>
                  {Object.entries(SCREEN_LABELS).map(([screen, label]) => (
                    <button
                      key={screen}
                      className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                      onClick={() => setScreen(screen)}
                      disabled={isLoading}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-rose-100 bg-white p-6 shadow-lg shadow-rose-100/50">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-rose-950">Rondeconfig</h2>
                  <p className="mt-1 text-sm text-zinc-500">Vul hier de inhoud van de geselecteerde ronde in.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <input
                    className="w-28 rounded-2xl border border-rose-200 bg-rose-50/60 px-4 py-3 outline-none focus:border-rose-400 focus:bg-white"
                    type="number"
                    min={1}
                    value={roundNumber}
                    onChange={(e) => setRoundNumber(Number(e.target.value) || 1)}
                  />
                  <button
                    className="rounded-2xl border border-rose-200 px-4 py-3 font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                    onClick={loadSelectedRound}
                    disabled={isLoading}
                  >
                    Laad gekozen ronde
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <input
                  className="rounded-2xl border border-rose-200 bg-rose-50/50 px-4 py-3 outline-none transition focus:border-rose-400 focus:bg-white"
                  placeholder="Ronde titel"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <textarea
                  className="min-h-28 rounded-2xl border border-rose-200 bg-rose-50/50 px-4 py-3 outline-none transition focus:border-rose-400 focus:bg-white"
                  placeholder="Introtekst"
                  value={introText}
                  onChange={(e) => setIntroText(e.target.value)}
                />

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {clues.map((clue, index) => {
                    const style = getColorStyle(clue.color);
                    return (
                      <div
                        key={clue.color}
                        className={`rounded-[24px] border p-4 shadow-sm ${style.card}`}
                      >
                        <div className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase ${style.badge}`}>
                          {clue.color}
                        </div>

                        <div className="mt-4 grid gap-3">
                          <input
                            className="rounded-xl border border-white/70 bg-white/90 px-3 py-2 outline-none focus:border-zinc-300"
                            type="number"
                            placeholder="Digit"
                            value={clue.digit}
                            onChange={(e) => updateClue(index, "digit", e.target.value)}
                          />

                          <input
                            className="rounded-xl border border-white/70 bg-white/90 px-3 py-2 outline-none focus:border-zinc-300"
                            type="number"
                            placeholder="Envelopnummer"
                            value={clue.envelope_number ?? ""}
                            onChange={(e) => updateClue(index, "envelope_number", e.target.value)}
                          />

                          <input
                            className="rounded-xl border border-white/70 bg-white/90 px-3 py-2 outline-none focus:border-zinc-300"
                            placeholder="Clue tekst"
                            value={clue.clue_text}
                            onChange={(e) => updateClue(index, "clue_text", e.target.value)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <input
                  className="rounded-2xl border border-rose-200 bg-rose-50/50 px-4 py-3 outline-none transition focus:border-rose-400 focus:bg-white"
                  placeholder="Final code, bv 9742"
                  value={finalCode}
                  onChange={(e) => setFinalCode(e.target.value)}
                />

                <textarea
                  className="min-h-24 rounded-2xl border border-rose-200 bg-rose-50/50 px-4 py-3 outline-none transition focus:border-rose-400 focus:bg-white"
                  placeholder="Success tekst"
                  value={successText}
                  onChange={(e) => setSuccessText(e.target.value)}
                />

                <textarea
                  className="min-h-24 rounded-2xl border border-rose-200 bg-rose-50/50 px-4 py-3 outline-none transition focus:border-rose-400 focus:bg-white"
                  placeholder="Volgende hint"
                  value={nextHint}
                  onChange={(e) => setNextHint(e.target.value)}
                />

                <button
                  className="rounded-2xl bg-gradient-to-r from-rose-500 to-fuchsia-500 px-5 py-3 font-semibold text-white shadow-md transition hover:scale-[1.01] disabled:opacity-50"
                  onClick={saveRoundConfig}
                  disabled={isLoading}
                >
                  Save round config
                </button>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <section className="rounded-[28px] border border-rose-100 bg-white p-6 shadow-lg shadow-rose-100/50">
                <h2 className="text-2xl font-semibold text-rose-950">Kleurverdeling huidige ronde</h2>
                <div className="mt-5 grid gap-3">
                  {selectedRoundAssignments.length === 0 ? (
                    <p className="text-zinc-500">Nog geen kleurverdeling geladen.</p>
                  ) : (
                    selectedRoundAssignments.map((assignment) => {
                      const player = data.players.find((p) => p.id === assignment.player_id);
                      const style = getColorStyle(assignment.color);
                      return (
                        <div
                          key={`${assignment.player_id}-${assignment.color}`}
                          className={`flex items-center justify-between rounded-2xl border p-4 ${style.card}`}
                        >
                          <div>
                            <p className="font-semibold text-zinc-800">
                              {player?.display_name ?? assignment.player_id}
                            </p>
                            <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase ${style.badge}`}>
                              {assignment.color}
                            </div>
                          </div>
                          <p className="text-sm text-zinc-600">
                            locked: {String(assignment.locked_by_admin)}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              <section className="rounded-[28px] border border-rose-100 bg-white p-6 shadow-lg shadow-rose-100/50">
                <h2 className="text-2xl font-semibold text-rose-950">Spelers</h2>
                <div className="mt-5 grid gap-3">
                  {data.players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between rounded-2xl border border-rose-100 bg-rose-50/50 p-4"
                    >
                      <div>
                        <p className="font-semibold text-zinc-800">{player.display_name}</p>
                        <p className="mt-1 text-sm text-zinc-600">checked in: {String(player.is_checked_in)}</p>
                        <p className="text-sm text-zinc-600">active: {String(player.active)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
