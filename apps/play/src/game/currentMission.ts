import type { FirstPowerMissionState } from './firstPowerMission';

export type CurrentMission = 'first' | 'second';

export const initialCurrentMission: CurrentMission = 'first';

export function moveToSecondMission(
  currentMission: CurrentMission,
  firstMission: FirstPowerMissionState,
): CurrentMission {
  return currentMission === 'first' && firstMission.step === 2
    ? 'second'
    : currentMission;
}
