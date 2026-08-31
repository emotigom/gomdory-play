import { describe, expect, it } from 'vitest';

import {
  initialThirdPowerMissionState,
  recordThirdPowerMissionThrow,
} from './thirdPowerMission';

describe('third power mission transitions', () => {
  it('asks students to make an expression result of at least five', () => {
    expect(
      recordThirdPowerMissionThrow(initialThirdPowerMissionState, {
        form: 'expression',
        power: 4,
      }),
    ).toEqual({
      completed: false,
      needsExpressionHint: false,
      needsMinimumPowerHint: true,
    });
  });

  it.each(['literal', 'variable'] as const)(
    'asks for an expression after a %s throw',
    (form) => {
      expect(
        recordThirdPowerMissionThrow(initialThirdPowerMissionState, {
          form,
          power: 7,
        }),
      ).toEqual({
        completed: false,
        needsExpressionHint: true,
        needsMinimumPowerHint: false,
      });
    },
  );

  it.each([5, 10])('completes with an expression result of %s', (power) => {
    expect(
      recordThirdPowerMissionThrow(initialThirdPowerMissionState, {
        form: 'expression',
        power,
      }),
    ).toEqual({
      completed: true,
      needsExpressionHint: false,
      needsMinimumPowerHint: false,
    });
  });

  it('keeps completion after later free throws', () => {
    const completed = recordThirdPowerMissionThrow(
      initialThirdPowerMissionState,
      { form: 'expression', power: 7 },
    );

    expect(
      recordThirdPowerMissionThrow(completed, { form: 'literal', power: 3 }),
    ).toBe(completed);
  });
});
