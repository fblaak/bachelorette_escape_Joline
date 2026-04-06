import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { adminPin, gameId, roundNumber, title, introText, brideColorLock, solution } =
      await req.json();

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

    const finalCode = String(solution?.final_code ?? "").trim();

    if (!finalCode || finalCode.length !== 4) {
      return NextResponse.json(
        { error: "Final code moet uit 4 cijfers bestaan" },
        { status: 400 }
      );
    }

    const normalizedBrideColorLock =
      brideColorLock === "red" ||
      brideColorLock === "blue" ||
      brideColorLock === "green" ||
      brideColorLock === "yellow"
        ? brideColorLock
        : null;

    const supabase = getSupabaseAdmin();

    const { data: existingRound, error: roundLookupError } = await supabase
      .from("rounds")
      .select("id")
      .eq("game_id", gameId)
      .eq("round_number", roundNumber)
      .maybeSingle();

    if (roundLookupError) {
      console.error("roundLookupError", roundLookupError);
      return NextResponse.json(
        { error: "Ronde opzoeken mislukt" },
        { status: 500 }
      );
    }

    let roundId = existingRound?.id ?? null;

    if (!roundId) {
      const { data: insertedRound, error: insertRoundError } = await supabase
        .from("rounds")
        .insert({
          game_id: gameId,
          round_number: roundNumber,
          title: title ?? `Ronde ${roundNumber}`,
          intro_text: introText ?? "",
          bride_color_lock: normalizedBrideColorLock,
        })
        .select("id")
        .single();

      if (insertRoundError || !insertedRound) {
        console.error("insertRoundError", insertRoundError);
        return NextResponse.json(
          { error: "Nieuwe ronde aanmaken mislukt" },
          { status: 500 }
        );
      }

      roundId = insertedRound.id;
    } else {
      const { error: updateRoundError } = await supabase
        .from("rounds")
        .update({
          title: title ?? `Ronde ${roundNumber}`,
          intro_text: introText ?? "",
          bride_color_lock: normalizedBrideColorLock,
        })
        .eq("id", roundId);

      if (updateRoundError) {
        console.error("updateRoundError", updateRoundError);
        return NextResponse.json(
          { error: "Ronde bijwerken mislukt" },
          { status: 500 }
        );
      }
    }

    const { error: solutionError } = await supabase
      .from("round_solutions")
      .upsert(
        {
          round_id: roundId,
          final_code: finalCode,
          success_text: solution?.success_text ?? "",
          next_hint: solution?.next_hint ?? "",
        },
        { onConflict: "round_id" }
      );

    if (solutionError) {
      console.error("solutionError", solutionError);
      return NextResponse.json(
        { error: "Code en rondeteksten opslaan mislukt" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      roundId,
      message: "Rondeconfig opgeslagen",
    });
  } catch (error) {
    console.error("set-round-config error", error);
    return NextResponse.json(
      { error: "Server error in /api/admin/set-round-config" },
      { status: 500 }
    );
  }
}