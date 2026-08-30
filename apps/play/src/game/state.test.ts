import { describe, expect, it } from 'vitest';

import { Quaternion, Vector3 } from 'three';

import {
  calculateTiltRadians,
  decideRoundOutcome,
  initialGameState,
  transitionGame,
} from './state';

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
  it('does not count a 90 degree yaw as a fallen biseok', () => {
    const targetUp = new Vector3(0, 1, 0).applyQuaternion(
      new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2),
    );

    expect(calculateTiltRadians(targetUp)).toBeCloseTo(0);
    expect(
      decideRoundOutcome({
        elapsedSeconds: 1,
        stoneHeight: 0.3,
        targetTiltRadians: calculateTiltRadians(targetUp),
      }),
    ).toBeNull();
  });

  it.each([
    { x: Math.sin(0.6), y: Math.cos(0.6), z: 0 },
    { x: 0, y: Math.cos(0.6), z: Math.sin(0.6) },
  ])(
    'succeeds when the biseok falls past the x/z tilt threshold',
    (targetUp) => {
      expect(
        decideRoundOutcome({
          elapsedSeconds: 1,
          stoneHeight: 0.3,
          targetTiltRadians: calculateTiltRadians(targetUp),
        }),
      ).toBe('success');
    },
  );

  it('does not succeed below the tilt threshold', () => {
    expect(
      decideRoundOutcome({
        elapsedSeconds: 1,
        stoneHeight: 0.3,
        targetTiltRadians: calculateTiltRadians({
          x: Math.sin(0.57),
          y: Math.cos(0.57),
          z: 0,
        }),
      }),
    ).toBeNull();
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
