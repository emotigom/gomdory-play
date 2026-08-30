export type GameStatus = 'ready' | 'flying' | 'success' | 'failure';

export type GameState = Readonly<{
  status: GameStatus;
  round: number;
}>;

export type GameEvent =
  | Readonly<{ type: 'throw' }>
  | Readonly<{ type: 'resolve'; status: 'success' | 'failure' }>
  | Readonly<{ type: 'reset' }>;

export const initialGameState: GameState = { status: 'ready', round: 0 };

export function transitionGame(state: GameState, event: GameEvent): GameState {
  if (event.type === 'reset') {
    return { status: 'ready', round: state.round + 1 };
  }

  if (event.type === 'throw' && state.status === 'ready') {
    return { ...state, status: 'flying' };
  }

  if (event.type === 'resolve' && state.status === 'flying') {
    return { ...state, status: event.status };
  }

  return state;
}

export function decideRoundOutcome(input: {
  elapsedSeconds: number;
  stoneHeight: number;
  targetTiltRadians: number;
}): 'success' | 'failure' | null {
  if (input.targetTiltRadians >= 0.58) {
    return 'success';
  }

  if (input.stoneHeight < -1 || input.elapsedSeconds >= 5.5) {
    return 'failure';
  }

  return null;
}
