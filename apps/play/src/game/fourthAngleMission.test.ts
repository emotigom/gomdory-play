import { describe, expect, it } from 'vitest';

import {
  initialFourthAngleMissionState,
  recordFourthAngleMissionThrow,
} from './fourthAngleMission';

describe('fourth angle mission transitions', () => {
  it.each(['literal', 'variable', 'expression'] as const)(
    'asks for angle code after a completed legacy %s round',
    (form) => {
      expect(
        recordFourthAngleMissionThrow(initialFourthAngleMissionState, {
          form,
        }),
      ).toEqual({
        completed: false,
        needsAngleCodeHint: true,
        needsHigherAngleHint: false,
      });
    },
  );

  it('asks for a higher angle after the starter trajectory round', () => {
    expect(
      recordFourthAngleMissionThrow(initialFourthAngleMissionState, {
        angleDegrees: 10,
        form: 'trajectory',
      }),
    ).toEqual({
      completed: false,
      needsAngleCodeHint: false,
      needsHigherAngleHint: true,
    });
  });

  it.each([25, 45])('completes at a supported target angle: %s', (angle) => {
    expect(
      recordFourthAngleMissionThrow(initialFourthAngleMissionState, {
        angleDegrees: angle,
        form: 'trajectory',
      }),
    ).toEqual({
      completed: true,
      needsAngleCodeHint: false,
      needsHigherAngleHint: false,
    });
  });

  it('keeps completion after later rounds', () => {
    const completed = recordFourthAngleMissionThrow(
      initialFourthAngleMissionState,
      { angleDegrees: 35, form: 'trajectory' },
    );

    expect(recordFourthAngleMissionThrow(completed, { form: 'literal' })).toBe(
      completed,
    );
  });
});
