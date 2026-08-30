export type FirstPowerMissionState = Readonly<{
  completedPowers: readonly number[];
  step: 0 | 1 | 2;
  needsDifferentPowerHint: boolean;
}>;

export const initialFirstPowerMissionState: FirstPowerMissionState = {
  completedPowers: [],
  step: 0,
  needsDifferentPowerHint: false,
};

export function recordCompletedThrow(
  state: FirstPowerMissionState,
  power: number,
): FirstPowerMissionState {
  if (state.step === 2) {
    return state;
  }

  if (state.step === 0) {
    return {
      completedPowers: [power],
      step: 1,
      needsDifferentPowerHint: false,
    };
  }

  const [firstPower] = state.completedPowers;

  if (Math.abs(power - firstPower) < 2) {
    return { ...state, needsDifferentPowerHint: true };
  }

  return {
    completedPowers: [firstPower, power],
    step: 2,
    needsDifferentPowerHint: false,
  };
}
