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

function findClosestConstellation(drawingPoints) {
  if (drawingPoints.length === 0) return null;

  let best = null;
  let bestScore = Infinity;

  for (const { name, stars } of CONSTELLATIONS) {
    const len = Math.min(drawingPoints.length, stars.length);
    let sum = 0;
    for (let i = 0; i < len; i++) {
      sum += distance(drawingPoints[i], stars[i]);
    }
    const avg = sum / len;
    if (avg < bestScore) {
      bestScore = avg;
      best = name;
    }
  }

  return best;
}

export default function App() {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [drawing, setDrawing] = useState([]);
  const [matched, setMatched] = useState(null); // ahora guarda el objeto de la constelación

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Trazo amarillo del usuario
    if (drawing.length > 1) {
      ctx.strokeStyle = "yellow";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(...drawing[0]);
      drawing.slice(1).forEach(p => ctx.lineTo(...p));
      ctx.stroke();
    }

    // Dibujo de la constelación (si hay coincidencia)
    if (matched?.stars?.length > 1) {
      ctx.strokeStyle = "white";
      ctx.fillStyle = "white";
      ctx.lineWidth = 1.5;

      // Unir estrellas
      ctx.beginPath();
      ctx.moveTo(...matched.stars[0]);
      matched.stars.slice(1).forEach(p => ctx.lineTo(...p));
      ctx.stroke();

      // Dibujar puntos (estrellas)
      matched.stars.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

  }, [drawing, matched]);

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

    // Buscar la constelación más cercana y guardar todo el objeto
    const bestName = findClosestConstellation(drawing);
    const match = CONSTELLATIONS.find(c => c.name === bestName);
    setMatched(match || null);
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
          ? <>Constellation: <strong>{matched.name}</strong></>
          : <>Dibuja líneas para identificar una constelación.</>}
      </div>
    </div>
  );
}
