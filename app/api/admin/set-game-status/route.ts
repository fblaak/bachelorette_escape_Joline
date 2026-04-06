import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { adminPin, gameId, status } = await req.json();

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

    if (!["running", "paused"].includes(status)) {
      return NextResponse.json(
        { error: "Ongeldige status" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id, status, timer_enabled, ends_at, remaining_seconds")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Game niet gevonden" }, { status: 404 });
    }

    const now = new Date();
    const nowIso = now.toISOString();

    if (status === "paused") {
      let remainingSeconds: number | null = null;

      if (game.timer_enabled && game.ends_at) {
        const diffMs = new Date(game.ends_at).getTime() - now.getTime();
        remainingSeconds = Math.max(0, Math.ceil(diffMs / 1000));
      }

      const { error: pauseError } = await supabase
        .from("games")
        .update({
          status: "paused",
          paused_at: nowIso,
          remaining_seconds: remainingSeconds,
          updated_at: nowIso,
        })
        .eq("id", gameId);

      if (pauseError) {
        console.error("pauseError", pauseError);
        return NextResponse.json(
          { error: "Pauzeren mislukt" },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true, status: "paused" });
    }

    // status === "running"
    let newEndsAt: string | null = game.ends_at ?? null;

    if (game.timer_enabled && game.remaining_seconds !== null) {
      newEndsAt = new Date(
        now.getTime() + game.remaining_seconds * 1000
      ).toISOString();
    }

    const { error: resumeError } = await supabase
      .from("games")
      .update({
        status: "running",
        paused_at: null,
        ends_at: newEndsAt,
        remaining_seconds: null,
        updated_at: nowIso,
      })
      .eq("id", gameId);

    if (resumeError) {
      console.error("resumeError", resumeError);
      return NextResponse.json(
        { error: "Hervatten mislukt" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, status: "running" });
  } catch (error) {
    console.error("set-game-status error", error);
    return NextResponse.json(
      { error: "Server error in /api/admin/set-game-status" },
      { status: 500 }
    );
  }
}