import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { adminPin } = await req.json();

    if (adminPin !== process.env.ADMIN_PIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    const { data: game } = await supabase
      .from("games")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (!game) {
      return NextResponse.json({ error: "Geen game gevonden" }, { status: 404 });
    }

    const { data: players } = await supabase
      .from("players")
      .select("id, display_name, is_checked_in, active")
      .eq("game_id", game.id)
      .order("display_name");

    const { data: rounds } = await supabase
      .from("rounds")
      .select("*")
      .eq("game_id", game.id)
      .order("round_number");

    const { data: currentRound } = await supabase
      .from("rounds")
      .select("*")
      .eq("game_id", game.id)
      .eq("round_number", game.current_round_number)
      .single();

    const { data: assignments } = currentRound
      ? await supabase
          .from("round_assignments")
          .select("player_id, color, locked_by_admin")
          .eq("round_id", currentRound.id)
      : { data: [] };

    const { data: clues } = currentRound
      ? await supabase
          .from("round_color_clues")
          .select("*")
          .eq("round_id", currentRound.id)
          .order("color")
      : { data: [] };

    const { data: solution } = currentRound
      ? await supabase
          .from("round_solutions")
          .select("*")
          .eq("round_id", currentRound.id)
          .single()
      : { data: null };

    return NextResponse.json({
      game,
      players: players ?? [],
      rounds: rounds ?? [],
      currentRound,
      assignments: assignments ?? [],
      clues: clues ?? [],
      solution,
    });
  } catch (error) {
    console.error("bootstrap route error", error);
    return NextResponse.json(
      { error: "Server error in /api/admin/bootstrap" },
      { status: 500 }
    );
  }
}