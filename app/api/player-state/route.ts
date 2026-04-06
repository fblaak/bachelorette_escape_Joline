import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const playerId = req.nextUrl.searchParams.get("playerId");
    const sessionId = req.nextUrl.searchParams.get("sessionId");

    if (!playerId || !sessionId) {
      return NextResponse.json({ error: "Missing session" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("id, display_name, session_id, game_id")
      .eq("id", playerId)
      .single();

    if (playerError || !player) {
      return NextResponse.json({ error: "Player niet gevonden" }, { status: 404 });
    }

    if (player.session_id !== sessionId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { data: game, error: gameError } = await supabase
      .from("games")
      .select(
        "id, current_round_number, timer_enabled, ends_at, game_result, final_code_status, final_code_updated_at, status"
      )
      .eq("id", player.game_id)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Game niet gevonden" }, { status: 404 });
    }

    const [{ data: round }, { data: screenState }] = await Promise.all([
      supabase
        .from("rounds")
        .select("id, round_number, title, intro_text")
        .eq("game_id", player.game_id)
        .eq("round_number", game.current_round_number)
        .single(),
      supabase
        .from("player_screen_state")
        .select("current_screen")
        .eq("player_id", playerId)
        .single(),
    ]);

    const [{ data: assignment }, { data: solution }] = round
      ? await Promise.all([
          supabase
            .from("round_assignments")
            .select("color")
            .eq("round_id", round.id)
            .eq("player_id", playerId)
            .single(),
          supabase
            .from("round_solutions")
            .select("success_text, next_hint")
            .eq("round_id", round.id)
            .single(),
        ])
      : [{ data: null }, { data: null }];

    let currentScreen = screenState?.current_screen ?? "waiting";
    let gameResult = game.game_result ?? "playing";

    const timerEnabled = Boolean(game.timer_enabled);
    const endsAt = game.ends_at ?? null;
    const finalCodeStatus = game.final_code_status ?? "idle";
    const finalCodeUpdatedAt = game.final_code_updated_at ?? null;

    const isTimeUp =
      timerEnabled &&
      endsAt &&
      gameResult === "playing" &&
      new Date().getTime() >= new Date(endsAt).getTime();

    if (isTimeUp) {
      gameResult = "lost";

      if (currentScreen !== "finished") {
        currentScreen = "time_up";
      }

      await supabase
        .from("games")
        .update({
          game_result: "lost",
          updated_at: new Date().toISOString(),
        })
        .eq("id", player.game_id);
    }

    void supabase
      .from("player_screen_state")
      .update({
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("player_id", playerId);

    return NextResponse.json({
      playerId: player.id,
      playerName: player.display_name,
      roundNumber: round?.round_number ?? game.current_round_number ?? 1,
      roundTitle: round?.title ?? "",
      currentScreen,
      color: assignment?.color ?? null,
      introText: round?.intro_text ?? null,
      successText: solution?.success_text ?? null,
      nextHint: solution?.next_hint ?? null,
      timerEnabled,
      endsAt,
      gameResult,
      finalCodeStatus,
      finalCodeUpdatedAt,
      gameStatus: game.status ?? "running",
    });
  } catch (error) {
    console.error("player-state error", error);
    return NextResponse.json(
      { error: "Kon spelerstatus niet laden" },
      { status: 500 }
    );
  }
}