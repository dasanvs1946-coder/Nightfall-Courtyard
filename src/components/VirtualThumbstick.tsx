import React, { useRef, useState } from 'react';

interface VirtualThumbstickProps {
  side: 'left' | 'right';
  label: string;
  accentColor: string;
  testId: string;
  scale?: number;
  opacity?: number;
  onChange: (x: number, y: number, active: boolean) => void;
}

const OUTER_RADIUS = 56;
const KNOB_MAX_TRAVEL = 38;

export const VirtualThumbstick: React.FC<VirtualThumbstickProps> = ({
  side,
  label,
  accentColor,
  testId,
  scale = 1,
  opacity = 0.92,
  onChange,
}) => {
  const safeScale = Math.max(0.75, Math.min(1.35, scale));
  const safeOpacity = Math.max(0.4, Math.min(1, opacity));
  const zoneRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const originClientRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [originOffset, setOriginOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [active, setActive] = useState(false);

  const updateFromClient = (clientX: number, clientY: number) => {
    const cx = originClientRef.current.x;
    const cy = originClientRef.current.y;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);

    const maxTravelScreen = KNOB_MAX_TRAVEL * safeScale;
    const clamped = Math.min(dist, maxTravelScreen);
    const angle = Math.atan2(dy, dx);
    const oxScreen = dist > 0.5 ? Math.cos(angle) * clamped : 0;
    const oyScreen = dist > 0.5 ? Math.sin(angle) * clamped : 0;

    setKnobOffset({ x: oxScreen / safeScale, y: oyScreen / safeScale });
    onChange(oxScreen / maxTravelScreen, oyScreen / maxTravelScreen, true);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== null) return;
    const zone = zoneRef.current;
    if (!zone) return;
    e.stopPropagation();
    pointerIdRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);

    const rect = zone.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    if (e.pointerType === 'touch') {
      // Floating thumbstick spawns where the player's thumb touches inside the zone
      const maxShift = 28;
      const shiftX = Math.max(
        -maxShift,
        Math.min(maxShift, (e.clientX - centerX) / safeScale),
      );
      const shiftY = Math.max(
        -maxShift,
        Math.min(maxShift, (e.clientY - centerY) / safeScale),
      );
      setOriginOffset({ x: shiftX, y: shiftY });
      originClientRef.current = { x: e.clientX, y: e.clientY };
      setActive(true);
      setKnobOffset({ x: 0, y: 0 });
      onChange(0, 0, true);
    } else {
      setOriginOffset({ x: 0, y: 0 });
      originClientRef.current = { x: centerX, y: centerY };
      setActive(true);
      updateFromClient(e.clientX, e.clientY);
    }
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
    setOriginOffset({ x: 0, y: 0 });
    setKnobOffset({ x: 0, y: 0 });
    onChange(0, 0, false);
  };

  return (
    <div
      ref={zoneRef}
      data-testid={testId}
      role="application"
      aria-label={label}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={release}
      onPointerCancel={release}
      style={{
        transform: `scale(${safeScale})`,
        transformOrigin: side === 'left' ? 'bottom left' : 'bottom right',
        opacity: safeOpacity,
      }}
      className="pointer-events-auto relative flex h-[132px] w-[132px] items-center justify-center touch-none select-none sm:h-[140px] sm:w-[140px]"
    >
      {/* Floating outer base ring */}
      <div
        className="pointer-events-none relative flex items-center justify-center rounded-full"
        style={{
          width: OUTER_RADIUS * 2,
          height: OUTER_RADIUS * 2,
          transform: `translate3d(${originOffset.x}px, ${originOffset.y}px, 0)`,
          backgroundColor: active
            ? 'rgba(15, 23, 42, 0.72)'
            : 'rgba(15, 23, 42, 0.48)',
          border: `2px solid ${active ? accentColor : 'rgba(148, 163, 184, 0.35)'}`,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
          transition: active
            ? 'none'
            : 'transform 160ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
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
            transition: active
              ? 'none'
              : 'transform 140ms cubic-bezier(0.16, 1, 0.3, 1)',
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
    </div>
  );
};
