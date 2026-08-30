import { describe, expect, it } from 'vitest';

import {
  initialFirstPowerMissionState,
  recordCompletedThrow,
} from './firstPowerMission';

describe('first power mission transitions', () => {
  it('records the first completed throw as 1 / 2', () => {
    expect(recordCompletedThrow(initialFirstPowerMissionState, 3)).toEqual({
      completedPowers: [3],
      step: 1,
      needsDifferentPowerHint: false,
    });
  });

  it('keeps the mission at 1 / 2 and asks for a larger change on the same power', () => {
    const afterFirst = recordCompletedThrow(initialFirstPowerMissionState, 3);

    expect(recordCompletedThrow(afterFirst, 3)).toEqual({
      completedPowers: [3],
      step: 1,
      needsDifferentPowerHint: true,
    });
  });

  it('does not advance when the second power differs by less than two', () => {
    const afterFirst = recordCompletedThrow(initialFirstPowerMissionState, 3);

    expect(recordCompletedThrow(afterFirst, 4)).toEqual({
      completedPowers: [3],
      step: 1,
      needsDifferentPowerHint: true,
    });
  });

  it('completes after a second completed throw with a power difference of two or more', () => {
    const afterFirst = recordCompletedThrow(initialFirstPowerMissionState, 3);

    expect(recordCompletedThrow(afterFirst, 9)).toEqual({
      completedPowers: [3, 9],
      step: 2,
      needsDifferentPowerHint: false,
    });
  });

  it('keeps the completed state for later free throws', () => {
    const completed = recordCompletedThrow(
      recordCompletedThrow(initialFirstPowerMissionState, 3),
      9,
    );

    expect(recordCompletedThrow(completed, 3)).toBe(completed);
  });
});
