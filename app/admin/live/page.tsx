"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type BootstrapResponse = {
  game: {
    id: string;
    current_round_number: number;
    name: string;
    status: "setup" | "running" | "paused" | "finished";
  };
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

const COLOR_STYLES: Record<
  string,
  {
    badge: string;
    card: string;
  }
> = {
  red: {
    badge: "bg-red-500 text-white",
    card: "border-red-200 bg-red-50",
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

export default function AdminLivePage() {
  const [adminPin, setAdminPin] = useState("");
  const [data, setData] = useState<BootstrapResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [roundNumber, setRoundNumber] = useState(1);
  const [brideColorLock, setBrideColorLock] = useState("");
  const [timerMinutes, setTimerMinutes] = useState(45);

  const selectedRoundAssignments = useMemo(() => {
    if (!data) return [];
    return data.assignments;
  }, [data]);

  const totalRounds = useMemo(() => {
    if (!data?.rounds?.length) return roundNumber;
    return Math.max(...data.rounds.map((r) => r.round_number), roundNumber);
  }, [data, roundNumber]);

  const isLastRound = roundNumber >= totalRounds;

  function requirePin() {
    if (!adminPin.trim()) {
      setStatusMessage("Vul eerst de admin pin in");
      return false;
    }
    return true;
  }

  function fillFromBootstrap(json: BootstrapResponse) {
    setData(json);
    setRoundNumber(json.game.current_round_number || 1);
    setBrideColorLock("");
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
    setStatusMessage("Bezig met laden...");

    try {
      const json = await postJson("/api/admin/bootstrap", {
        adminPin: adminPin.trim(),
      });

      fillFromBootstrap(json);
      setStatusMessage("Live-data geladen");
    } catch (error) {
      console.error(error);
      setStatusMessage(
        `FOUT: ${error instanceof Error ? error.message : "bootstrap mislukt"}`
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

    await postJson("/api/admin/set-screen", {
      adminPin: adminPin.trim(),
      gameId: data.game.id,
      roundNumber,
      screen,
    });
  }

  async function startTimer() {
    if (!data) {
      setStatusMessage("Laad eerst de admin-data");
      return;
    }
    if (!requirePin()) return;

    setIsLoading(true);
    setStatusMessage("Timer starten...");

    try {
      await postJson("/api/admin/set-timer", {
        adminPin: adminPin.trim(),
        gameId: data.game.id,
        minutes: timerMinutes,
        action: "start",
      });

      await load();
      setStatusMessage(`Timer gestart voor ${timerMinutes} minuten`);
    } catch (error) {
      console.error(error);
      setStatusMessage(
        `FOUT: ${error instanceof Error ? error.message : "timer starten mislukt"}`
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function goToWaiting() {
    if (!data) {
      setStatusMessage("Laad eerst de admin-data");
      return;
    }
    if (!requirePin()) return;

    setIsLoading(true);
    setStatusMessage("Wachten tonen...");

    try {
      await setScreen("waiting");
      setStatusMessage("Wachten scherm getoond");
    } catch (error) {
      console.error(error);
      setStatusMessage(
        `FOUT: ${error instanceof Error ? error.message : "wachten mislukt"}`
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function goToGather() {
    if (!data) {
      setStatusMessage("Laad eerst de admin-data");
      return;
    }
    if (!requirePin()) return;

    setIsLoading(true);
    setStatusMessage("Verzamelen tonen...");

    try {
      await setScreen("gather");
      setStatusMessage("Verzamelen scherm getoond");
    } catch (error) {
      console.error(error);
      setStatusMessage(
        `FOUT: ${
          error instanceof Error ? error.message : "verzamelen mislukt"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function showColorsFlow() {
    if (!data) {
      setStatusMessage("Laad eerst de admin-data");
      return;
    }
    if (!requirePin()) return;

    setIsLoading(true);
    setStatusMessage("Kleuren tonen...");

    try {
      await postJson("/api/admin/assign-colors", {
        adminPin: adminPin.trim(),
        gameId: data.game.id,
        roundNumber,
        brideColorLock: brideColorLock || null,
      });

      await postJson("/api/admin/set-screen", {
        adminPin: adminPin.trim(),
        gameId: data.game.id,
        roundNumber,
        screen: "show_color",
      });

      setStatusMessage("Kleuren getoond, raadsel volgt...");

      await new Promise((resolve) => setTimeout(resolve, 2000));

      await postJson("/api/admin/set-screen", {
        adminPin: adminPin.trim(),
        gameId: data.game.id,
        roundNumber,
        screen: "solve_clue",
      });

      await load();
      setStatusMessage("Raadselscherm getoond");
    } catch (error) {
      console.error(error);
      setStatusMessage(
        `FOUT: ${error instanceof Error ? error.message : "toon kleur mislukt"}`
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function openEnterCode() {
    if (!data) {
      setStatusMessage("Laad eerst de admin-data");
      return;
    }
    if (!requirePin()) return;

    setIsLoading(true);
    setStatusMessage("Code-invoer openen...");

    try {
      await setScreen("enter_final_code");
      setStatusMessage("Code-invoerscherm getoond");
    } catch (error) {
      console.error(error);
      setStatusMessage(
        `FOUT: ${
          error instanceof Error ? error.message : "code-invoer mislukt"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function forceApprove() {
    if (!data) {
      setStatusMessage("Laad eerst de admin-data");
      return;
    }
    if (!requirePin()) return;

    setIsLoading(true);
    setStatusMessage("Goedkeuring forceren...");

    try {
      await setScreen(isLastRound ? "finished" : "correct");
      setStatusMessage(
        isLastRound
          ? "Laatste ronde geforceerd afgerond"
          : "Code geforceerd goedgekeurd"
      );
    } catch (error) {
      console.error(error);
      setStatusMessage(
        `FOUT: ${error instanceof Error ? error.message : "forceren mislukt"}`
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function resetGame() {
    if (!data) {
      setStatusMessage("Laad eerst de admin-data");
      return;
    }
    if (!requirePin()) return;

    const confirmed = window.confirm(
      "Weet je zeker dat je het spel wilt resetten?\n\nAlle spelers worden uitgelogd en alle antwoorden worden verwijderd."
    );

    if (!confirmed) return;

    setIsLoading(true);
    setStatusMessage("Spel resetten...");

    try {
      await postJson("/api/admin/reset-game", {
        adminPin: adminPin.trim(),
        gameId: data.game.id,
      });

      await load();
      setStatusMessage("Spel is klaargezet voor start");
    } catch (error) {
      console.error(error);
      setStatusMessage(
        `FOUT: ${error instanceof Error ? error.message : "reset mislukt"}`
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function togglePause() {
    if (!data) {
      setStatusMessage("Laad eerst de admin-data");
      return;
    }
    if (!requirePin()) return;

    const confirmed =
      data.game.status === "paused"
        ? true
        : window.confirm("Weet je zeker dat je het spel wilt pauzeren?");

    if (!confirmed) return;

    const newStatus = data.game.status === "paused" ? "running" : "paused";

    setIsLoading(true);
    setStatusMessage("Status aanpassen...");

    try {
      await postJson("/api/admin/set-game-status", {
        adminPin: adminPin.trim(),
        gameId: data.game.id,
        status: newStatus,
      });

      await load();

      setStatusMessage(
        newStatus === "paused" ? "Spel gepauzeerd" : "Spel hervat"
      );
    } catch (error) {
      console.error(error);
      setStatusMessage(
        `FOUT: ${
          error instanceof Error ? error.message : "status wijzigen mislukt"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function nextRound() {
    if (!data) {
      setStatusMessage("Laad eerst de admin-data");
      return;
    }
    if (!requirePin()) return;

    const next = roundNumber + 1;

    if (next > totalRounds) {
      setStatusMessage("Dit is al de laatste ronde");
      return;
    }

    setIsLoading(true);
    setStatusMessage(`Naar ronde ${next} gaan...`);

    try {
      await postJson("/api/admin/bootstrap", {
        adminPin: adminPin.trim(),
        currentRoundNumber: next,
      });

      await postJson("/api/admin/set-screen", {
        adminPin: adminPin.trim(),
        gameId: data.game.id,
        roundNumber: next,
        screen: "waiting",
      });

      await load();
      setStatusMessage(`Ronde ${next} gestart (wachten)`);
    } catch (error) {
      console.error(error);
      setStatusMessage(
        `FOUT: ${
          error instanceof Error ? error.message : "volgende ronde mislukt"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function logoutPlayer(playerId: string, playerName: string) {
    if (!requirePin()) return;

    const confirmed = window.confirm(
      `Weet je zeker dat je ${playerName} wilt uitloggen?`
    );

    if (!confirmed) return;

    setIsLoading(true);
    setStatusMessage(`${playerName} uitloggen...`);

    try {
      await postJson("/api/admin/logout-player", {
        adminPin: adminPin.trim(),
        playerId,
      });

      await load();
      setStatusMessage(`${playerName} is uitgelogd`);
    } catch (error) {
      console.error(error);
      setStatusMessage(
        `FOUT: ${
          error instanceof Error ? error.message : "speler uitloggen mislukt"
        }`
      );
    } finally {
      setIsLoading(false);
    }
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
                Admin live
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-600 sm:text-base">
                Gebruik deze pagina alleen tijdens het spel.
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/admin"
                className="rounded-2xl border border-rose-200 px-4 py-3 font-medium text-rose-700 transition hover:bg-rose-50"
              >
                Terug
              </Link>
              <Link
                href="/admin/setup"
                className="rounded-2xl bg-gradient-to-r from-rose-500 to-fuchsia-500 px-4 py-3 font-semibold text-white shadow-md transition hover:scale-[1.01]"
              >
                Naar setup
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-rose-100 bg-white p-6 shadow-lg shadow-rose-100/60">
          <h2 className="text-xl font-semibold text-rose-950">Inloggen</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Gebruik je admin pin om de live spelleiding te laden.
          </p>

          <div className="mt-5 flex flex-col gap-3">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-700">
                Admin pin
              </span>
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
                {isLoading ? "Bezig..." : "Inloggen / laden"}
              </button>

              <button
                className="rounded-2xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-200 disabled:opacity-50"
                onClick={resetGame}
                disabled={isLoading}
              >
                Klaarzetten voor start
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
        </section>

        <section className="rounded-[28px] bg-gradient-to-r from-rose-500 to-fuchsia-500 px-4 py-4 text-white shadow-lg">
          <p className="text-xs uppercase tracking-[0.2em] text-white/80">
            Status
          </p>
          <p className="mt-1 text-sm font-semibold">
            {statusMessage || "Nog geen actie uitgevoerd"}
          </p>
        </section>

        <section className="rounded-[28px] border border-rose-100 bg-white p-6 shadow-lg shadow-rose-100/50">
          <h2 className="text-2xl font-semibold text-rose-950">Timer</h2>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <input
              className="w-28 rounded-2xl border border-rose-200 bg-rose-50/60 px-4 py-3 outline-none focus:border-rose-400 focus:bg-white"
              type="number"
              min={1}
              value={timerMinutes}
              onChange={(e) => setTimerMinutes(Number(e.target.value) || 1)}
            />

            <button
              className="rounded-2xl bg-gradient-to-r from-rose-500 to-fuchsia-500 px-4 py-3 font-semibold text-white shadow-md transition hover:scale-[1.01] disabled:opacity-50"
              onClick={startTimer}
              disabled={isLoading}
            >
              Start timer
            </button>
          </div>
        </section>

        {!data ? (
          <section className="rounded-[28px] border border-dashed border-rose-200 bg-white p-6 text-zinc-600 shadow-sm">
            Log eerst in met je admin pin om het spel live te begeleiden.
          </section>
        ) : (
          <>
            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[28px] border border-rose-100 bg-white p-6 shadow-lg shadow-rose-100/50">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-rose-950">
                      Game
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      Overzicht van de live sessie.
                    </p>
                  </div>
                  <span className="rounded-full bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700">
                    Ronde {roundNumber} / {totalRounds}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-rose-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-rose-500">
                      Naam
                    </p>
                    <p className="mt-2 text-lg font-semibold text-rose-950">
                      {data.game.name}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-fuchsia-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-500">
                      Huidige ronde
                    </p>
                    <p className="mt-2 text-lg font-semibold text-fuchsia-950">
                      {roundNumber}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    className="rounded-2xl border border-rose-200 px-4 py-3 font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                    onClick={nextRound}
                    disabled={isLoading || isLastRound}
                  >
                    Volgende ronde
                  </button>
                </div>
              </div>

              <div className="rounded-[28px] border border-rose-100 bg-white p-6 shadow-lg shadow-rose-100/50">
                <h2 className="text-2xl font-semibold text-rose-950">
                  Spel sturen
                </h2>

                <div className="mt-5 flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="text-sm font-medium text-zinc-700">
                      Kleur bruid deze ronde
                    </label>

                    <select
                      className="rounded-2xl border border-rose-200 bg-rose-50/60 px-4 py-3 outline-none focus:border-rose-400 focus:bg-white"
                      value={brideColorLock}
                      onChange={(e) => setBrideColorLock(e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="">Vrij laten</option>
                      <option value="red">Rood</option>
                      <option value="blue">Blauw</option>
                      <option value="green">Groen</option>
                      <option value="yellow">Geel</option>
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                      onClick={goToWaiting}
                      disabled={isLoading}
                    >
                      Wachten
                    </button>

                    <button
                      className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                      onClick={goToGather}
                      disabled={isLoading}
                    >
                      Verzamelen
                    </button>

                    <button
                      className="rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-3 font-semibold text-white shadow-md transition hover:scale-[1.01] disabled:opacity-50"
                      onClick={showColorsFlow}
                      disabled={isLoading}
                    >
                      Toon kleur
                    </button>

                    <button
                      className="rounded-2xl bg-gradient-to-r from-rose-500 to-fuchsia-500 px-4 py-3 font-semibold text-white shadow-md transition hover:scale-[1.01] disabled:opacity-50"
                      onClick={openEnterCode}
                      disabled={isLoading}
                    >
                      Voer code in
                    </button>

                    <button
                      className="rounded-2xl border border-yellow-300 bg-yellow-100 px-4 py-3 text-sm font-semibold text-yellow-800 transition hover:bg-yellow-200 disabled:opacity-50"
                      onClick={togglePause}
                      disabled={isLoading}
                    >
                      {data.game.status === "paused" ? "Hervatten" : "Pauze"}
                    </button>

                    <button
                      className="rounded-2xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-200 disabled:opacity-50"
                      onClick={forceApprove}
                      disabled={isLoading}
                    >
                      Forceer goedkeuring
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <section className="rounded-[28px] border border-rose-100 bg-white p-6 shadow-lg shadow-rose-100/50">
                <h2 className="text-2xl font-semibold text-rose-950">
                  Kleurverdeling huidige ronde
                </h2>

                <div className="mt-5 grid gap-3">
                  {selectedRoundAssignments.length === 0 ? (
                    <p className="text-zinc-500">
                      Nog geen kleurverdeling geladen.
                    </p>
                  ) : (
                    selectedRoundAssignments.map((assignment) => {
                      const player = data.players.find(
                        (p) => p.id === assignment.player_id
                      );
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
                            <div
                              className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase ${style.badge}`}
                            >
                              {assignment.color}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              <section className="rounded-[28px] border border-rose-100 bg-white p-6 shadow-lg shadow-rose-100/50">
                <h2 className="text-2xl font-semibold text-rose-950">
                  Spelers
                </h2>

                <div className="mt-5 grid gap-3">
                  {data.players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between rounded-2xl border border-rose-100 bg-rose-50/50 p-4"
                    >
                      <div>
                        <p className="font-semibold text-zinc-800">
                          {player.display_name}
                        </p>
                        <p className="mt-1 text-sm text-zinc-600">
                          Ingecheckt: {player.is_checked_in ? "ja" : "nee"}
                        </p>
                        <p className="text-sm text-zinc-600">
                          Actief: {player.active ? "ja" : "nee"}
                        </p>
                      </div>

                      <button
                        className="rounded-xl border border-red-300 bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200 disabled:opacity-50"
                        onClick={() =>
                          logoutPlayer(player.id, player.display_name)
                        }
                        disabled={isLoading}
                      >
                        Uitloggen
                      </button>
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