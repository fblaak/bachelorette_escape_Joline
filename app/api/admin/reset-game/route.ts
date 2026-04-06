import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { adminPin, gameId } = await req.json();

    const expectedAdminPin = process.env.ADMIN_PIN;

    if (!expectedAdminPin) {
      return NextResponse.json(
        { error: "ADMIN_PIN is niet ingesteld" },
        { status: 500 }
      );
    }

    if (adminPin !== expectedAdminPin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!gameId) {
      return NextResponse.json({ error: "Game ID ontbreekt" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("id")
      .eq("game_id", gameId);

    if (playersError) {
      console.error("reset-game playersError", playersError);
      return NextResponse.json(
        { error: "Spelers ophalen mislukt" },
        { status: 500 }
      );
    }

    const playerIds = players?.map((p) => p.id) ?? [];

    const { data: rounds, error: roundsError } = await supabase
      .from("rounds")
      .select("id")
      .eq("game_id", gameId);

    if (roundsError) {
      console.error("reset-game roundsError", roundsError);
      return NextResponse.json(
        { error: "Rondes ophalen mislukt" },
        { status: 500 }
      );
    }

    const roundIds = rounds?.map((r) => r.id) ?? [];

    const { error: gameError } = await supabase
      .from("games")
      .update({
        current_round_number: 1,
        status: "setup",
        timer_enabled: false,
        ends_at: null,
        game_result: "playing",
        final_code_status: "idle",
        final_code_updated_at: null,
        updated_at: now,
      })
      .eq("id", gameId);

    if (gameError) {
      console.error("reset-game gameError", gameError);
      return NextResponse.json(
        { error: "Game resetten mislukt" },
        { status: 500 }
      );
    }

    const { error: playerResetError } = await supabase
      .from("players")
      .update({
        session_id: null,
        is_checked_in: false,
      })
      .eq("game_id", gameId);

    if (playerResetError) {
      console.error("reset-game playerResetError", playerResetError);
      return NextResponse.json(
        { error: "Spelers resetten mislukt" },
        { status: 500 }
      );
    }

    if (playerIds.length > 0) {
      const { error: screenError } = await supabase
        .from("player_screen_state")
        .upsert(
          playerIds.map((playerId) => ({
            player_id: playerId,
            current_screen: "waiting",
            last_seen_at: null,
            updated_at: now,
          }))
        );

      if (screenError) {
        console.error("reset-game screenError", screenError);
        return NextResponse.json(
          { error: "Schermstatus resetten mislukt" },
          { status: 500 }
        );
      }
    }

    if (roundIds.length > 0) {
      const { error: submissionsError } = await supabase
        .from("round_final_submissions")
        .delete()
        .in("round_id", roundIds);

      if (submissionsError) {
        console.error("reset-game submissionsError", submissionsError);
        return NextResponse.json(
          { error: "Oude antwoorden verwijderen mislukt" },
          { status: 500 }
        );
      }

      const { error: assignmentsError } = await supabase
        .from("round_assignments")
        .delete()
        .in("round_id", roundIds);

      if (assignmentsError) {
        console.error("reset-game assignmentsError", assignmentsError);
        return NextResponse.json(
          { error: "Kleurverdeling resetten mislukt" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Spel is klaargezet voor een nieuwe start",
    });
  } catch (error) {
    console.error("reset-game error", error);
    return NextResponse.json(
      { error: "Server error in /api/admin/reset-game" },
      { status: 500 }
    );
  }
}