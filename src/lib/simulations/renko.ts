/**
 * Classic close-based Renko bricks as a pure function.
 *
 * Rules used in this lesson:
 * - Bricks have a fixed box size and sit on a grid anchored at the first close rounded down
 *   to a multiple of the box size.
 * - A new brick in the same direction needs the close to move one full box beyond the last brick.
 * - A reversal needs two boxes: the first opposite brick starts at the far side of the last brick.
 * - Highs, lows and time are ignored. One close can complete several bricks, or none at all.
 */

export type RenkoDirection = "up" | "down";

export type RenkoBrick = {
  /** Position in the brick sequence, starting at 0. */
  index: number;
  direction: RenkoDirection;
  /** Price where the brick starts. */
  open: number;
  /** Price where the brick ends. Up bricks close above their open, down bricks below. */
  close: number;
  /** Index of the close (candle) that completed this brick. */
  sourceIndex: number;
};

export type RenkoResult = {
  boxSize: number;
  bricks: RenkoBrick[];
  /** Grid anchor: the first close rounded down to the box size. */
  anchor: number;
  /** A close at or above this level adds an up brick. Null before the first close. */
  nextUp: number | null;
  /** A close at or below this level adds a down brick. Null before the first close. */
  nextDown: number | null;
};

export function buildRenko(closes: readonly number[], boxSize: number): RenkoResult {
  if (!(boxSize > 0)) throw new Error("boxSize must be positive");
  const bricks: RenkoBrick[] = [];
  if (closes.length === 0) return { boxSize, bricks, anchor: 0, nextUp: null, nextDown: null };

  const anchor = Math.floor(closes[0] / boxSize) * boxSize;
  // `top` and `bottom` are the edges of the last brick (both equal the anchor before any brick).
  // The next up brick always needs one box above `top`, the next down brick one box below `bottom`.
  // After an up brick, `bottom` is a box under its close, so a reversal needs two boxes: the rule
  // falls out of the geometry instead of needing a special case.
  let top = anchor;
  let bottom = anchor;

  const push = (direction: RenkoDirection, open: number, close: number, sourceIndex: number) => {
    bricks.push({ index: bricks.length, direction, open, close, sourceIndex });
    top = Math.max(open, close);
    bottom = Math.min(open, close);
  };

  closes.forEach((close, i) => {
    while (close >= top + boxSize) push("up", top, top + boxSize, i);
    while (close <= bottom - boxSize) push("down", bottom, bottom - boxSize, i);
  });

  return { boxSize, bricks, anchor, nextUp: top + boxSize, nextDown: bottom - boxSize };
}

/** Number of direction changes in a brick sequence (up to down or down to up). */
export function renkoReversals(bricks: readonly RenkoBrick[]): number {
  let count = 0;
  for (let i = 1; i < bricks.length; i += 1) if (bricks[i].direction !== bricks[i - 1].direction) count += 1;
  return count;
}
