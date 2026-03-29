import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const { playerId, joinCode } = await req.json();
  const supabase = getSupabaseAdmin();

  if (!playerId || !joinCode) {
    return NextResponse.json(
      { error: "Naam en join code zijn verplicht" },
      { status: 400 }
    );
  }

  const { data: player, error } = await supabase
    .from("players")
    .select("id, join_code, is_checked_in")
    .eq("id", playerId)
    .single();

  if (error || !player) {
    return NextResponse.json({ error: "Speler niet gevonden" }, { status: 404 });
  }

  if (player.join_code !== joinCode) {
    return NextResponse.json({ error: "Onjuiste join code" }, { status: 400 });
  }

  if (player.is_checked_in) {
    return NextResponse.json(
      { error: "Deze naam is al in gebruik" },
      { status: 409 }
    );
  }

  const sessionId = randomUUID();

  const { error: updateError } = await supabase
    .from("players")
    .update({
      is_checked_in: true,
      session_id: sessionId,
    })
    .eq("id", playerId);

  if (updateError) {
    return NextResponse.json(
      { error: "Kon speler niet koppelen" },
      { status: 500 }
    );
  }

  await supabase.from("player_screen_state").upsert({
    player_id: playerId,
    current_screen: "waiting",
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({ playerId, sessionId });
}