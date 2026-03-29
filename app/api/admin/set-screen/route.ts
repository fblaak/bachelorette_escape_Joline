import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { adminPin, gameId, roundNumber, screen } = await req.json();

    if (adminPin !== process.env.ADMIN_PIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!gameId || !roundNumber || !screen) {
      return NextResponse.json(
        { error: "gameId, roundNumber en screen zijn verplicht" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: gameUpdate, error: gameError } = await supabase
      .from("games")
      .update({
        current_round_number: roundNumber,
        status: screen === "finished" ? "finished" : "running",
      })
      .eq("id", gameId)
      .select();

    if (gameError) {
      return NextResponse.json({ error: gameError.message }, { status: 500 });
    }

    const { data: roundUpdate, error: roundError } = await supabase
      .from("rounds")
      .update({ status: "live" })
      .eq("game_id", gameId)
      .eq("round_number", roundNumber)
      .select();

    if (roundError) {
      return NextResponse.json({ error: roundError.message }, { status: 500 });
    }

    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("id")
      .eq("game_id", gameId)
      .eq("active", true);

    if (playersError) {
      return NextResponse.json({ error: playersError.message }, { status: 500 });
    }

    if (!players?.length) {
      return NextResponse.json(
        { error: "Geen actieve spelers gevonden voor deze gameId" },
        { status: 400 }
      );
    }

    const { error: upsertError } = await supabase
      .from("player_screen_state")
      .upsert(
        players.map((p) => ({
          player_id: p.id,
          current_screen: screen,
          updated_at: new Date().toISOString(),
        }))
      );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      updatedPlayers: players.length,
      gameUpdate,
      roundUpdate,
    });
  } catch (error) {
    console.error("set-screen route error", error);
    return NextResponse.json(
      { error: "Server error in /api/admin/set-screen" },
      { status: 500 }
    );
  }
}