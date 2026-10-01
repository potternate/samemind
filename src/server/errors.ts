export type GameErrorCode =
  | "bad_request"
  | "invalid_answer"
  | "not_found"
  | "conflict"
  | "ai_unavailable"
  | "internal";

const STATUS: Record<GameErrorCode, number> = {
  bad_request: 400,
  invalid_answer: 422,
  not_found: 404,
  conflict: 409,
  ai_unavailable: 503,
  internal: 500,
};

export class GameError extends Error {
  readonly status: number;

  constructor(
    readonly code: GameErrorCode,
    message: string,
  ) {
    super(message);
    this.status = STATUS[code];
  }
}
