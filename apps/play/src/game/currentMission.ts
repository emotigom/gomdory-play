import type { FirstPowerMissionState } from './firstPowerMission';
import type { SecondPowerMissionState } from './secondPowerMission';
import type { ThirdPowerMissionState } from './thirdPowerMission';

export type CurrentMission = 'first' | 'second' | 'third' | 'fourth';

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

export function moveToFourthMission(
  currentMission: CurrentMission,
  thirdMission: ThirdPowerMissionState,
): CurrentMission {
  return currentMission === 'third' && thirdMission.completed
    ? 'fourth'
    : currentMission;
}
