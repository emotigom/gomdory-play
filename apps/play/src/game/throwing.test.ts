import { describe, expect, it } from 'vitest';

import { calculateThrow, clampAim, nudgeAim } from './throwing';

describe('calculateThrow', () => {
  it('throws forward with a useful default impulse', () => {
    const throwVector = calculateThrow({ x: 0, y: 0 });

    expect(throwVector.impulse).toMatchObject({ x: 0 });
    expect(throwVector.impulse.z).toBeLessThan(-7);
    expect(throwVector.impulse.y).toBeGreaterThan(2);
  });

  it('uses an upward drag for a stronger upward throw', () => {
    expect(calculateThrow({ x: 0, y: -120 }).impulse.y).toBeGreaterThan(
      calculateThrow({ x: 0, y: 80 }).impulse.y,
    );
  });

  it('keeps keyboard aiming inside the supported range', () => {
    expect(nudgeAim({ x: 175, y: -175 }, { x: 20, y: -20 })).toEqual({
      x: 180,
      y: -180,
    });
  });

  it('keeps drag aiming inside the supported range', () => {
    expect(clampAim({ x: 300, y: -300 })).toEqual({ x: 180, y: -180 });
  });
});
