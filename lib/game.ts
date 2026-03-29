import type { Color } from "./types";

type AssignablePlayer = {
  id: string;
  lockedColor?: Color | null;
};

const COLORS: Color[] = ["red", "blue", "green", "yellow"];

export function assignColors(players: AssignablePlayer[]) {
  const buckets: Record<Color, string[]> = {
    red: [],
    blue: [],
    green: [],
    yellow: [],
  };

  const unlocked: AssignablePlayer[] = [];

  for (const player of players) {
    if (player.lockedColor) {
      buckets[player.lockedColor].push(player.id);
    } else {
      unlocked.push(player);
    }
  }

  for (const player of unlocked) {
    const smallest = [...COLORS].sort(
      (a, b) => buckets[a].length - buckets[b].length
    )[0];

    buckets[smallest].push(player.id);
  }

  return buckets;
}