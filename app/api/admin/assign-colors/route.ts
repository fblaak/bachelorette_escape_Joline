import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { assignColors } from "@/lib/game";

export async function POST(req: NextRequest) {
  const { adminPin, gameId, roundNumber } = await req.json();

  if (adminPin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();

  const { data: round } = await supabase
    .from("rounds")
    .select("id")
    .eq("game_id", gameId)
    .eq("round_number", roundNumber)
    .single();

  if (!round) {
    return NextResponse.json({ error: "Ronde niet gevonden" }, { status: 404 });
  }

  const { data: players } = await supabase
    .from("players")
    .select("id")
    .eq("game_id", gameId)
    .eq("active", true);

  if (!players || players.length === 0) {
    return NextResponse.json({ error: "Geen spelers gevonden" }, { status: 404 });
  }

  const buckets = assignColors(players.map((p) => ({ id: p.id })));

  const rows = Object.entries(buckets).flatMap(([color, playerIds]) =>
    playerIds.map((playerId) => ({
      round_id: round.id,
      player_id: playerId,
      color,
      locked_by_admin: false,
    }))
  );

  await supabase.from("round_assignments").delete().eq("round_id", round.id);
  await supabase.from("round_assignments").insert(rows);

  return NextResponse.json({ ok: true, buckets });
}