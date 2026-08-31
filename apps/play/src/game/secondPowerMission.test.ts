import { describe, expect, it } from 'vitest';

import {
  initialSecondPowerMissionState,
  recordSecondPowerMissionThrow,
} from './secondPowerMission';

describe('second power mission transitions', () => {
  it('asks students to change the starting power', () => {
    expect(
      recordSecondPowerMissionThrow(initialSecondPowerMissionState, {
        form: 'variable',
        power: 3,
      }),
    ).toEqual({ completed: false, needsChangedPowerHint: true });
  });

  it('does not complete on a literal throw', () => {
    expect(
      recordSecondPowerMissionThrow(initialSecondPowerMissionState, {
        form: 'literal',
        power: 7,
      }),
    ).toBe(initialSecondPowerMissionState);
  });

  it('completes after a variable throw that differs by at least two', () => {
    expect(
      recordSecondPowerMissionThrow(initialSecondPowerMissionState, {
        form: 'variable',
        power: 7,
      }),
    ).toEqual({ completed: true, needsChangedPowerHint: false });
  });

  it('keeps completion after later free throws', () => {
    const completed = recordSecondPowerMissionThrow(
      initialSecondPowerMissionState,
      { form: 'variable', power: 7 },
    );

    expect(
      recordSecondPowerMissionThrow(completed, { form: 'variable', power: 3 }),
    ).toBe(completed);
  });
});
