import React, { useMemo } from 'react';

function generateHandDrawnScribble({
  width = 600,
  height = 400,
  margin = 60,
  sweeps = 28,
  randomness = 0.5,
  seed = 12345
}) {
  const rand = () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };

  const startX = margin;
  const startY = height - margin;
  const endX = width - margin;
  const endY = margin;

  const dx = endX - startX;
  const dy = endY - startY;

  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / len;
  const ny = dy / len;

  const ox = -ny;
  const oy = nx;

  // 75% coverage -> +10% bigger + 20% longer in middle = ~100% coverage
  const maxAmplitude = Math.min(width, height) * 0.462;

  let path = `M ${startX.toFixed(1)},${startY.toFixed(1)} `;

  const numPoints = sweeps * 2;

  for (let i = 1; i <= numPoints; i++) {
    let linearT = i / numPoints;

    // Fast at the ends, slow in the middle (clusters curves in the middle)
    let easeT = 0.5 + 4 * Math.pow(linearT - 0.5, 3);
    // Blend to keep it natural
    let t = linearT * 0.6 + easeT * 0.4;

    // Add randomness to progress
    const tJitter = (rand() - 0.5) * (2 / numPoints) * randomness;
    const finalT = Math.max(0, Math.min(1, t + tJitter));

    const bx = startX + finalT * dx;
    const by = startY + finalT * dy;

    if (i % 2 === 1) {
      // Control point (Extreme)
      // Alternate sides of the diagonal
      const side = ((i - 1) / 2) % 2 === 0 ? 1 : -1;

      // Envelope to make sweeps start small, enlarge, then decrease
      const envelope = 0.2 + 0.8 * Math.sin(linearT * Math.PI);
      const amp = maxAmplitude * envelope * (1 + (rand() * 2 - 1) * 0.4 * randomness);

      const cx = bx + ox * amp * side;
      const cy = by + oy * amp * side;

      path += `Q ${cx.toFixed(1)},${cy.toFixed(1)} `;
    } else {
      // Anchor point (Middle)
      const centerJitterAmp = maxAmplitude * 0.2 * randomness;
      const centerJitter = (rand() * 2 - 1) * centerJitterAmp;

      const ax = bx + ox * centerJitter;
      const ay = by + oy * centerJitter;

      path += `${ax.toFixed(1)},${ay.toFixed(1)} `;
    }
  }

  return path;
}

export function ScribbleAnimation() {
  const scribblePath = useMemo(() => generateHandDrawnScribble({
    width: 600,
    height: 400,
    margin: 60,
    sweeps: 28,
    randomness: 0.6,
    seed: 42
  }), []);

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[12rem] h-[10rem] sm:w-[30rem] sm:h-[20rem] z-0 pointer-events-none flex items-center justify-center">
      <svg
        className="w-full h-full text-zinc-200 dark:text-zinc-800"
        viewBox="0 0 600 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>
          {`
            @keyframes scribbleAnim {
              0% { stroke-dashoffset: 4000; }
              100% { stroke-dashoffset: 0; }
            }
            .scribble-line {
              stroke-dasharray: 4000;
              stroke-dashoffset: 4000;
              /* Custom bezier for slow start/end, extremely fast middle */
              animation: scribbleAnim 4s cubic-bezier(0.85, 0.05, 0.15, 0.95) forwards;
            }
          `}
        </style>
        <path
          className="scribble-line"
          d={scribblePath}
          stroke="currentColor"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
