export type TeamColor = "red" | "blue" | "green" | "yellow";

export type PlayerInput = {
  id: string;
  isBride?: boolean;
};

export type PastAssignment = {
  roundNumber: number;
  playerId: string;
  color: string;
};

type AssignColorsSmartInput = {
  players: PlayerInput[];
  pastAssignments: PastAssignment[];
  currentRoundNumber: number;
  brideId: string | null;
  brideColorLock: TeamColor | null;
};

const COLORS: TeamColor[] = ["red", "blue", "green", "yellow"];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildPastGroups(pastAssignments: PastAssignment[]) {
  const roundColorMap = new Map<string, string[]>();

  for (const row of pastAssignments) {
    const key = `${row.roundNumber}-${row.color}`;
    const existing = roundColorMap.get(key) ?? [];
    existing.push(row.playerId);
    roundColorMap.set(key, existing);
  }

  return Array.from(roundColorMap.values());
}

function getPairScore(playerId: string, group: string[], pastGroups: string[][]) {
  let score = 0;

  for (const member of group) {
    for (const pastGroup of pastGroups) {
      if (pastGroup.includes(playerId) && pastGroup.includes(member)) {
        score += 1;
      }
    }
  }

  return score;
}

function getTargetSizes(playerCount: number) {
  const base = Math.floor(playerCount / 4);
  const remainder = playerCount % 4;

  return COLORS.map((_, index) => base + (index < remainder ? 1 : 0));
}

export function assignColorsSmart({
  players,
  pastAssignments,
  brideId,
  brideColorLock,
}: AssignColorsSmartInput): Record<TeamColor, string[]> {
  const buckets: Record<TeamColor, string[]> = {
    red: [],
    blue: [],
    green: [],
    yellow: [],
  };

  const pastGroups = buildPastGroups(pastAssignments);
  const targetSizes = getTargetSizes(players.length);

  const targetSizeByColor: Record<TeamColor, number> = {
    red: targetSizes[0],
    blue: targetSizes[1],
    green: targetSizes[2],
    yellow: targetSizes[3],
  };

  const playerIds = players.map((p) => p.id);
  let remaining = shuffle(playerIds);

  if (brideId && brideColorLock && remaining.includes(brideId)) {
    buckets[brideColorLock].push(brideId);
    remaining = remaining.filter((id) => id !== brideId);
  }

  while (remaining.length > 0) {
    const playerId = remaining.shift() as string;

    const availableColors = COLORS.filter(
      (color) => buckets[color].length < targetSizeByColor[color]
    );

    let bestColor = availableColors[0];
    let bestScore = Number.POSITIVE_INFINITY;

    for (const color of availableColors) {
      const currentGroup = buckets[color];
      const pairScore = getPairScore(playerId, currentGroup, pastGroups);

      // kleine bias naar kleinere groepen
      const sizePenalty = currentGroup.length * 0.01;
      const totalScore = pairScore + sizePenalty;

      if (totalScore < bestScore) {
        bestScore = totalScore;
        bestColor = color;
      }
    }

    buckets[bestColor].push(playerId);
  }

  return buckets;
}