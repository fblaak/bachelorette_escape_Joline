import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { playerId, sessionId, code } = await req.json();
    const supabase = getSupabaseAdmin();

    const { data: player } = await supabase
      .from("players")
      .select("id, session_id, game_id")
      .eq("id", playerId)
      .single();

    if (!player || player.session_id !== sessionId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { data: game } = await supabase
      .from("games")
      .select("current_round_number, timer_enabled, ends_at, game_result")
      .eq("id", player.game_id)
      .single();

    if (!game) {
      return NextResponse.json({ error: "Game niet gevonden" }, { status: 404 });
    }

    if (
      game.timer_enabled &&
      game.ends_at &&
      game.game_result === "playing" &&
      new Date().getTime() >= new Date(game.ends_at).getTime()
    ) {
      await supabase
        .from("games")
        .update({
          game_result: "lost",
          updated_at: new Date().toISOString(),
        })
        .eq("id", player.game_id);

      return NextResponse.json(
        { error: "De tijd is op" },
        { status: 400 }
      );
    }

    if (game.game_result === "won") {
      return NextResponse.json(
        { error: "Het spel is al gewonnen" },
        { status: 400 }
      );
    }

    if (game.game_result === "lost") {
      return NextResponse.json(
        { error: "Het spel is al verloren" },
        { status: 400 }
      );
    }

    const { data: round } = await supabase
      .from("rounds")
      .select("id")
      .eq("game_id", player.game_id)
      .eq("round_number", game.current_round_number)
      .single();

    if (!round) {
      return NextResponse.json({ error: "Ronde niet gevonden" }, { status: 404 });
    }

    const { data: solution } = await supabase
      .from("round_solutions")
      .select("final_code")
      .eq("round_id", round.id)
      .single();

    if (!solution?.final_code) {
      return NextResponse.json(
        { error: "Final code is niet ingesteld" },
        { status: 400 }
      );
    }

    const normalizedInput = String(code ?? "").trim();
    const isCorrect = normalizedInput === solution.final_code;

    await supabase.from("round_final_submissions").insert({
      round_id: round.id,
      player_id: playerId,
      submitted_code: normalizedInput,
      is_correct: isCorrect,
    });

    if (!isCorrect) {
      return NextResponse.json({ error: "Code klopt niet" }, { status: 400 });
    }

    await supabase
      .from("games")
      .update({
        game_result: "won",
        updated_at: new Date().toISOString(),
      })
      .eq("id", player.game_id);

    const { data: players } = await supabase
      .from("players")
      .select("id")
      .eq("game_id", player.game_id)
      .eq("active", true);

    if (players?.length) {
      await supabase.from("player_screen_state").upsert(
        players.map((p) => ({
          player_id: p.id,
          current_screen: "correct",
          updated_at: new Date().toISOString(),
        }))
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("submit-final-code error", error);
    return NextResponse.json(
      { error: "Server error in /api/submit-final-code" },
      { status: 500 }
    );
  }
}