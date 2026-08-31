import { describe, expect, it } from 'vitest';

import { initialFirstPowerMissionState } from './firstPowerMission';
import { initialCurrentMission, moveToSecondMission } from './currentMission';

describe('current mission transitions', () => {
  it('does not enter the second mission before the first is complete', () => {
    expect(
      moveToSecondMission(initialCurrentMission, initialFirstPowerMissionState),
    ).toBe('first');
  });

  it('enters the second mission after the first is complete', () => {
    expect(
      moveToSecondMission('first', {
        completedPowers: [3, 9],
        needsDifferentPowerHint: false,
        step: 2,
      }),
    ).toBe('second');
  });
});
