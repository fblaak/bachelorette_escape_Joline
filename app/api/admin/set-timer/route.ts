import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminPin, gameId, minutes } = body as {
      adminPin?: string;
      gameId?: string;
      minutes?: number | null;
    };

    if (!adminPin || !gameId) {
      return NextResponse.json(
        { error: "Missing adminPin or gameId" },
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

    if (minutes === null) {
      const { error } = await supabase
        .from("games")
        .update({
          timer_enabled: false,
          ends_at: null,
          game_result: "playing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", gameId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, timerEnabled: false, endsAt: null });
    }

    if (
      typeof minutes !== "number" ||
      !Number.isFinite(minutes) ||
      minutes <= 0
    ) {
      return NextResponse.json(
        { error: "Minutes moet een positief getal zijn" },
        { status: 400 }
      );
    }

    const now = Date.now();
    const endsAt = new Date(now + minutes * 60 * 1000).toISOString();

    const { error } = await supabase
      .from("games")
      .update({
        timer_enabled: true,
        ends_at: endsAt,
        game_result: "playing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", gameId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      timerEnabled: true,
      endsAt,
    });
  } catch (error) {
    console.error("set-timer error", error);
    return NextResponse.json(
      { error: "Timer instellen mislukt" },
      { status: 500 }
    );
  }
}