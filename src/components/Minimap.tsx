import React, { useMemo } from 'react';
import { getMinimapObstacles, worldToMinimap } from '../game/minimap';
import { MinimapSnapshot } from '../game/types';

interface MinimapProps {
  minimap: MinimapSnapshot;
}

const MAP_SIZE = 100;

export const Minimap: React.FC<MinimapProps> = ({ minimap }) => {
  const obstacles = useMemo(() => getMinimapObstacles(MAP_SIZE), []);
  const playerPos = worldToMinimap(minimap.playerX, minimap.playerZ, MAP_SIZE);
  // playerAimAngle = 0 points toward -Z (top of minimap = 0 deg rotation in SVG)
  const playerDeg = (-minimap.playerAimAngle * 180) / Math.PI;

  return (
    <div
      data-testid="minimap"
      aria-label="Courtyard Mini Map"
      className="pointer-events-none absolute bottom-2 left-1/2 z-20 -translate-x-1/2 overflow-hidden rounded-xl border border-slate-700/80 shadow-xl sm:bottom-3"
      style={{ backgroundColor: 'rgba(8, 12, 20, 0.86)' }}
    >
      <div className="relative h-[86px] w-[86px] sm:h-[116px] sm:w-[116px]">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          {/* Courtyard ground & subtle radar grid */}
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="4"
            fill="#0b111d"
            stroke="rgba(71, 85, 105, 0.55)"
            strokeWidth="1.2"
          />
          <line x1="50" y1="6" x2="50" y2="94" stroke="rgba(51, 65, 85, 0.35)" strokeWidth="0.8" />
          <line x1="6" y1="50" x2="94" y2="50" stroke="rgba(51, 65, 85, 0.35)" strokeWidth="0.8" />
          <circle
            cx="50"
            cy="50"
            r="16"
            fill="none"
            stroke="rgba(245, 158, 11, 0.16)"
            strokeWidth="0.9"
            strokeDasharray="3 2"
          />

          {/* Tactical obstacles & streetlamps */}
          {obstacles.map((obs) => {
            if (obs.kind === 'lamp') {
              return (
                <g key={obs.id}>
                  <circle
                    cx={obs.cx}
                    cy={obs.cy}
                    r={4.8}
                    fill="rgba(251, 191, 36, 0.14)"
                  />
                  <circle cx={obs.cx} cy={obs.cy} r={1.6} fill="#fbbf24" />
                </g>
              );
            }
            const fill =
              obs.kind === 'car'
                ? '#334155'
                : obs.kind === 'crate'
                  ? '#5c4028'
                  : '#475569';
            return (
              <rect
                key={obs.id}
                x={obs.cx - obs.width / 2}
                y={obs.cy - obs.height / 2}
                width={obs.width}
                height={obs.height}
                rx="0.8"
                fill={fill}
                stroke="rgba(148, 163, 184, 0.3)"
                strokeWidth="0.4"
                transform={`rotate(${obs.rotationDeg} ${obs.cx} ${obs.cy})`}
              />
            );
          })}

          {/* Ground Hazards & Deployed Tactical Gear */}
          {(minimap.hazards ?? []).map((hz, idx) => {
            const pos = worldToMinimap(hz.x, hz.z, MAP_SIZE);
            if (hz.kind === 'acid') {
              return (
                <circle
                  key={`hz-${idx}`}
                  cx={pos.x}
                  cy={pos.y}
                  r={4.2}
                  fill="rgba(132, 204, 22, 0.34)"
                  stroke="#a3e635"
                  strokeWidth="0.5"
                />
              );
            }
            if (hz.kind === 'mine') {
              return (
                <circle
                  key={`hz-${idx}`}
                  cx={pos.x}
                  cy={pos.y}
                  r={1.9}
                  fill="#f59e0b"
                  stroke="#fef3c7"
                  strokeWidth="0.5"
                />
              );
            }
            return (
              <rect
                key={`hz-${idx}`}
                x={pos.x - 1.8}
                y={pos.y - 1.8}
                width="3.6"
                height="3.6"
                rx="0.6"
                fill="#38bdf8"
                stroke="#e0f2fe"
                strokeWidth="0.5"
              />
            );
          })}

          {/* Supply crates */}
          {minimap.pickups.map((p, idx) => {
            const pos = worldToMinimap(p.x, p.z, MAP_SIZE);
            const color =
              p.kind === 'health'
                ? '#22c55e'
                : p.kind === 'ammo'
                  ? '#f59e0b'
                  : '#ef4444';
            return (
              <rect
                key={`p-${idx}`}
                x={pos.x - 1.7}
                y={pos.y - 1.7}
                width="3.4"
                height="3.4"
                rx="0.6"
                fill={color}
              />
            );
          })}

          {/* Zombies & Bosses */}
          {minimap.enemies.map((enemy, idx) => {
            const pos = worldToMinimap(enemy.x, enemy.z, MAP_SIZE);
            if (enemy.kind === 'boss') {
              return (
                <g key={`e-${idx}`}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={5.2}
                    fill="rgba(244, 63, 94, 0.3)"
                    stroke="#fda4af"
                    strokeWidth="0.9"
                  />
                  <circle cx={pos.x} cy={pos.y} r={3.0} fill="#f43f5e" />
                </g>
              );
            }
            if (enemy.kind === 'breacher') {
              return (
                <rect
                  key={`e-${idx}`}
                  x={pos.x - 2.3}
                  y={pos.y - 2.3}
                  width="4.6"
                  height="4.6"
                  rx="0.7"
                  fill="#0284c7"
                  stroke="#e2e8f0"
                  strokeWidth="0.8"
                />
              );
            }
            if (enemy.kind === 'brute') {
              return (
                <rect
                  key={`e-${idx}`}
                  x={pos.x - 2.2}
                  y={pos.y - 2.2}
                  width="4.4"
                  height="4.4"
                  rx="0.8"
                  fill="#fb923c"
                />
              );
            }
            if (enemy.kind === 'spitter') {
              return (
                <rect
                  key={`e-${idx}`}
                  x={pos.x - 2.0}
                  y={pos.y - 2.0}
                  width="4.0"
                  height="4.0"
                  rx="0.4"
                  fill="#a3e635"
                  stroke="#fef08a"
                  strokeWidth="0.55"
                  transform={`rotate(45 ${pos.x} ${pos.y})`}
                />
              );
            }
            if (enemy.kind === 'stalker') {
              return (
                <circle
                  key={`e-${idx}`}
                  cx={pos.x}
                  cy={pos.y}
                  r={enemy.revealed ? 2.2 : 1.7}
                  fill="#c084fc"
                  opacity={enemy.revealed ? 0.95 : 0.4}
                />
              );
            }
            if (enemy.kind === 'runner') {
              return (
                <circle
                  key={`e-${idx}`}
                  cx={pos.x}
                  cy={pos.y}
                  r={2.1}
                  fill="#ef4444"
                />
              );
            }
            return (
              <circle
                key={`e-${idx}`}
                cx={pos.x}
                cy={pos.y}
                r={1.8}
                fill="#84cc16"
              />
            );
          })}

          {/* Player Directional Marker & Flashlight/Laser Cone */}
          <g transform={`translate(${playerPos.x} ${playerPos.y}) rotate(${playerDeg})`}>
            <polygon
              points="0,0 -4.8,-13 4.8,-13"
              fill="rgba(56, 189, 248, 0.22)"
            />
            <polygon
              points="0,-4.5 3.3,3.2 0,1.6 -3.3,3.2"
              fill="#38bdf8"
              stroke="#ffffff"
              strokeWidth="0.7"
            />
          </g>
        </svg>
        <div className="font-mono-tabular pointer-events-none absolute top-0.5 left-1.5 text-[7px] font-bold tracking-wider text-slate-400 uppercase sm:text-[8px]">
          Map
        </div>
      </div>
    </div>
  );
};
