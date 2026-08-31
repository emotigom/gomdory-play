import { describe, expect, it } from 'vitest';

import { calculateThrow, clampAim, nudgeAim } from './throwing';

describe('calculateThrow', () => {
  it('throws forward with a useful default impulse', () => {
    const throwVector = calculateThrow({ x: 0, y: 0 }, 7);

    expect(throwVector.impulse).toMatchObject({ x: 0 });
    expect(throwVector.impulse.z).toBeLessThan(-7);
    expect(throwVector.impulse.y).toBeGreaterThan(2);
  });

  it('uses an upward drag for a stronger upward throw', () => {
    expect(calculateThrow({ x: 0, y: -120 }, 7).impulse.y).toBeGreaterThan(
      calculateThrow({ x: 0, y: 80 }, 7).impulse.y,
    );
  });

  it('uses a larger impulse when code supplies a larger power', () => {
    expect(calculateThrow({ x: 0, y: 0 }, 9).strength).toBeGreaterThan(
      calculateThrow({ x: 0, y: 0 }, 3).strength,
    );
  });

  it('preserves the existing vector when angle is omitted', () => {
    expect(calculateThrow({ x: 72, y: -90 }, 7)).toEqual({
      impulse: {
        x: 3.92,
        y: 6.8599999999999985,
        z: -8.981848362113446,
      },
      strength: 9.799999999999999,
    });
  });

  it('raises the vertical impulse and reduces horizontal travel at angle 35', () => {
    const low = calculateThrow({ x: 40, y: 0 }, 7, 10).impulse;
    const high = calculateThrow({ x: 40, y: 0 }, 7, 35).impulse;
    const lowHorizontal = Math.hypot(low.x, low.z);
    const highHorizontal = Math.hypot(high.x, high.z);

    expect(high.y).toBeGreaterThan(low.y);
    expect(highHorizontal).toBeLessThan(lowHorizontal);
  });

  it('ignores vertical aim when code supplies an angle', () => {
    expect(calculateThrow({ x: 40, y: -180 }, 7, 35)).toEqual(
      calculateThrow({ x: 40, y: 180 }, 7, 35),
    );
  });

  it.each([
    { aim: { x: -180, y: -180 }, power: 1, angle: 5 },
    { aim: { x: 180, y: 180 }, power: 10, angle: 45 },
  ])(
    'creates a finite trajectory vector at the supported boundaries',
    ({ aim, power, angle }) => {
      const result = calculateThrow(aim, power, angle);

      expect(Number.isFinite(result.strength)).toBe(true);
      expect(Object.values(result.impulse).every(Number.isFinite)).toBe(true);
    },
  );

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
