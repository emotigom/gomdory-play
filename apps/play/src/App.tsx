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
  initialCurrentMission,
  moveToFourthMission,
  moveToSecondMission,
  moveToThirdMission,
  type CurrentMission,
} from './game/currentMission';
import {
  initialFourthAngleMissionState,
  recordFourthAngleMissionThrow,
} from './game/fourthAngleMission';
import {
  initialSecondPowerMissionState,
  recordSecondPowerMissionThrow,
} from './game/secondPowerMission';
import {
  initialThirdPowerMissionState,
  recordThirdPowerMissionThrow,
} from './game/thirdPowerMission';
import {
  initialGameState,
  transitionGame,
  type GameStatus,
} from './game/state';
import {
  compileStudentCode,
  MAX_SHARED_STUDENT_CODE_LENGTH,
  type ThrowCodeForm,
  type StudentCodeError,
} from './game/studentCode';
import { clampAim, calculateThrow, nudgeAim, type Aim } from './game/throwing';

const keyboardStep = 28;
const starterCode = 'biseok.throw({ power: 3 });';
const secondMissionStarterCode = 'const power = 3;\nbiseok.throw({ power });';
const thirdMissionStarterCode =
  'const power = 3 + 0;\nbiseok.throw({ power });';
const fourthMissionStarterCode = 'biseok.throw({ power: 7, angle: 10 });';

type AimDrag = Readonly<{
  aim: Aim;
  clientX: number;
  clientY: number;
}>;

type RoundCommand = Readonly<{
  angleDegrees?: number;
  form: ThrowCodeForm;
  mission: CurrentMission;
  power: number;
  round: number;
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
    case 'angle':
      return 'angle을 5에서 45로 고쳐요.';
    case 'length':
      return '코드가 너무 길어요. 한 줄만 남겨요.';
    case 'syntax':
      return '괄호나 따옴표를 확인해요.';
    case 'power':
      return 'power를 1에서 10으로 고쳐요.';
    default:
      return '허용된 던지기 코드 형식으로 고쳐요.';
  }
}

export function App() {
  const [webglAvailable] = useState(supportsWebGL);
  const [game, setGame] = useState(initialGameState);
  const gameRef = useRef(initialGameState);
  const roundCommandRef = useRef<RoundCommand | null>(null);
  const currentMissionRef = useRef<CurrentMission>(initialCurrentMission);
  const [firstMission, setFirstMission] = useState(
    initialFirstPowerMissionState,
  );
  const [currentMission, setCurrentMission] = useState<CurrentMission>(
    initialCurrentMission,
  );
  const [secondMission, setSecondMission] = useState(
    initialSecondPowerMissionState,
  );
  const [thirdMission, setThirdMission] = useState(
    initialThirdPowerMissionState,
  );
  const [fourthMission, setFourthMission] = useState(
    initialFourthAngleMissionState,
  );
  const [aim, setAim] = useState<Aim>({ x: 0, y: 0 });
  const [code, setCode] = useState(starterCode);
  const [codeError, setCodeError] = useState<StudentCodeError | null>(null);
  const [throwPower, setThrowPower] = useState(7);
  const [throwAngleDegrees, setThrowAngleDegrees] = useState<
    number | undefined
  >(undefined);
  const [dragStart, setDragStart] = useState<AimDrag | null>(null);
  const [debugStats, setDebugStats] = useState({
    calls: 0,
    fps: 0,
    triangles: 0,
  });
  const debug =
    new URLSearchParams(window.location.search).get('debug') === '1';
  const throwVector = useMemo(
    () => calculateThrow(aim, throwPower, throwAngleDegrees),
    [aim, throwAngleDegrees, throwPower],
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
    setThrowAngleDegrees(result.command.angleDegrees);
    roundCommandRef.current = {
      angleDegrees: result.command.angleDegrees,
      form: result.form,
      mission: currentMissionRef.current,
      power: result.command.power,
      round: gameRef.current.round,
    };
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

      if (
        currentMission === 'fourth' &&
        (event.key === 'ArrowDown' || event.key === 'ArrowUp')
      ) {
        event.preventDefault();
        return;
      }

      const deltaByKey: Record<string, Aim> = {
        ...(currentMission === 'fourth'
          ? {}
          : {
              ArrowDown: { x: 0, y: keyboardStep },
              ArrowUp: { x: 0, y: -keyboardStep },
            }),
        ArrowLeft: { x: -keyboardStep, y: 0 },
        ArrowRight: { x: keyboardStep, y: 0 },
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
  }, [currentMission, game.status, throwRound]);

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
        y:
          currentMission === 'fourth'
            ? 0
            : dragStart.aim.y + event.clientY - dragStart.clientY,
      }),
    );
  };

  const finishAim = () => setDragStart(null);
  const resetRound = () => {
    const nextGame = transitionGame(gameRef.current, { type: 'reset' });
    gameRef.current = nextGame;
    roundCommandRef.current = null;
    setGame(nextGame);
    setAim({ x: 0, y: 0 });
    setDragStart(null);
    setCodeError(null);
    setDebugStats({ calls: 0, fps: 0, triangles: 0 });
  };
  const reset = () => resetRound();
  const startSecondMission = () => {
    const nextMission = moveToSecondMission(
      currentMissionRef.current,
      firstMission,
    );
    if (nextMission !== 'second') {
      return;
    }

    currentMissionRef.current = nextMission;
    setCurrentMission(nextMission);
    setSecondMission(initialSecondPowerMissionState);
    setCode(secondMissionStarterCode);
    resetRound();
  };
  const startThirdMission = () => {
    const nextMission = moveToThirdMission(
      currentMissionRef.current,
      secondMission,
    );
    if (nextMission !== 'third') {
      return;
    }

    currentMissionRef.current = nextMission;
    setCurrentMission(nextMission);
    setThirdMission(initialThirdPowerMissionState);
    setCode(thirdMissionStarterCode);
    resetRound();
  };
  const startFourthMission = () => {
    const nextMission = moveToFourthMission(
      currentMissionRef.current,
      thirdMission,
    );
    if (nextMission !== 'fourth') {
      return;
    }

    currentMissionRef.current = nextMission;
    setCurrentMission(nextMission);
    setFourthMission(initialFourthAngleMissionState);
    setCode(fourthMissionStarterCode);
    resetRound();
  };
  const finishRound = (round: number, status: 'success' | 'failure') => {
    const roundCommand = roundCommandRef.current;
    if (
      round !== gameRef.current.round ||
      gameRef.current.status !== 'flying' ||
      !roundCommand ||
      roundCommand.round !== round
    ) {
      return;
    }

    const nextGame = transitionGame(gameRef.current, {
      type: 'resolve',
      status,
    });
    gameRef.current = nextGame;
    roundCommandRef.current = null;
    setGame(nextGame);
    if (roundCommand.mission === 'first') {
      setFirstMission((current) =>
        recordCompletedThrow(current, roundCommand.power),
      );
    } else if (roundCommand.mission === 'second') {
      setSecondMission((current) =>
        recordSecondPowerMissionThrow(current, roundCommand),
      );
    } else if (roundCommand.mission === 'third') {
      setThirdMission((current) =>
        recordThirdPowerMissionThrow(current, roundCommand),
      );
    } else {
      setFourthMission((current) =>
        recordFourthAngleMissionThrow(current, roundCommand),
      );
    }
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
            <p className="rule">
              {currentMission === 'fourth'
                ? '조준 원은 좌우, angle은 높이예요.'
                : '조준은 방향, power는 힘이에요.'}
            </p>
          </div>
          {currentMission === 'first' ? (
            <section aria-live="polite" className="mission-card">
              <h2>첫 미션</h2>
              <p>power를 바꿔 두 번 던져 보세요.</p>
              <strong>
                {firstMission.step === 2 ? '완료' : `${firstMission.step} / 2`}
              </strong>
              {firstMission.needsDifferentPowerHint ? (
                <p>숫자를 조금 더 바꿔 보세요.</p>
              ) : null}
            </section>
          ) : currentMission === 'second' ? (
            <section aria-live="polite" className="mission-card">
              <h2>두 번째 미션</h2>
              <p>power 변수의 숫자를 바꿔 던져 보세요.</p>
              <strong>{secondMission.completed ? '완료' : '준비'}</strong>
              {secondMission.needsChangedPowerHint ? (
                <p>power의 숫자를 바꿔 보세요.</p>
              ) : null}
            </section>
          ) : currentMission === 'third' ? (
            <section aria-live="polite" className="mission-card">
              <h2>세 번째 미션</h2>
              <p>더하기 식으로 power를 5 이상 만들어 보세요.</p>
              <strong>{thirdMission.completed ? '완료' : '준비'}</strong>
              {thirdMission.needsMinimumPowerHint ? (
                <p>power를 5 이상으로 만들어 보세요.</p>
              ) : null}
              {thirdMission.needsExpressionHint ? (
                <p>더하기 식을 사용해 보세요.</p>
              ) : null}
            </section>
          ) : (
            <section aria-live="polite" className="mission-card">
              <h2>네 번째 미션</h2>
              <p>angle을 바꿔 돌을 더 높이 띄워 보세요.</p>
              <strong>{fourthMission.completed ? '완료' : '준비'}</strong>
              {fourthMission.needsHigherAngleHint ? (
                <p>angle을 25 이상으로 바꿔 보세요.</p>
              ) : null}
              {fourthMission.needsAngleCodeHint ? (
                <p>angle이 있는 코드를 사용해 보세요.</p>
              ) : null}
            </section>
          )}
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
            {currentMission === 'fourth'
              ? '조준 원은 좌우, angle은 높이예요.'
              : '조준 원을 드래그하거나 화살표로 방향을 정해요.'}
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
              {currentMission === 'fourth'
                ? 'power는 1부터 10, angle은 5부터 45까지 바꿔 보세요.'
                : 'power를 1부터 10까지 바꿔 보세요.'}
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
            {currentMission === 'first' && firstMission.step === 2 ? (
              <button
                className="secondary-button"
                onClick={startSecondMission}
                type="button"
              >
                다음 미션
              </button>
            ) : null}
            {currentMission === 'second' && secondMission.completed ? (
              <button
                className="secondary-button"
                onClick={startThirdMission}
                type="button"
              >
                다음 미션
              </button>
            ) : null}
            {currentMission === 'third' && thirdMission.completed ? (
              <button
                className="secondary-button"
                onClick={startFourthMission}
                type="button"
              >
                다음 미션
              </button>
            ) : null}
          </div>
        </aside>
      </section>
    </main>
  );
}
