import { describe, expect, it } from 'vitest';

import { decideRoundOutcome, initialGameState, transitionGame } from './state';

describe('game state transitions', () => {
  it('moves from ready to flying and then success', () => {
    const flying = transitionGame(initialGameState, { type: 'throw' });

    expect(flying.status).toBe('flying');
    expect(
      transitionGame(flying, { type: 'resolve', status: 'success' }).status,
    ).toBe('success');
  });

  it('does not resolve a round that was not thrown', () => {
    expect(
      transitionGame(initialGameState, { type: 'resolve', status: 'failure' }),
    ).toEqual(initialGameState);
  });

  it('resets every state into a fresh round', () => {
    expect(
      transitionGame({ status: 'failure', round: 3 }, { type: 'reset' }),
    ).toEqual({ status: 'ready', round: 4 });
  });
});

describe('round outcome', () => {
  it('succeeds when the target biseok has fallen far enough', () => {
    expect(
      decideRoundOutcome({
        elapsedSeconds: 1,
        stoneHeight: 0.3,
        targetTiltRadians: 0.6,
      }),
    ).toBe('success');
  });

  it('fails after the stone leaves the ground or the round times out', () => {
    expect(
      decideRoundOutcome({
        elapsedSeconds: 1,
        stoneHeight: -1.1,
        targetTiltRadians: 0,
      }),
    ).toBe('failure');
    expect(
      decideRoundOutcome({
        elapsedSeconds: 5.5,
        stoneHeight: 0.2,
        targetTiltRadians: 0,
      }),
    ).toBe('failure');
  });
});
