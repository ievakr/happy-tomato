import React, { useMemo } from 'react';
import tomatoImg from '../../assets/logo.png';

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function TomatoBackground({ cols = 8, rows = 9, maxSize = 90, minSize = 40, seed = 500 }) {
  const tomatoes = useMemo(() => {
    const rand = seededRandom(seed);
    const cellW = 100 / cols;
    const cellH = 100 / rows;
    const items = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const size = minSize + rand() * (maxSize - minSize);
        const maxJitterX = (cellW - (size / 14)) / 2;
        const maxJitterY = (cellH - (size / 9)) / 2;
        const jitterX = (rand() - 0.5) * 2 * Math.max(0, maxJitterX);
        const jitterY = (rand() - 0.5) * 2 * Math.max(0, maxJitterY);
        items.push({
          id: row * cols + col,
          left: cellW * (col + 0.5) + jitterX,
          top: cellH * (row + 0.5) + jitterY,
          rotation: rand() * 360,
          size,
          opacity: 0.06 + rand() * 0.08,
        });
      }
    }

    return items;
  }, [cols, rows, maxSize, minSize, seed]);

  return (
    <div className="tomato-bg" aria-hidden="true">
      {tomatoes.map((t) => (
        <img
          key={t.id}
          src={tomatoImg}
          alt=""
          className="tomato-bg-item"
          style={{
            left: `${t.left}%`,
            top: `${t.top}%`,
            width: `${t.size}px`,
            height: `${t.size}px`,
            transform: `translate(-50%, -50%) rotate(${t.rotation}deg)`,
            opacity: t.opacity,
          }}
        />
      ))}
    </div>
  );
}

export default TomatoBackground;
