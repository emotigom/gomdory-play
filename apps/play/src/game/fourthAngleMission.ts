import type { ThrowCodeForm } from './studentCode';

export type FourthAngleMissionState = Readonly<{
  completed: boolean;
  needsAngleCodeHint: boolean;
  needsHigherAngleHint: boolean;
}>;

export const initialFourthAngleMissionState: FourthAngleMissionState = {
  completed: false,
  needsAngleCodeHint: false,
  needsHigherAngleHint: false,
};

export function recordFourthAngleMissionThrow(
  state: FourthAngleMissionState,
  input: Readonly<{
    angleDegrees?: number;
    form: ThrowCodeForm;
  }>,
): FourthAngleMissionState {
  if (state.completed) {
    return state;
  }

  if (input.form !== 'trajectory' || input.angleDegrees === undefined) {
    return {
      ...state,
      needsAngleCodeHint: true,
      needsHigherAngleHint: false,
    };
  }

  if (input.angleDegrees < 25) {
    return {
      ...state,
      needsAngleCodeHint: false,
      needsHigherAngleHint: true,
    };
  }

  return {
    completed: true,
    needsAngleCodeHint: false,
    needsHigherAngleHint: false,
  };
}
