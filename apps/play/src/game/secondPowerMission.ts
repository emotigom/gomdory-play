import type { ThrowCodeForm } from './studentCode';

export type SecondPowerMissionState = Readonly<{
  completed: boolean;
  needsChangedPowerHint: boolean;
}>;

export const initialSecondPowerMissionState: SecondPowerMissionState = {
  completed: false,
  needsChangedPowerHint: false,
};

export function recordSecondPowerMissionThrow(
  state: SecondPowerMissionState,
  input: Readonly<{ form: ThrowCodeForm; power: number }>,
): SecondPowerMissionState {
  if (state.completed || input.form !== 'variable') {
    return state;
  }

  if (Math.abs(input.power - 3) < 2) {
    return { ...state, needsChangedPowerHint: true };
  }

  return { completed: true, needsChangedPowerHint: false };
}
