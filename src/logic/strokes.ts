// Drawn signature as compact canonical text. Strokes are separated by ";"; each stroke lists the
// first point "x,y" followed by the deltas "dx,dy" of every further point, all integers inside
// STROKE_BOX. Only the shape is kept — no timing, no pressure, i.e. no biometric data.

export const STROKE_BOX = { width: 1000, height: 400 } as const;
export const MAX_STROKES = 64;
export const MAX_POINTS = 4000;
/** Plausibility only — rejects an accidental tap, it cannot tell whose signature it is. */
export const MIN_SIGNATURE_POINTS = 5;
export const MIN_SIGNATURE_WIDTH = 40;

export interface Point {
  x: number;
  y: number;
}

export type Strokes = readonly (readonly Point[])[];

const INTEGER = /^(?:0|-?[1-9]\d*)$/;

function inBox({ x, y }: Point): boolean {
  return (
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    x >= 0 &&
    y >= 0 &&
    x <= STROKE_BOX.width &&
    y <= STROKE_BOX.height
  );
}

/** Why strokes cannot be encoded, or undefined when they are fine. */
export function strokesProblem(strokes: Strokes): string | undefined {
  if (strokes.length === 0) return 'no stroke';
  if (strokes.length > MAX_STROKES) return `more than ${MAX_STROKES} strokes`;
  const points = strokes.reduce((sum, stroke) => sum + stroke.length, 0);
  if (points > MAX_POINTS) return `more than ${MAX_POINTS} points`;
  if (strokes.some((stroke) => stroke.length === 0)) return 'empty stroke';
  if (!strokes.every((stroke) => stroke.every(inBox))) {
    return `point outside the ${STROKE_BOX.width}×${STROKE_BOX.height} integer box`;
  }
  return undefined;
}

/** Why valid strokes do not look like a signature (too few points, too narrow), if so. */
export function signatureShapeProblem(strokes: Strokes): string | undefined {
  const points = strokes.flat();
  if (points.length < MIN_SIGNATURE_POINTS) return 'too few points';
  const xs = points.map((point) => point.x);
  if (Math.max(...xs) - Math.min(...xs) < MIN_SIGNATURE_WIDTH) return 'too narrow';
  return undefined;
}

export function encodeStrokes(strokes: Strokes): string {
  const problem = strokesProblem(strokes);
  if (problem) throw new RangeError(`Cannot encode strokes: ${problem}`);
  return strokes
    .map((stroke) =>
      stroke
        .map((point, i) => {
          const previous = stroke[i - 1];
          return previous
            ? `${point.x - previous.x},${point.y - previous.y}`
            : `${point.x},${point.y}`;
        })
        .join(','),
    )
    .join(';');
}

/** Strict inverse of encodeStrokes: only the canonical encoding of valid strokes is accepted. */
export function decodeStrokes(
  text: string,
): { ok: true; strokes: Point[][] } | { ok: false; reason: string } {
  const strokes: Point[][] = [];
  for (const part of text.split(';')) {
    const numbers = part.split(',');
    if (numbers.length % 2 !== 0 || !numbers.every((n) => INTEGER.test(n))) {
      return { ok: false, reason: 'not a list of integer pairs' };
    }
    const values = numbers.map(Number);
    const stroke: Point[] = [];
    for (let i = 0; i < values.length; i += 2) {
      const previous = stroke.at(-1);
      const dx = values[i] ?? 0;
      const dy = values[i + 1] ?? 0;
      stroke.push(previous ? { x: previous.x + dx, y: previous.y + dy } : { x: dx, y: dy });
    }
    strokes.push(stroke);
  }
  const problem = strokesProblem(strokes);
  return problem ? { ok: false, reason: problem } : { ok: true, strokes };
}
