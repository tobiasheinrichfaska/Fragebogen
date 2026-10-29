// Drawing area for the signature (finger, pen or mouse). Points are stored in the fixed box
// 1000 × 400 as integers — shape only, no timing or pressure (strokes.ts).
import { useEffect, useRef, type PointerEvent } from 'react';
import { MAX_POINTS, MAX_STROKES, STROKE_BOX, type Point } from '../logic/strokes';

interface Props {
  strokes: Point[][];
  onChange: (strokes: Point[][]) => void;
}

function draw(canvas: HTMLCanvasElement, strokes: readonly (readonly Point[])[]): void {
  const context = canvas.getContext('2d');
  if (!context) return;
  const { width, height } = canvas;
  context.clearRect(0, 0, width, height);
  context.lineWidth = Math.max(2, width / 300);
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = getComputedStyle(canvas).color || '#111';
  for (const stroke of strokes) {
    context.beginPath();
    stroke.forEach((point, i) => {
      const x = (point.x / STROKE_BOX.width) * width;
      const y = (point.y / STROKE_BOX.height) * height;
      if (i === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    if (stroke.length === 1) {
      const [only] = stroke;
      if (only)
        context.lineTo(
          (only.x / STROKE_BOX.width) * width + 0.5,
          (only.y / STROKE_BOX.height) * height,
        );
    }
    context.stroke();
  }
}

export function SignaturePad({ strokes, onChange }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef<Point[][] | undefined>(undefined);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const resize = () => {
      const rect = element.getBoundingClientRect();
      element.width = Math.round(rect.width * devicePixelRatio);
      element.height = Math.round(rect.height * devicePixelRatio);
      draw(element, drawing.current ?? strokes);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [strokes]);

  const point = (event: PointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clamp = (value: number, max: number) => Math.min(max, Math.max(0, Math.round(value)));
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * STROKE_BOX.width, STROKE_BOX.width),
      y: clamp(((event.clientY - rect.top) / rect.height) * STROKE_BOX.height, STROKE_BOX.height),
    };
  };

  const total = (all: readonly Point[][]) => all.reduce((sum, stroke) => sum + stroke.length, 0);

  return (
    <canvas
      ref={canvas}
      className="signature-pad"
      aria-label="Unterschriftsfeld: hier mit Finger, Stift oder Maus unterschreiben"
      onPointerDown={(event) => {
        if (strokes.length >= MAX_STROKES) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        drawing.current = [...strokes.map((s) => [...s]), [point(event)]];
        if (canvas.current) draw(canvas.current, drawing.current);
      }}
      onPointerMove={(event) => {
        const current = drawing.current;
        if (!current || total(current) >= MAX_POINTS) return;
        const stroke = current[current.length - 1];
        const next = point(event);
        const last = stroke?.[stroke.length - 1];
        if (!stroke || (last && last.x === next.x && last.y === next.y)) return;
        stroke.push(next);
        if (canvas.current) draw(canvas.current, current);
      }}
      onPointerUp={() => {
        if (drawing.current) onChange(drawing.current);
        drawing.current = undefined;
      }}
      onPointerCancel={() => {
        if (drawing.current) onChange(drawing.current);
        drawing.current = undefined;
      }}
    />
  );
}
