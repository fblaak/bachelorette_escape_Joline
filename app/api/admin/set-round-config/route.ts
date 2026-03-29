import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { adminPin, gameId, roundNumber, title, introText, clues, solution } =
      await req.json();

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

    const { error: roundError } = await supabase
      .from("rounds")
      .update({
        title,
        intro_text: introText,
      })
      .eq("id", round.id);

    if (roundError) {
      return NextResponse.json({ error: roundError.message }, { status: 500 });
    }

    const { error: deleteCluesError } = await supabase
      .from("round_color_clues")
      .delete()
      .eq("round_id", round.id);

    if (deleteCluesError) {
      return NextResponse.json({ error: deleteCluesError.message }, { status: 500 });
    }

    if (Array.isArray(clues) && clues.length > 0) {
      const { error: insertCluesError } = await supabase
        .from("round_color_clues")
        .insert(
          clues.map((c: any) => ({
            round_id: round.id,
            color: c.color,
            digit: Number(c.digit),
            clue_text: c.clue_text ?? null,
            envelope_number:
              c.envelope_number === "" || c.envelope_number == null
                ? null
                : Number(c.envelope_number),
          }))
        );

      if (insertCluesError) {
        return NextResponse.json({ error: insertCluesError.message }, { status: 500 });
      }
    }

    const { error: solutionError } = await supabase
      .from("round_solutions")
      .upsert({
        round_id: round.id,
        final_code: solution.final_code,
        success_text: solution.success_text ?? null,
        next_hint: solution.next_hint ?? null,
      });

    if (solutionError) {
      return NextResponse.json({ error: solutionError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("set-round-config route error", error);
    return NextResponse.json(
      { error: "Server error in /api/admin/set-round-config" },
      { status: 500 }
    );
  }
}