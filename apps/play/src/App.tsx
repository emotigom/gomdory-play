import { useEffect, useMemo, useState, type PointerEvent } from 'react';

import './App.css';
import { BiseokScene } from './game/Scene';
import {
  initialGameState,
  transitionGame,
  type GameStatus,
} from './game/state';
import { clampAim, calculateThrow, nudgeAim, type Aim } from './game/throwing';

const keyboardStep = 28;

type AimDrag = Readonly<{
  aim: Aim;
  clientX: number;
  clientY: number;
}>;

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function statusMessage(status: GameStatus) {
  switch (status) {
    case 'flying':
      return '돌이 날아가고 있어요.';
    case 'success':
      return '비석이 쓰러졌어요!';
    case 'failure':
      return '이번에는 비석이 남아 있어요.';
    default:
      return '방향을 정한 뒤 돌을 던져 보세요.';
  }
}

export function App() {
  const [webglAvailable] = useState(supportsWebGL);
  const [game, setGame] = useState(initialGameState);
  const [aim, setAim] = useState<Aim>({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<AimDrag | null>(null);
  const [debugStats, setDebugStats] = useState({
    calls: 0,
    fps: 0,
    triangles: 0,
  });
  const debug =
    new URLSearchParams(window.location.search).get('debug') === '1';
  const throwVector = useMemo(() => calculateThrow(aim), [aim]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        if (event.repeat) {
          return;
        }
        setGame((current) => transitionGame(current, { type: 'throw' }));
        return;
      }

      const deltaByKey: Record<string, Aim> = {
        ArrowDown: { x: 0, y: keyboardStep },
        ArrowLeft: { x: -keyboardStep, y: 0 },
        ArrowRight: { x: keyboardStep, y: 0 },
        ArrowUp: { x: 0, y: -keyboardStep },
      };
      const delta = deltaByKey[event.key];

      if (delta) {
        event.preventDefault();
        if (game.status === 'ready') {
          setAim((current) => nudgeAim(current, delta));
        }
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [game.status]);

  if (!webglAvailable) {
    return (
      <main className="webgl-fallback">
        <div>
          <h1>골목 199X — 비석치기</h1>
          <p>이 브라우저에서는 WebGL을 사용할 수 없어요.</p>
        </div>
      </main>
    );
  }

  const startAim = (event: PointerEvent<HTMLDivElement>) => {
    if (game.status !== 'ready') {
      return;
    }

    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragStart({
      aim,
      clientX: event.clientX,
      clientY: event.clientY,
    });
  };

  const moveAim = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStart || game.status !== 'ready') {
      return;
    }
    setAim(
      clampAim({
        x: dragStart.aim.x + event.clientX - dragStart.clientX,
        y: dragStart.aim.y + event.clientY - dragStart.clientY,
      }),
    );
  };

  const throwRound = () => {
    setGame((current) => transitionGame(current, { type: 'throw' }));
  };

  const finishAim = () => setDragStart(null);
  const reset = () => {
    setGame((current) => transitionGame(current, { type: 'reset' }));
    setAim({ x: 0, y: 0 });
    setDragStart(null);
    setDebugStats({ calls: 0, fps: 0, triangles: 0 });
  };
  const dotPosition = {
    left: `${50 + aim.x / 4}%`,
    top: `${50 + aim.y / 4}%`,
  };

  return (
    <main className="game-shell">
      <section className="game-card" aria-label="비석치기 시제품">
        <div className="scene-wrap">
          <BiseokScene
            debug={debug}
            key={game.round}
            onDebugStats={setDebugStats}
            onRoundFinished={(status) =>
              setGame((current) =>
                transitionGame(current, { type: 'resolve', status }),
              )
            }
            status={game.status}
            throwVector={throwVector}
          />
          {debug ? (
            <output className="debug-hud">
              WebGL renderer · {debugStats.fps} FPS · {debugStats.calls} calls ·{' '}
              {debugStats.triangles} triangles · {game.status}
            </output>
          ) : null}
        </div>
        <aside className="panel">
          <div>
            <h1>골목 199X — 비석치기</h1>
            <p className="rule">선을 넘지 않고 비석을 쓰러뜨려 보세요.</p>
          </div>
          <div>
            <h2>이번 판 규칙</h2>
            <p className="rule">원을 드래그해 방향을 정해요.</p>
          </div>
          <p className="status" aria-live="polite">
            {statusMessage(game.status)}
          </p>
          <div
            aria-describedby="aim-instructions"
            aria-label="던지는 방향 조준"
            className="aim-pad"
            onPointerCancel={finishAim}
            onPointerDown={startAim}
            onPointerMove={moveAim}
            onPointerUp={finishAim}
            tabIndex={0}
          >
            <div aria-hidden="true" className="aim-dot" style={dotPosition} />
          </div>
          <p className="control-help" id="aim-instructions">
            조준 원을 클릭하거나 탭한 뒤 드래그하세요. 화살표로 방향을 조절하고
            Enter 또는 Space로 던집니다.
          </p>
          <div className="button-row">
            <button
              className="primary-button"
              disabled={game.status !== 'ready'}
              onClick={throwRound}
              type="button"
            >
              한 번 던져 보기
            </button>
            <button className="secondary-button" onClick={reset} type="button">
              다시 놓기
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}
