import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { adminPin, playerId } = await req.json();

    if (!adminPin || !playerId) {
      return NextResponse.json(
        { error: "Missing adminPin or playerId" },
        { status: 400 }
      );
    }

    const expectedAdminPin = process.env.ADMIN_PIN;

    if (!expectedAdminPin) {
      return NextResponse.json(
        { error: "ADMIN_PIN is niet ingesteld op de server" },
        { status: 500 }
      );
    }

    if (adminPin !== expectedAdminPin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    const { error: playerError } = await supabase
      .from("players")
      .update({
        is_checked_in: false,
        session_id: null,
      })
      .eq("id", playerId);

    if (playerError) {
      return NextResponse.json({ error: playerError.message }, { status: 500 });
    }

    const { error: screenError } = await supabase
      .from("player_screen_state")
      .update({
        current_screen: "waiting",
        updated_at: new Date().toISOString(),
      })
      .eq("player_id", playerId);

    if (screenError) {
      return NextResponse.json({ error: screenError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("logout-player error", error);
    return NextResponse.json(
      { error: "Speler uitloggen mislukt" },
      { status: 500 }
    );
  }
}