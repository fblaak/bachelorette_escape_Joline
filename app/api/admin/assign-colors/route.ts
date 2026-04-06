import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { assignColorsSmart, type PastAssignment } from "@/lib/game";

export async function POST(req: NextRequest) {
  try {
    const { adminPin, gameId, roundNumber } = await req.json();

    if (adminPin !== process.env.ADMIN_PIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    const { data: round, error: roundError } = await supabase
      .from("rounds")
      .select("id, bride_color_lock")
      .eq("game_id", gameId)
      .eq("round_number", roundNumber)
      .maybeSingle();

    if (roundError) {
      console.error("assign-colors roundError", roundError);
      return NextResponse.json(
        { error: "Ronde ophalen mislukt" },
        { status: 500 }
      );
    }

    if (!round) {
      return NextResponse.json(
        { error: "Ronde niet gevonden" },
        { status: 404 }
      );
    }

    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("id, is_bride, is_checked_in, active")
      .eq("game_id", gameId)
      .eq("active", true)
      .eq("is_checked_in", true);

    if (playersError) {
      console.error("assign-colors playersError", playersError);
      return NextResponse.json(
        { error: "Spelers ophalen mislukt" },
        { status: 500 }
      );
    }

    if (!players || players.length === 0) {
      return NextResponse.json(
        { error: "Geen ingecheckte spelers gevonden" },
        { status: 404 }
      );
    }

    const bride = players.find((p) => p.is_bride);

    const participatingPlayers = players.map((p) => ({
      id: p.id,
      isBride: Boolean(p.is_bride),
    }));

    const { data: pastAssignmentsRows, error: historyError } = await supabase
      .from("round_assignments")
      .select(
        `
        round_id,
        player_id,
        color,
        rounds!inner (
          round_number,
          game_id
        )
      `
      )
      .eq("rounds.game_id", gameId);

    if (historyError) {
      console.error("assign-colors historyError", historyError);
      return NextResponse.json(
        { error: "Historische groepsindelingen ophalen mislukt" },
        { status: 500 }
      );
    }

    const pastAssignments: PastAssignment[] = (pastAssignmentsRows ?? []).map(
      (row: any) => ({
        roundNumber: row.rounds.round_number,
        playerId: row.player_id,
        color: row.color,
      })
    );

    const brideColorLock =
      round.bride_color_lock === "red" ||
      round.bride_color_lock === "blue" ||
      round.bride_color_lock === "green" ||
      round.bride_color_lock === "yellow"
        ? round.bride_color_lock
        : null;

    const buckets = assignColorsSmart({
      players: participatingPlayers,
      pastAssignments,
      currentRoundNumber: roundNumber,
      brideId: bride?.id ?? null,
      brideColorLock,
    });

    const rows = Object.entries(buckets).flatMap(([color, playerIds]) =>
      playerIds.map((playerId) => ({
        round_id: round.id,
        player_id: playerId,
        color,
        locked_by_admin: Boolean(brideColorLock) && playerId === bride?.id,
      }))
    );

    const { error: deleteAssignmentsError } = await supabase
      .from("round_assignments")
      .delete()
      .eq("round_id", round.id);

    if (deleteAssignmentsError) {
      console.error(
        "assign-colors deleteAssignmentsError",
        deleteAssignmentsError
      );
      return NextResponse.json(
        { error: "Oude kleurverdeling verwijderen mislukt" },
        { status: 500 }
      );
    }

    const { error: insertAssignmentsError } = await supabase
      .from("round_assignments")
      .insert(rows);

    if (insertAssignmentsError) {
      console.error(
        "assign-colors insertAssignmentsError",
        insertAssignmentsError,
        rows
      );
      return NextResponse.json(
        { error: "Kleurverdeling opslaan mislukt" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      buckets,
      checkedInPlayers: participatingPlayers.length,
      brideId: bride?.id ?? null,
      brideColorLock,
    });
  } catch (error) {
    console.error("assign-colors route error", error);
    return NextResponse.json(
      { error: "Server error in /api/admin/assign-colors" },
      { status: 500 }
    );
  }
}