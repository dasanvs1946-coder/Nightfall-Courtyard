import React, { useMemo } from 'react';
import { ARENA_SPECS } from '../game/arenas';
import { getMinimapObstacles, worldToMinimap } from '../game/minimap';
import { ArenaId, MinimapSnapshot } from '../game/types';

interface MinimapProps {
  minimap: MinimapSnapshot;
  arena?: ArenaId;
}

const MAP_SIZE = 100;

export const Minimap: React.FC<MinimapProps> = ({
  minimap,
  arena = 'courtyard',
}) => {
  const arenaSpec = ARENA_SPECS[arena];
  const halfSize = arenaSpec.halfSize;
  const obstacles = useMemo(
    () => getMinimapObstacles(MAP_SIZE, arenaSpec.obstacles, halfSize),
    [arenaSpec.obstacles, halfSize],
  );
  const playerPos = worldToMinimap(
    minimap.playerX,
    minimap.playerZ,
    MAP_SIZE,
    halfSize,
  );
  const playerDeg = (-minimap.playerAimAngle * 180) / Math.PI;

  return (
    <div
      data-testid="minimap"
      aria-label="Arena Mini Map"
      className="pointer-events-none absolute bottom-2 left-1/2 z-20 -translate-x-1/2 overflow-hidden rounded-xl border border-slate-700/80 shadow-xl sm:bottom-3"
      style={{ backgroundColor: 'rgba(8, 12, 20, 0.86)' }}
    >
      <div className="relative h-[86px] w-[86px] sm:h-[116px] sm:w-[116px]">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          {/* Ground & subtle radar grid */}
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
                  : obs.kind === 'pod'
                    ? '#0891b2'
                    : obs.kind === 'pillar_tech'
                      ? '#1e293b'
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

          {/* Ground Hazards, Barrels, Generators & Deployed Gear/Gadgets */}
          {(minimap.hazards ?? []).map((hz, idx) => {
            const pos = worldToMinimap(hz.x, hz.z, MAP_SIZE, halfSize);
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
            if (hz.kind === 'barrel') {
              return (
                <circle
                  key={`hz-${idx}`}
                  cx={pos.x}
                  cy={pos.y}
                  r={2.1}
                  fill="#ef4444"
                  stroke="#fca5a5"
                  strokeWidth="0.5"
                />
              );
            }
            if (hz.kind === 'generator_on') {
              return (
                <g key={`hz-${idx}`}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={6.2}
                    fill="rgba(34, 211, 238, 0.16)"
                    stroke="#22d3ee"
                    strokeWidth="0.6"
                  />
                  <circle cx={pos.x} cy={pos.y} r={2.2} fill="#22d3ee" />
                </g>
              );
            }
            if (hz.kind === 'generator_off') {
              return (
                <circle
                  key={`hz-${idx}`}
                  cx={pos.x}
                  cy={pos.y}
                  r={2.5}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="0.9"
                />
              );
            }
            if (hz.kind === 'mine' || hz.kind === 'tripmine') {
              return (
                <circle
                  key={`hz-${idx}`}
                  cx={pos.x}
                  cy={pos.y}
                  r={1.9}
                  fill={hz.kind === 'tripmine' ? '#ef4444' : '#f59e0b'}
                  stroke="#fef3c7"
                  strokeWidth="0.5"
                />
              );
            }
            if (hz.kind === 'decoy') {
              return (
                <circle
                  key={`hz-${idx}`}
                  cx={pos.x}
                  cy={pos.y}
                  r={2.8}
                  fill="rgba(245, 158, 11, 0.35)"
                  stroke="#f59e0b"
                  strokeWidth="0.7"
                />
              );
            }
            if (hz.kind === 'wire') {
              return (
                <rect
                  key={`hz-${idx}`}
                  x={pos.x - 2.3}
                  y={pos.y - 2.3}
                  width="4.6"
                  height="4.6"
                  rx="0.6"
                  fill="rgba(148, 163, 184, 0.35)"
                  stroke="#cbd5e1"
                  strokeWidth="0.6"
                />
              );
            }
            if (hz.kind === 'cryo_canister') {
              return (
                <circle
                  key={`hz-${idx}`}
                  cx={pos.x}
                  cy={pos.y}
                  r={2.1}
                  fill="#06b6d4"
                  stroke="#cffafe"
                  strokeWidth="0.5"
                />
              );
            }
            if (hz.kind === 'pylon') {
              return (
                <g key={`hz-${idx}`}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={4.2}
                    fill="rgba(56, 189, 248, 0.25)"
                    stroke="#38bdf8"
                    strokeWidth="0.7"
                  />
                  <rect
                    x={pos.x - 1.8}
                    y={pos.y - 1.8}
                    width="3.6"
                    height="3.6"
                    transform={`rotate(45 ${pos.x} ${pos.y})`}
                    fill="#38bdf8"
                  />
                </g>
              );
            }
            if (hz.kind === 'train_lane') {
              return (
                <line
                  key={`hz-${idx}`}
                  x1="6"
                  y1={pos.y}
                  x2="94"
                  y2={pos.y}
                  stroke="rgba(239, 68, 68, 0.55)"
                  strokeWidth="3.5"
                  strokeDasharray="4 2"
                />
              );
            }
            if (hz.kind === 'toxic_vent') {
              return (
                <circle
                  key={`hz-${idx}`}
                  cx={pos.x}
                  cy={pos.y}
                  r={3.5}
                  fill="rgba(34, 197, 94, 0.28)"
                  stroke="#22c55e"
                  strokeWidth="0.6"
                />
              );
            }
            if (hz.kind === 'breaker_switch') {
              return (
                <g key={`hz-${idx}`}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={5.0}
                    fill="rgba(34, 197, 94, 0.25)"
                    stroke="#22c55e"
                    strokeWidth="0.8"
                  />
                  <rect
                    x={pos.x - 2.0}
                    y={pos.y - 2.0}
                    width="4.0"
                    height="4.0"
                    fill="#4ade80"
                  />
                </g>
              );
            }
            if (hz.kind === 'pad_turret' || hz.kind === 'pad_overcharge') {
              const c = hz.kind === 'pad_turret' ? '#f59e0b' : '#38bdf8';
              return (
                <circle
                  key={`hz-${idx}`}
                  cx={pos.x}
                  cy={pos.y}
                  r={3.1}
                  fill="none"
                  stroke={c}
                  strokeWidth="0.85"
                />
              );
            }
            if (hz.kind === 'orbital_pod') {
              return (
                <g key={`hz-${idx}`}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={6.4}
                    fill="rgba(56, 189, 248, 0.2)"
                    stroke="#38bdf8"
                    strokeWidth="0.8"
                  />
                  <circle cx={pos.x} cy={pos.y} r={2.2} fill="#bae6fd" />
                </g>
              );
            }
            if (hz.kind === 'reactor_core') {
              return (
                <g key={`hz-${idx}`}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={6.8}
                    fill="rgba(34, 211, 238, 0.22)"
                    stroke="#22d3ee"
                    strokeWidth="0.95"
                  />
                  <rect
                    x={pos.x - 2.6}
                    y={pos.y - 2.6}
                    width="5.2"
                    height="5.2"
                    rx="0.6"
                    transform={`rotate(45 ${pos.x} ${pos.y})`}
                    fill="#67e8f9"
                    stroke="#ecfeff"
                    strokeWidth="0.6"
                  />
                </g>
              );
            }
            if (hz.kind === 'extraction_zone') {
              return (
                <g key={`hz-${idx}`}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={7.8}
                    fill="rgba(34, 197, 94, 0.22)"
                    stroke="#22c55e"
                    strokeWidth="1.05"
                    strokeDasharray="2.5 1.5"
                  />
                  <circle cx={pos.x} cy={pos.y} r={2.6} fill="#4ade80" />
                </g>
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

          {/* Supply crates & Risk-Reward Corner Drops */}
          {minimap.pickups.map((p, idx) => {
            const pos = worldToMinimap(p.x, p.z, MAP_SIZE, halfSize);
            if (p.kind === 'supply') {
              return (
                <g key={`p-${idx}`}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={4.2}
                    fill="rgba(245, 158, 11, 0.25)"
                  />
                  <rect
                    x={pos.x - 2.2}
                    y={pos.y - 2.2}
                    width="4.4"
                    height="4.4"
                    rx="0.7"
                    fill="#f59e0b"
                    stroke="#fef3c7"
                    strokeWidth="0.6"
                  />
                </g>
              );
            }
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
            const pos = worldToMinimap(enemy.x, enemy.z, MAP_SIZE, halfSize);
            const eliteRing = enemy.isElite ? (
              <circle
                cx={pos.x}
                cy={pos.y}
                r={3.5}
                fill="none"
                stroke="#facc15"
                strokeWidth="0.7"
              />
            ) : null;
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
            if (enemy.kind === 'juggernaut') {
              return (
                <g key={`e-${idx}`}>
                  {eliteRing}
                  <rect
                    x={pos.x - 2.6}
                    y={pos.y - 2.6}
                    width="5.2"
                    height="5.2"
                    rx="0.8"
                    fill="#d97706"
                    stroke="#fef3c7"
                    strokeWidth="0.85"
                  />
                </g>
              );
            }
            if (enemy.kind === 'siege_breaker') {
              return (
                <g key={`e-${idx}`}>
                  {eliteRing}
                  <rect
                    x={pos.x - 2.3}
                    y={pos.y - 2.3}
                    width="4.6"
                    height="4.6"
                    rx="0.4"
                    fill="#0ea5e9"
                    stroke="#bae6fd"
                    strokeWidth="0.75"
                    transform={`rotate(45 ${pos.x} ${pos.y})`}
                  />
                </g>
              );
            }
            if (enemy.kind === 'necromancer') {
              return (
                <g key={`e-${idx}`}>
                  {eliteRing}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={2.5}
                    fill="#8b5cf6"
                    stroke="#ddd6fe"
                    strokeWidth="0.7"
                  />
                </g>
              );
            }
            if (enemy.kind === 'matriarch') {
              return (
                <g key={`e-${idx}`}>
                  {eliteRing}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={2.8}
                    fill="#db2777"
                    stroke="#fbcfe8"
                    strokeWidth="0.7"
                  />
                </g>
              );
            }
            if (enemy.kind === 'crawler') {
              return (
                <g key={`e-${idx}`}>
                  {eliteRing}
                  <circle cx={pos.x} cy={pos.y} r={1.45} fill="#65a30d" />
                </g>
              );
            }
            if (enemy.kind === 'ravager') {
              return (
                <g key={`e-${idx}`}>
                  {eliteRing}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={2.15}
                    fill="#f43f5e"
                    stroke="#fecdd3"
                    strokeWidth="0.55"
                  />
                </g>
              );
            }
            if (enemy.kind === 'breacher') {
              return (
                <g key={`e-${idx}`}>
                  {eliteRing}
                  <rect
                    x={pos.x - 2.3}
                    y={pos.y - 2.3}
                    width="4.6"
                    height="4.6"
                    rx="0.7"
                    fill="#0284c7"
                    stroke="#e2e8f0"
                    strokeWidth="0.8"
                  />
                </g>
              );
            }
            if (enemy.kind === 'brute') {
              return (
                <g key={`e-${idx}`}>
                  {eliteRing}
                  <rect
                    x={pos.x - 2.2}
                    y={pos.y - 2.2}
                    width="4.4"
                    height="4.4"
                    rx="0.8"
                    fill="#fb923c"
                  />
                </g>
              );
            }
            if (enemy.kind === 'bomber') {
              return (
                <g key={`e-${idx}`}>
                  {eliteRing}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={2.2}
                    fill="#fb923c"
                    stroke="#fef08a"
                    strokeWidth="0.6"
                  />
                </g>
              );
            }
            if (enemy.kind === 'howler') {
              return (
                <g key={`e-${idx}`}>
                  {eliteRing}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={2.2}
                    fill="#fbbf24"
                    stroke="#ffffff"
                    strokeWidth="0.5"
                  />
                </g>
              );
            }
            if (enemy.kind === 'spitter') {
              return (
                <g key={`e-${idx}`}>
                  {eliteRing}
                  <rect
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
                </g>
              );
            }
            if (enemy.kind === 'stalker') {
              return (
                <g key={`e-${idx}`}>
                  {eliteRing}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={enemy.revealed ? 2.2 : 1.7}
                    fill="#c084fc"
                    opacity={enemy.revealed ? 0.95 : 0.4}
                  />
                </g>
              );
            }
            if (enemy.kind === 'runner') {
              return (
                <g key={`e-${idx}`}>
                  {eliteRing}
                  <circle cx={pos.x} cy={pos.y} r={2.1} fill="#ef4444" />
                </g>
              );
            }
            return (
              <g key={`e-${idx}`}>
                {eliteRing}
                <circle cx={pos.x} cy={pos.y} r={1.8} fill="#84cc16" />
              </g>
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
          {arenaSpec.shortLabel.split(' ')[0]}
        </div>
      </div>
    </div>
  );
};
