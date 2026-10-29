import {
  MAX_POINTS,
  MAX_STROKES,
  MIN_SIGNATURE_POINTS,
  MIN_SIGNATURE_WIDTH,
  STROKE_BOX,
  decodeStrokes,
  encodeStrokes,
  signatureShapeProblem,
  strokesProblem,
  type Point,
} from './strokes';

const SAMPLE: Point[][] = [
  [
    { x: 10, y: 20 },
    { x: 13, y: 18 },
    { x: 13, y: 25 },
  ],
  [{ x: 500, y: 0 }],
];

describe('encodeStrokes / decodeStrokes', () => {
  it('stores the first point and then deltas', () => {
    expect(encodeStrokes(SAMPLE)).toBe('10,20,3,-2,0,7;500,0');
  });

  it('round-trips exactly', () => {
    expect(decodeStrokes(encodeStrokes(SAMPLE))).toEqual({ ok: true, strokes: SAMPLE });
  });

  it('round-trips random signatures and stays compact', () => {
    let state = 42;
    const next = (n: number) => (state = (state * 1103515245 + 12345) % 2147483648) % n;
    for (let run = 0; run < 100; run++) {
      const strokes: Point[][] = Array.from({ length: 1 + next(6) }, () => {
        let x = next(STROKE_BOX.width + 1);
        let y = next(STROKE_BOX.height + 1);
        return Array.from({ length: 1 + next(80) }, () => {
          x = Math.min(STROKE_BOX.width, Math.max(0, x + next(11) - 5));
          y = Math.min(STROKE_BOX.height, Math.max(0, y + next(11) - 5));
          return { x, y };
        });
      });
      const text = encodeStrokes(strokes);
      expect(decodeStrokes(text)).toEqual({ ok: true, strokes });
      const points = strokes.reduce((sum, stroke) => sum + stroke.length, 0);
      expect(text.length).toBeLessThan(points * 6 + 10);
    }
  });

  it.each<[string, Point[][], string]>([
    ['no strokes', [], 'no stroke'],
    ['an empty stroke', [[]], 'empty stroke'],
    ['a fractional coordinate', [[{ x: 1.5, y: 2 }]], 'integer box'],
    ['a negative coordinate', [[{ x: -1, y: 2 }]], 'integer box'],
    ['a point beyond the box', [[{ x: STROKE_BOX.width + 1, y: 0 }]], 'integer box'],
    [
      'too many strokes',
      Array.from({ length: MAX_STROKES + 1 }, () => [{ x: 1, y: 1 }]),
      'strokes',
    ],
    ['too many points', [Array.from({ length: MAX_POINTS + 1 }, () => ({ x: 1, y: 1 }))], 'points'],
  ])('refuses %s', (_label, strokes, reason) => {
    expect(strokesProblem(strokes)).toContain(reason);
    expect(() => encodeStrokes(strokes)).toThrow(RangeError);
  });

  it.each([
    ['', 'empty text'],
    ['10,20,3', 'odd number of values'],
    ['10,20;;5,5', 'empty stroke'],
    ['10,-0', 'negative zero'],
    ['010,20', 'leading zero'],
    ['+10,20', 'plus sign'],
    ['10, 20', 'space'],
    ['10.5,20', 'decimal'],
    ['10,20,-11,0', 'leaves the box'],
    ['1001,0', 'outside the box'],
  ])('rejects the non-canonical or invalid text %j (%s)', (text) => {
    expect(decodeStrokes(text).ok).toBe(false);
  });
});

describe('signatureShapeProblem', () => {
  it.each<[string, Point[][], string | undefined]>([
    [
      'a real signature',
      SAMPLE.concat([
        [
          { x: 40, y: 30 },
          { x: 80, y: 35 },
        ],
      ]),
      undefined,
    ],
    ['a tap', [[{ x: 10, y: 10 }]], 'too few points'],
    [
      'four points',
      [
        [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 200, y: 0 },
          { x: 300, y: 0 },
        ],
      ],
      'too few points',
    ],
    [
      'a vertical line',
      [Array.from({ length: 10 }, (_, i) => ({ x: 500, y: i * 10 }))],
      'too narrow',
    ],
  ])('%s → %s', (_label, strokes, problem) => {
    expect(signatureShapeProblem(strokes)).toBe(problem);
  });

  it('holds the plausibility limits', () => {
    expect(MIN_SIGNATURE_POINTS).toBe(5);
    expect(MIN_SIGNATURE_WIDTH).toBe(40);
  });
});
