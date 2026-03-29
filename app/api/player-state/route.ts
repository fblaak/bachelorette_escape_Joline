import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get("playerId");
  const sessionId = req.nextUrl.searchParams.get("sessionId");

  if (!playerId || !sessionId) {
    return NextResponse.json({ error: "Missing session" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: player } = await supabase
    .from("players")
    .select("id, display_name, session_id, game_id")
    .eq("id", playerId)
    .single();

  if (!player || player.session_id !== sessionId) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const { data: game } = await supabase
    .from("games")
    .select("id, current_round_number, timer_enabled, ends_at, game_result")
    .eq("id", player.game_id)
    .single();

  const { data: round } = await supabase
    .from("rounds")
    .select("id, round_number, title, intro_text")
    .eq("game_id", player.game_id)
    .eq("round_number", game!.current_round_number)
    .single();

  const { data: screenState } = await supabase
    .from("player_screen_state")
    .select("current_screen")
    .eq("player_id", playerId)
    .single();

  const { data: assignment } = round
    ? await supabase
        .from("round_assignments")
        .select("color")
        .eq("round_id", round.id)
        .eq("player_id", playerId)
        .single()
    : { data: null };

  const { data: solution } = round
    ? await supabase
        .from("round_solutions")
        .select("success_text, next_hint")
        .eq("round_id", round.id)
        .single()
    : { data: null };

  let currentScreen = screenState?.current_screen ?? "waiting";
  let gameResult = game?.game_result ?? "playing";

  const timerEnabled = Boolean(game?.timer_enabled);
  const endsAt = game?.ends_at ?? null;

  const isTimeUp =
    timerEnabled &&
    endsAt &&
    gameResult === "playing" &&
    new Date().getTime() >= new Date(endsAt).getTime();

  if (isTimeUp) {
    gameResult = "lost";
    currentScreen = "time_up";

    await supabase
      .from("games")
      .update({
        game_result: "lost",
        updated_at: new Date().toISOString(),
      })
      .eq("id", player.game_id);
  }

  await supabase
    .from("player_screen_state")
    .update({
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("player_id", playerId);

  return NextResponse.json({
    playerId: player.id,
    playerName: player.display_name,
    roundNumber: round?.round_number ?? 1,
    roundTitle: round?.title ?? "",
    currentScreen,
    color: assignment?.color ?? null,
    introText: round?.intro_text ?? null,
    successText: solution?.success_text ?? null,
    nextHint: solution?.next_hint ?? null,
    timerEnabled,
    endsAt,
    gameResult,
  });
}