import React, { useRef, useState, useEffect } from "react";
import constellationsData from "./constellations.json";


const canvasSize = 400;

function projectRaDec([ra, dec]) {
  // Ra en grados (0–360), Dec en grados (-90 a +90)
  return [
    (ra / 360) * canvasSize,
    ((90 - dec) / 180) * canvasSize
  ];
}

// Preparamos constelaciones con coordenadas de canvas
const CONSTELLATIONS = constellationsData.features.map(feature => ({
  name: feature.id || feature.properties.name || "Unknown",
  stars: (feature.geometry?.coordinates || feature.properties?.lines || [])
    .flat()
    .map(projectRaDec)
}));

function distance(p1, p2) {
  return Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);
}

function normalize(points, size = 100) {
  if (points.length === 0) return points;

  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  const scale = size / Math.max(maxX - minX, maxY - minY);

  return points.map(([x, y]) => [
    (x - minX) * scale,
    (y - minY) * scale
  ]);
}

function resample(points, count) {
  if (points.length === 0) return [];

  const totalLength = points.reduce((acc, _, i, arr) => {
    if (i === 0) return 0;
    return acc + distance(arr[i], arr[i - 1]);
  }, 0);

  const segmentLength = totalLength / (count - 1);
  const resampled = [points[0]];
  let distAcc = 0;

  for (let i = 1; i < points.length && resampled.length < count; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const d = distance(prev, curr);

    if (distAcc + d >= segmentLength) {
      const ratio = (segmentLength - distAcc) / d;
      const x = prev[0] + ratio * (curr[0] - prev[0]);
      const y = prev[1] + ratio * (curr[1] - prev[1]);
      resampled.push([x, y]);
      distAcc = 0;
      points.splice(i, 0, [x, y]); // insert point
    } else {
      distAcc += d;
    }
  }

  while (resampled.length < count) {
    resampled.push(points[points.length - 1]);
  }

  return resampled;
}

function reflectX(points) {
  return points.map(([x, y]) => [x, -y]);
}

function alignProcrustes(A, B) {
  const n = A.length;

  const centroid = pts =>
    pts.reduce(([sx, sy], [x, y]) => [sx + x, sy + y], [0, 0]).map(s => s / n);

  const [cxA, cyA] = centroid(A);
  const [cxB, cyB] = centroid(B);

  const A0 = A.map(([x, y]) => [x - cxA, y - cyA]);
  const B0 = B.map(([x, y]) => [x - cxB, y - cyB]);

  let a = 0, b = 0;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = A0[i];
    const [x2, y2] = B0[i];
    a += x1 * x2 + y1 * y2;
    b += x1 * y2 - y1 * x2;
  }

  const theta = Math.atan2(b, a);
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);

  return A0.map(([x, y]) => [
    x * cos - y * sin + cxB,
    x * sin + y * cos + cyB
  ]);
}

function findClosestConstellation(drawingPoints) {
  if (drawingPoints.length < 2) return null;

  const normalizedDrawing = normalize(drawingPoints);
  const sampleCount = 10;
  const drawingSample = resample(normalizedDrawing, sampleCount);

  let best = null;
  let bestScore = Infinity;

  for (const { name, stars } of CONSTELLATIONS) {
    const normalizedStars = normalize(stars);
    const starSample = resample(normalizedStars, sampleCount);

    const variants = [drawingSample, reflectX(drawingSample)];

    for (const variant of variants) {
      const aligned = alignProcrustes(variant, starSample);

      const score = aligned.reduce((sum, point, i) => {
        return sum + distance(point, starSample[i]);
      }, 0) / sampleCount;

      if (score < bestScore) {
        bestScore = score;
        best = name;
      }
    }
  }

  return best;
}

export default function App() {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [drawing, setDrawing] = useState([]);
  const [matched, setMatched] = useState(null);

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    if (drawing.length > 1) {
      ctx.strokeStyle = "yellow";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(...drawing[0]);
      drawing.slice(1).forEach(p => ctx.lineTo(...p));
      ctx.stroke();
    }
  }, [drawing]);

  function relCoords(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  }

  const start = e => {
    isDrawingRef.current = true;
    setDrawing([relCoords(e)]);
  };

  const draw = e => {
    if (!isDrawingRef.current) return;
    setDrawing(prev => [...prev, relCoords(e)]);
  };

  const stop = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    setMatched(findClosestConstellation(drawing));
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-4xl font-bold">Star Constellation Matcher</h1>
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        className="bg-black border border-white rounded"
        onPointerDown={start}
        onPointerMove={draw}
        onPointerUp={stop}
        onPointerLeave={stop}
      />
      <div className="text-2xl">
        {matched
          ? <>Constellation: <strong>{matched}</strong></>
          : <>Dibuja líneas para identificar una constelación.</>}
      </div>
    </div>
  );
}
