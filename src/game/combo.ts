export const COMBO_DECAY_SEC = 3.0;
export const COMBO_MAX_MULTIPLIER = 5.0;

export interface ComboState {
  count: number;
  timer: number; // seconds remaining before reset
  callout: string | null;
  calloutTimer: number;
}

export function createInitialComboState(): ComboState {
  return {
    count: 0,
    timer: 0,
    callout: null,
    calloutTimer: 0,
  };
}

export function getComboMultiplier(count: number): number {
  if (count <= 1) return 1.0;
  const raw = 1 + Math.min(4.0, (count - 1) * 0.16);
  return Math.round(Math.min(COMBO_MAX_MULTIPLIER, raw) * 10) / 10;
}

export function getComboCallout(count: number): string | null {
  if (count === 2) return 'DOUBLE KILL';
  if (count === 4) return 'MULTI KILL';
  if (count === 8) return 'RAMPAGE';
  if (count === 14) return 'UNSTOPPABLE';
  if (count >= 22 && (count === 22 || count % 10 === 0)) return 'GODLIKE';
  return null;
}

export function registerComboKill(state: ComboState): {
  next: ComboState;
  multiplier: number;
  newCallout: string | null;
} {
  const count = state.count + 1;
  const callout = getComboCallout(count);
  const next: ComboState = {
    count,
    timer: COMBO_DECAY_SEC,
    callout: callout ?? state.callout,
    calloutTimer: callout ? 1.85 : state.calloutTimer,
  };
  return {
    next,
    multiplier: getComboMultiplier(count),
    newCallout: callout,
  };
}

export function tickComboState(state: ComboState, dt: number): ComboState {
  if (state.count <= 0 && state.calloutTimer <= 0) return state;
  const nextTimer = Math.max(0, state.timer - dt);
  const nextCalloutTimer = Math.max(0, state.calloutTimer - dt);
  if (nextTimer <= 0) {
    return {
      count: 0,
      timer: 0,
      callout: nextCalloutTimer > 0 ? state.callout : null,
      calloutTimer: nextCalloutTimer,
    };
  }
  return {
    count: state.count,
    timer: nextTimer,
    callout: nextCalloutTimer > 0 ? state.callout : null,
    calloutTimer: nextCalloutTimer,
  };
}
