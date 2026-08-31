import { describe, expect, it } from 'vitest';

import { initialFirstPowerMissionState } from './firstPowerMission';
import { initialSecondPowerMissionState } from './secondPowerMission';
import {
  initialCurrentMission,
  moveToSecondMission,
  moveToThirdMission,
} from './currentMission';

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

  it('does not enter the third mission before the second is complete', () => {
    expect(moveToThirdMission('second', initialSecondPowerMissionState)).toBe(
      'second',
    );
  });

  it('enters the third mission after the second is complete', () => {
    expect(
      moveToThirdMission('second', {
        completed: true,
        needsChangedPowerHint: false,
      }),
    ).toBe('third');
  });
});
