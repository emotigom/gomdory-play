import type { ThrowCodeForm } from './studentCode';

export type ThirdPowerMissionState = Readonly<{
  completed: boolean;
  needsExpressionHint: boolean;
  needsMinimumPowerHint: boolean;
}>;

export const initialThirdPowerMissionState: ThirdPowerMissionState = {
  completed: false,
  needsExpressionHint: false,
  needsMinimumPowerHint: false,
};

export function recordThirdPowerMissionThrow(
  state: ThirdPowerMissionState,
  input: Readonly<{ form: ThrowCodeForm; power: number }>,
): ThirdPowerMissionState {
  if (state.completed) {
    return state;
  }

  if (input.form !== 'expression') {
    return {
      completed: false,
      needsExpressionHint: true,
      needsMinimumPowerHint: false,
    };
  }

  if (input.power < 5) {
    return {
      completed: false,
      needsExpressionHint: false,
      needsMinimumPowerHint: true,
    };
  }

  return {
    completed: true,
    needsExpressionHint: false,
    needsMinimumPowerHint: false,
  };
}
