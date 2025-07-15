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
  {
    name: "Cassiopeia",
    stars: [
      [20, 30],
      [50, 60],
      [80, 30],
      [110, 60],
      [140, 30],
    ],
  },
  {
    name: "Cygnus",
    stars: [
      [30, 100],
      [70, 80],
      [110, 100],
      [150, 80],
      [190, 100],
    ],
  },
  {
    name: "Scorpius",
    stars: [
      [20, 120],
      [40, 150],
      [60, 180],
      [80, 160],
      [100, 140],
      [120, 160],
      [140, 180],
      [160, 150],
      [180, 120],
    ],
  },
  {
    name: "Ursa Minor",
    stars: [
      [10, 10],
      [30, 40],
      [50, 70],
      [70, 60],
      [90, 50],
      [110, 40],
      [130, 30],
    ],
  },
  {
    name: "Lyra",
    stars: [
      [60, 20],
      [80, 40],
      [100, 20],
      [120, 40],
      [140, 20],
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
  const isDrawing = useRef(false);
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
      drawing.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.stroke();
    }
  }, [drawing]);

  function startDrawing(e) {
    isDrawing.current = true;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDrawing([[x, y]]);
  }

  function draw(e) {
    if (!isDrawing.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDrawing((prev) => [...prev, [x, y]]);
  }

  function stopDrawing() {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const constellation = findClosestConstellation(drawing);
    setMatchedConstellation(constellation);
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
