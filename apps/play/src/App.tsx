import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from 'react';

import './App.css';
import { BiseokScene } from './game/Scene';
import {
  initialFirstPowerMissionState,
  recordCompletedThrow,
} from './game/firstPowerMission';
import {
  initialGameState,
  transitionGame,
  type GameStatus,
} from './game/state';
import {
  compileStudentCode,
  MAX_SHARED_STUDENT_CODE_LENGTH,
  type StudentCodeError,
} from './game/studentCode';
import { clampAim, calculateThrow, nudgeAim, type Aim } from './game/throwing';

const keyboardStep = 28;
const starterCode = 'biseok.throw({ power: 3 });';

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

function codeErrorMessage(error: StudentCodeError) {
  switch (error) {
    case 'length':
      return '코드가 너무 길어요. 한 줄만 남겨요.';
    case 'syntax':
      return '괄호나 따옴표를 확인해요.';
    case 'power':
      return 'power를 1에서 10으로 고쳐요.';
    default:
      return '이 줄을 biseok.throw({ power: 숫자 });로 고쳐요.';
  }
}

export function App() {
  const [webglAvailable] = useState(supportsWebGL);
  const [game, setGame] = useState(initialGameState);
  const gameRef = useRef(initialGameState);
  const [mission, setMission] = useState(initialFirstPowerMissionState);
  const [aim, setAim] = useState<Aim>({ x: 0, y: 0 });
  const [code, setCode] = useState(starterCode);
  const [codeError, setCodeError] = useState<StudentCodeError | null>(null);
  const [throwPower, setThrowPower] = useState(7);
  const [dragStart, setDragStart] = useState<AimDrag | null>(null);
  const [debugStats, setDebugStats] = useState({
    calls: 0,
    fps: 0,
    triangles: 0,
  });
  const debug =
    new URLSearchParams(window.location.search).get('debug') === '1';
  const throwVector = useMemo(
    () => calculateThrow(aim, throwPower),
    [aim, throwPower],
  );

  const throwRound = useCallback(() => {
    if (gameRef.current.status !== 'ready') {
      return;
    }

    const result = compileStudentCode(code);
    if (!result.ok) {
      setCodeError(result.error);
      return;
    }

    setCodeError(null);
    setThrowPower(result.command.power);
    const nextGame = transitionGame(gameRef.current, { type: 'throw' });
    gameRef.current = nextGame;
    setGame(nextGame);
  }, [code]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        if (event.repeat) {
          return;
        }
        throwRound();
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
  }, [game.status, throwRound]);

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

  const finishAim = () => setDragStart(null);
  const reset = () => {
    const nextGame = transitionGame(gameRef.current, { type: 'reset' });
    gameRef.current = nextGame;
    setGame(nextGame);
    setAim({ x: 0, y: 0 });
    setDragStart(null);
    setCodeError(null);
    setDebugStats({ calls: 0, fps: 0, triangles: 0 });
  };
  const finishRound = (round: number, status: 'success' | 'failure') => {
    if (
      round !== gameRef.current.round ||
      gameRef.current.status !== 'flying'
    ) {
      return;
    }

    const nextGame = transitionGame(gameRef.current, {
      type: 'resolve',
      status,
    });
    gameRef.current = nextGame;
    setGame(nextGame);
    setMission((current) => recordCompletedThrow(current, throwPower));
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
            onRoundFinished={(status) => finishRound(game.round, status)}
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
            <h1>
              <span className="title-line">골목 199X —</span>
              <span className="title-line">비석치기</span>
            </h1>
            <p className="rule">선을 넘지 않고 비석을 쓰러뜨려 보세요.</p>
          </div>
          <div>
            <h2>이번 판 규칙</h2>
            <p className="rule">조준은 방향, power는 힘이에요.</p>
          </div>
          <section aria-live="polite" className="first-mission">
            <h2>첫 미션</h2>
            <p>power를 바꿔 두 번 던져 보세요.</p>
            <strong>
              {mission.step === 2 ? '완료' : `${mission.step} / 2`}
            </strong>
            {mission.needsDifferentPowerHint ? (
              <p>숫자를 조금 더 바꿔 보세요.</p>
            ) : null}
          </section>
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
            조준 원을 드래그하거나 화살표로 방향을 정해요.
          </p>
          <div className="code-editor">
            <label htmlFor="throw-code">돌 던지는 코드</label>
            <textarea
              aria-describedby={
                codeError ? 'code-help code-error' : 'code-help'
              }
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              id="throw-code"
              maxLength={MAX_SHARED_STUDENT_CODE_LENGTH}
              onChange={(event) => {
                setCode(event.target.value);
                setCodeError(null);
              }}
              spellCheck={false}
              value={code}
            />
            <p className="control-help" id="code-help">
              power를 1부터 10까지 바꿔 보세요.
            </p>
            {codeError ? (
              <p className="code-error" id="code-error" role="alert">
                {codeErrorMessage(codeError)}
              </p>
            ) : null}
          </div>
          <div className="button-row">
            <button
              className="primary-button"
              disabled={game.status !== 'ready'}
              onClick={throwRound}
              type="button"
            >
              코드로 던지기
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
