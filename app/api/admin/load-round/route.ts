import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { adminPin, gameId, roundNumber } = await req.json();

    if (adminPin !== process.env.ADMIN_PIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!gameId || !roundNumber) {
      return NextResponse.json(
        { error: "gameId en roundNumber zijn verplicht" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: round } = await supabase
      .from("rounds")
      .select("*")
      .eq("game_id", gameId)
      .eq("round_number", roundNumber)
      .single();

    if (!round) {
      return NextResponse.json({ error: "Ronde niet gevonden" }, { status: 404 });
    }

    const { data: clues } = await supabase
      .from("round_color_clues")
      .select("*")
      .eq("round_id", round.id)
      .order("color");

    const { data: solution } = await supabase
      .from("round_solutions")
      .select("*")
      .eq("round_id", round.id)
      .single();

    const { data: assignments } = await supabase
      .from("round_assignments")
      .select("player_id, color, locked_by_admin")
      .eq("round_id", round.id);

    return NextResponse.json({
      round,
      clues: clues ?? [],
      solution: solution ?? null,
      assignments: assignments ?? [],
    });
  } catch (error) {
    console.error("load-round route error", error);
    return NextResponse.json(
      { error: "Server error in /api/admin/load-round" },
      { status: 500 }
    );
  }
}