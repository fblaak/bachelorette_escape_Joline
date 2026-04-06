export type Color = "red" | "blue" | "green" | "yellow";

export type PlayerScreen =
  | "waiting"
  | "gather"
  | "show_color"
  | "solve_clue"
  | "enter_final_code"
  | "correct"
  | "finished"
  | "time_up";
  | "paused"; 

export type GameResult = "playing" | "won" | "lost";

export type FinalCodeStatus = "idle" | "submitting" | "wrong" | "correct";

export type GameStatus = "setup" | "running" | "paused" | "finished";

export type PlayerStateResponse = {
  playerId: string;
  playerName: string;
  roundNumber: number;
  roundTitle: string;
  currentScreen: PlayerScreen;
  color: Color | null;
  introText: string | null;
  successText: string | null;
  nextHint: string | null;
  timerEnabled: boolean;
  endsAt: string | null;
  gameResult: GameResult;
  finalCodeStatus: FinalCodeStatus;
  finalCodeUpdatedAt: string | null;
  gameStatus: GameStatus;
};
