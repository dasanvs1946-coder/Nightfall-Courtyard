import React, { useRef, useState } from 'react';

interface VirtualThumbstickProps {
  side: 'left' | 'right';
  label: string;
  accentColor: string;
  testId: string;
  onChange: (x: number, y: number, active: boolean) => void;
}

const OUTER_RADIUS = 56;
const KNOB_MAX_TRAVEL = 38;

export const VirtualThumbstick: React.FC<VirtualThumbstickProps> = ({
  side,
  label,
  accentColor,
  testId,
  onChange,
}) => {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [active, setActive] = useState(false);

  const updateFromClient = (clientX: number, clientY: number) => {
    const el = baseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);

    const clamped = Math.min(dist, KNOB_MAX_TRAVEL);
    const angle = Math.atan2(dy, dx);
    const ox = dist > 0.5 ? Math.cos(angle) * clamped : 0;
    const oy = dist > 0.5 ? Math.sin(angle) * clamped : 0;

    setKnobOffset({ x: ox, y: oy });
    onChange(ox / KNOB_MAX_TRAVEL, oy / KNOB_MAX_TRAVEL, true);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== null) return;
    e.stopPropagation();
    pointerIdRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    setActive(true);
    updateFromClient(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    e.stopPropagation();
    updateFromClient(e.clientX, e.clientY);
  };

  const release = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    e.stopPropagation();
    pointerIdRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setActive(false);
    setKnobOffset({ x: 0, y: 0 });
    onChange(0, 0, false);
  };

  return (
    <div
      ref={baseRef}
      data-testid={testId}
      role="application"
      aria-label={label}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={release}
      onPointerCancel={release}
      className="pointer-events-auto relative flex items-center justify-center rounded-full touch-none select-none"
      style={{
        width: OUTER_RADIUS * 2,
        height: OUTER_RADIUS * 2,
        backgroundColor: active
          ? 'rgba(15, 23, 42, 0.72)'
          : 'rgba(15, 23, 42, 0.48)',
        border: `2px solid ${active ? accentColor : 'rgba(148, 163, 184, 0.35)'}`,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
      }}
    >
      {/* Subtle cross axes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-4 rounded-full border border-white/10"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-2 text-[9px] font-semibold tracking-wider text-slate-400/80 uppercase"
      >
        {side === 'left' ? 'Move' : 'Aim · Fire'}
      </span>

      {/* Thumb Knob */}
      <div
        aria-hidden="true"
        className="pointer-events-none flex h-11 w-11 items-center justify-center rounded-full"
        style={{
          transform: `translate3d(${knobOffset.x}px, ${knobOffset.y}px, 0)`,
          backgroundColor: active ? accentColor : 'rgba(226, 232, 240, 0.85)',
          boxShadow: active
            ? `0 0 14px ${accentColor}`
            : '0 4px 10px rgba(0, 0, 0, 0.5)',
          transition: active ? 'none' : 'transform 140ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          className="h-3 w-3 rounded-full"
          style={{
            backgroundColor: active ? '#0f172a' : 'rgba(15, 23, 42, 0.55)',
          }}
        />
      </div>
    </div>
  );
};
