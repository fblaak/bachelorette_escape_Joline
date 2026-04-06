import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { adminPin, gameId, roundNumber } = await req.json();

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

    if (!roundNumber || Number(roundNumber) < 1) {
      return NextResponse.json(
        { error: "Ongeldig rondenummer" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: round, error: roundError } = await supabase
      .from("rounds")
      .select("id, round_number, title, intro_text, bride_color_lock")
      .eq("game_id", gameId)
      .eq("round_number", roundNumber)
      .maybeSingle();

    if (roundError) {
      console.error("load-round roundError", roundError);
      return NextResponse.json(
        { error: "Ronde laden mislukt" },
        { status: 500 }
      );
    }

    if (!round) {
      return NextResponse.json({
        round: {
          id: null,
          round_number: Number(roundNumber),
          title: "",
          intro_text: "",
          bride_color_lock: null,
        },
        solution: {
          final_code: "",
          success_text: "",
          next_hint: "",
        },
        clues: [],
        isNewRound: true,
      });
    }

    const { data: solution, error: solutionError } = await supabase
      .from("round_solutions")
      .select("final_code, success_text, next_hint")
      .eq("round_id", round.id)
      .maybeSingle();

    if (solutionError) {
      console.error("load-round solutionError", solutionError);
      return NextResponse.json(
        { error: "Ronde-oplossing laden mislukt" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      round,
      solution: {
        final_code: solution?.final_code ?? "",
        success_text: solution?.success_text ?? "",
        next_hint: solution?.next_hint ?? "",
      },
      clues: [],
      isNewRound: false,
    });
  } catch (error) {
    console.error("load-round error", error);
    return NextResponse.json(
      { error: "Server error in /api/admin/load-round" },
      { status: 500 }
    );
  }
}