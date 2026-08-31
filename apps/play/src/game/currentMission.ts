import type { FirstPowerMissionState } from './firstPowerMission';
import type { SecondPowerMissionState } from './secondPowerMission';

export type CurrentMission = 'first' | 'second' | 'third';

export const initialCurrentMission: CurrentMission = 'first';

export function moveToSecondMission(
  currentMission: CurrentMission,
  firstMission: FirstPowerMissionState,
): CurrentMission {
  return currentMission === 'first' && firstMission.step === 2
    ? 'second'
    : currentMission;
}

export function moveToThirdMission(
  currentMission: CurrentMission,
  secondMission: SecondPowerMissionState,
): CurrentMission {
  return currentMission === 'second' && secondMission.completed
    ? 'third'
    : currentMission;
}
