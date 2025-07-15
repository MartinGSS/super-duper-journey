import React, { useRef, useState, useEffect } from "react";

const CONSTELLATIONS = [
  {
    name: "Orion",
    stars: [
      [10, 20],
      [60, 80],
      [110, 60],
      [160, 150],
    ],
  },
  {
    name: "Big Dipper",
    stars: [
      [5, 10],
      [40, 50],
      [80, 90],
      [120, 45],
      [150, 80],
      [185, 115],
      [220, 140],
    ],
  },
];

function distance(p1, p2) {
  return Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);
}

function findClosestConstellation(drawingPoints) {
  if (drawingPoints.length === 0) return null;

  let bestConstellation = null;
  let bestScore = Infinity;

  for (const constellation of CONSTELLATIONS) {
    const len = Math.min(drawingPoints.length, constellation.stars.length);
    let totalDist = 0;
    for (let i = 0; i < len; i++) {
      totalDist += distance(drawingPoints[i], constellation.stars[i]);
    }
    const avgDist = totalDist / len;

    if (avgDist < bestScore) {
      bestScore = avgDist;
      bestConstellation = constellation.name;
    }
  }

  return bestConstellation;
}

export default function App() {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [drawing, setDrawing] = useState([]);
  const [matchedConstellation, setMatchedConstellation] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (drawing.length > 1) {
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(drawing[0][0], drawing[0][1]);
      for (let i = 1; i < drawing.length; i++) {
        ctx.lineTo(drawing[i][0], drawing[i][1]);
      }
      ctx.stroke();
    }
  }, [drawing]);

  function getRelativeCoordinates(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  }

  function startDrawing(e) {
    isDrawingRef.current = true;
    setDrawing([getRelativeCoordinates(e)]);
  }

  function draw(e) {
    if (!isDrawingRef.current) return;
    setDrawing((prev) => [...prev, getRelativeCoordinates(e)]);
  }

  function stopDrawing() {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    setMatchedConstellation(findClosestConstellation(drawing));
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-4xl font-bold">Star Constellation Matcher</h1>
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="bg-black rounded-lg border border-white touch-none"
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
      />
      <div className="text-2xl">
        {matchedConstellation ? (
          <>Closest constellation: <strong>{matchedConstellation}</strong></>
        ) : (
          <>Draw a line to match a constellation</>
        )}
      </div>
    </div>
  );
}

