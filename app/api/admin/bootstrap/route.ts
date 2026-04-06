import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { adminPin, currentRoundNumber } = await req.json();

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

    const supabase = getSupabaseAdmin();

    const { data: firstGame, error: gameError } = await supabase
      .from("games")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (gameError || !firstGame) {
      return NextResponse.json(
        { error: "Geen game gevonden" },
        { status: 404 }
      );
    }

    let game = firstGame;

    if (
      currentRoundNumber !== undefined &&
      currentRoundNumber !== null &&
      Number(currentRoundNumber) >= 1
    ) {
      const { data: updatedGame, error: updateGameError } = await supabase
        .from("games")
        .update({
          current_round_number: Number(currentRoundNumber),
          updated_at: new Date().toISOString(),
        })
        .eq("id", firstGame.id)
        .select("*")
        .single();

      if (updateGameError || !updatedGame) {
        console.error("bootstrap updateGameError", updateGameError);
        return NextResponse.json(
          { error: "Huidige ronde bijwerken mislukt" },
          { status: 500 }
        );
      }

      game = updatedGame;
    }

    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("id, display_name, is_checked_in, active")
      .eq("game_id", game.id)
      .order("display_name");

    if (playersError) {
      console.error("bootstrap playersError", playersError);
      return NextResponse.json(
        { error: "Spelers laden mislukt" },
        { status: 500 }
      );
    }

    const { data: rounds, error: roundsError } = await supabase
      .from("rounds")
      .select("*")
      .eq("game_id", game.id)
      .order("round_number");

    if (roundsError) {
      console.error("bootstrap roundsError", roundsError);
      return NextResponse.json(
        { error: "Rondes laden mislukt" },
        { status: 500 }
      );
    }

    const { data: currentRound, error: currentRoundError } = await supabase
      .from("rounds")
      .select("*")
      .eq("game_id", game.id)
      .eq("round_number", game.current_round_number)
      .maybeSingle();

    if (currentRoundError) {
      console.error("bootstrap currentRoundError", currentRoundError);
      return NextResponse.json(
        { error: "Huidige ronde laden mislukt" },
        { status: 500 }
      );
    }

    const [{ data: assignments }, { data: clues }, { data: solution }] =
      currentRound
        ? await Promise.all([
            supabase
              .from("round_assignments")
              .select("player_id, color, locked_by_admin")
              .eq("round_id", currentRound.id),
            supabase
              .from("round_color_clues")
              .select("*")
              .eq("round_id", currentRound.id)
              .order("color"),
            supabase
              .from("round_solutions")
              .select("*")
              .eq("round_id", currentRound.id)
              .maybeSingle(),
          ])
        : [{ data: [] }, { data: [] }, { data: null }];

    const totalRounds =
      rounds && rounds.length > 0
        ? Math.max(...rounds.map((r) => r.round_number), game.current_round_number)
        : game.current_round_number;

    return NextResponse.json({
      game,
      players: players ?? [],
      rounds: rounds ?? [],
      currentRound:
        currentRound ??
        ({
          id: null,
          round_number: game.current_round_number,
          title: "",
          intro_text: "",
        } as const),
      assignments: assignments ?? [],
      clues: clues ?? [],
      solution:
        solution ?? {
          final_code: "",
          success_text: "",
          next_hint: "",
        },
      totalRounds,
      isCurrentRoundNew: !currentRound,
    });
  } catch (error) {
    console.error("bootstrap route error", error);
    return NextResponse.json(
      { error: "Server error in /api/admin/bootstrap" },
      { status: 500 }
    );
  }
}