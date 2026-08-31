import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';

const sceneCallbacks = vi.hoisted(() => ({
  flying: null as ((status: 'success' | 'failure') => void) | null,
}));

vi.mock('./game/Scene', () => ({
  BiseokScene: ({
    onRoundFinished,
    status,
    throwVector,
  }: {
    onRoundFinished: (status: 'success' | 'failure') => void;
    status: string;
    throwVector: { strength: number };
  }) => {
    if (status === 'flying') {
      sceneCallbacks.flying = onRoundFinished;
    }

    return (
      <>
        <output data-strength={throwVector.strength} data-testid="scene-status">
          {status}
        </output>
        <button onClick={() => onRoundFinished('failure')} type="button">
          던지기 종료
        </button>
        <button
          onClick={() => sceneCallbacks.flying?.('failure')}
          type="button"
        >
          지연된 던지기 종료
        </button>
      </>
    );
  },
}));

afterEach(() => {
  cleanup();
  sceneCallbacks.flying = null;
});

function completeFirstMission(editor: HTMLElement) {
  fireEvent.click(screen.getByRole('button', { name: '코드로 던지기' }));
  fireEvent.click(screen.getByRole('button', { name: '던지기 종료' }));
  fireEvent.click(screen.getByRole('button', { name: '다시 놓기' }));
  fireEvent.change(editor, {
    target: { value: 'biseok.throw({ power: 9 });' },
  });
  fireEvent.click(screen.getByRole('button', { name: '코드로 던지기' }));
  fireEvent.click(screen.getByRole('button', { name: '던지기 종료' }));
  fireEvent.click(screen.getByRole('button', { name: '다음 미션' }));
}

function moveToThirdMission(editor: HTMLElement) {
  completeFirstMission(editor);
  fireEvent.change(editor, {
    target: { value: 'const power = 7;\nbiseok.throw({ power });' },
  });
  fireEvent.click(screen.getByRole('button', { name: '코드로 던지기' }));
  fireEvent.click(screen.getByRole('button', { name: '던지기 종료' }));
  fireEvent.click(screen.getByRole('button', { name: '다음 미션' }));
}

describe('App', () => {
  it('shows a short WebGL notice when the browser cannot create a context', () => {
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(null);

    render(<App />);

    expect(
      screen.getByRole('heading', { name: '골목 199X — 비석치기' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('이 브라우저에서는 WebGL을 사용할 수 없어요.'),
    ).toBeInTheDocument();

    getContext.mockRestore();
  });

  it('moves the visible aim dot from keyboard and drag controls while ready', () => {
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({} as RenderingContext);
    render(<App />);

    const aimPad = screen.getByLabelText('던지는 방향 조준');
    const aimDot = aimPad.firstElementChild as HTMLDivElement;
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(aimDot).toHaveStyle({ left: '57%' });

    fireEvent.pointerDown(aimPad, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(aimPad, {
      pointerId: 1,
      clientX: 272,
      clientY: -100,
    });
    expect(aimDot).toHaveStyle({ left: '95%', top: '5%' });

    expect(aimPad).toHaveAttribute('tabindex', '0');
    expect(aimPad).toHaveAttribute('aria-describedby', 'aim-instructions');

    getContext.mockRestore();
  });

  it('ignores aim input after a throw and restores aim when reset', () => {
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({} as RenderingContext);

    render(<App />);

    const aimPad = screen.getByLabelText('던지는 방향 조준');
    const aimDot = aimPad.firstElementChild as HTMLDivElement;
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(aimDot).toHaveStyle({ left: '43%' });

    fireEvent.keyDown(window, { key: 'Enter' });
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(screen.getByTestId('scene-status')).toHaveTextContent('flying');

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(aimDot).toHaveStyle({ left: '43%' });

    fireEvent.click(screen.getByRole('button', { name: '다시 놓기' }));
    expect(screen.getByTestId('scene-status')).toHaveTextContent('ready');
    expect(aimDot).toHaveStyle({ left: '50%', top: '50%' });

    getContext.mockRestore();
  });

  it('runs corrected code without a refresh and keeps it after reset', () => {
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({} as RenderingContext);

    render(<App />);

    const editor = screen.getByLabelText('돌 던지는 코드');
    expect(editor).toHaveAttribute('maxlength', '256');
    fireEvent.change(editor, { target: { value: 'const power = 9;' } });
    fireEvent.click(screen.getByRole('button', { name: '코드로 던지기' }));

    expect(screen.getByTestId('scene-status')).toHaveTextContent('ready');
    expect(screen.getByRole('alert')).toHaveTextContent(
      '허용된 던지기 코드 형식으로 고쳐요.',
    );

    fireEvent.change(editor, {
      target: { value: 'biseok.throw({ power: 9 });' },
    });
    fireEvent.click(screen.getByRole('button', { name: '코드로 던지기' }));

    expect(screen.getByTestId('scene-status')).toHaveTextContent('flying');
    expect(screen.getByTestId('scene-status')).toHaveAttribute(
      'data-strength',
      '12.6',
    );

    fireEvent.click(screen.getByRole('button', { name: '다시 놓기' }));
    expect(screen.getByTestId('scene-status')).toHaveTextContent('ready');
    expect(editor).toHaveValue('biseok.throw({ power: 9 });');

    getContext.mockRestore();
  });

  it('records only finished throws and preserves the first mission progress on reset', () => {
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({} as RenderingContext);

    render(<App />);

    const editor = screen.getByLabelText('돌 던지는 코드');
    expect(editor).toHaveValue('biseok.throw({ power: 3 });');
    fireEvent.click(screen.getByRole('button', { name: '던지기 종료' }));
    expect(screen.getByText('0 / 2')).toBeInTheDocument();

    fireEvent.change(editor, { target: { value: 'const power = 3;' } });
    fireEvent.click(screen.getByRole('button', { name: '코드로 던지기' }));
    fireEvent.click(screen.getByRole('button', { name: '던지기 종료' }));
    expect(screen.getByText('0 / 2')).toBeInTheDocument();

    fireEvent.change(editor, {
      target: { value: 'biseok.throw({ power: 3 });' },
    });
    fireEvent.click(screen.getByRole('button', { name: '다시 놓기' }));
    expect(screen.getByText('0 / 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '코드로 던지기' }));
    fireEvent.click(screen.getByRole('button', { name: '다시 놓기' }));
    fireEvent.click(screen.getByRole('button', { name: '던지기 종료' }));
    fireEvent.click(screen.getByRole('button', { name: '지연된 던지기 종료' }));
    expect(screen.getByText('0 / 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '코드로 던지기' }));
    fireEvent.click(screen.getByRole('button', { name: '던지기 종료' }));
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '다시 놓기' }));
    expect(editor).toHaveValue('biseok.throw({ power: 3 });');
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '코드로 던지기' }));
    fireEvent.click(screen.getByRole('button', { name: '던지기 종료' }));
    expect(screen.getByText('숫자를 조금 더 바꿔 보세요.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '다시 놓기' }));

    fireEvent.change(editor, {
      target: { value: 'biseok.throw({ power: 9 });' },
    });
    fireEvent.click(screen.getByRole('button', { name: '코드로 던지기' }));
    fireEvent.click(screen.getByRole('button', { name: '던지기 종료' }));
    expect(screen.getByText('완료')).toBeInTheDocument();

    getContext.mockRestore();
  });

  it('unlocks and completes the const power mission only from a finished variable round', () => {
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({} as RenderingContext);

    render(<App />);

    const editor = screen.getByLabelText('돌 던지는 코드');
    expect(
      screen.queryByRole('button', { name: '다음 미션' }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '코드로 던지기' }));
    fireEvent.click(screen.getByRole('button', { name: '던지기 종료' }));
    fireEvent.click(screen.getByRole('button', { name: '다시 놓기' }));
    fireEvent.change(editor, {
      target: { value: 'biseok.throw({ power: 9 });' },
    });
    fireEvent.click(screen.getByRole('button', { name: '코드로 던지기' }));
    fireEvent.click(screen.getByRole('button', { name: '던지기 종료' }));

    fireEvent.click(screen.getByRole('button', { name: '다음 미션' }));
    expect(
      screen.getByRole('heading', { name: '두 번째 미션' }),
    ).toBeInTheDocument();
    expect(editor).toHaveValue('const power = 3;\nbiseok.throw({ power });');
    expect(screen.getByText('준비')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '코드로 던지기' }));
    fireEvent.click(screen.getByRole('button', { name: '던지기 종료' }));
    expect(screen.getByText('power의 숫자를 바꿔 보세요.')).toBeInTheDocument();
    expect(screen.getByText('준비')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '다시 놓기' }));
    fireEvent.change(editor, {
      target: { value: 'biseok.throw({ power: 7 });' },
    });
    fireEvent.click(screen.getByRole('button', { name: '코드로 던지기' }));
    fireEvent.click(screen.getByRole('button', { name: '던지기 종료' }));
    expect(screen.getByText('준비')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '다시 놓기' }));
    fireEvent.change(editor, {
      target: { value: 'const power = 7;\nbiseok.throw({ power });' },
    });
    fireEvent.click(screen.getByRole('button', { name: '코드로 던지기' }));
    fireEvent.click(screen.getByRole('button', { name: '던지기 종료' }));
    expect(screen.getByText('완료')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '다시 놓기' }));
    fireEvent.change(editor, {
      target: { value: 'const power = 3;\nbiseok.throw({ power });' },
    });
    fireEvent.click(screen.getByRole('button', { name: '코드로 던지기' }));
    fireEvent.click(screen.getByRole('button', { name: '던지기 종료' }));
    expect(screen.getByText('완료')).toBeInTheDocument();

    getContext.mockRestore();
  });

  it('does not advance the second mission from a reset round callback', () => {
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({} as RenderingContext);

    render(<App />);

    const editor = screen.getByLabelText('돌 던지는 코드');
    fireEvent.click(screen.getByRole('button', { name: '코드로 던지기' }));
    fireEvent.click(screen.getByRole('button', { name: '던지기 종료' }));
    fireEvent.click(screen.getByRole('button', { name: '다시 놓기' }));
    fireEvent.change(editor, {
      target: { value: 'biseok.throw({ power: 9 });' },
    });
    fireEvent.click(screen.getByRole('button', { name: '코드로 던지기' }));
    fireEvent.click(screen.getByRole('button', { name: '던지기 종료' }));
    fireEvent.click(screen.getByRole('button', { name: '다음 미션' }));

    fireEvent.change(editor, {
      target: { value: 'const power = 7;\nbiseok.throw({ power });' },
    });
    fireEvent.click(screen.getByRole('button', { name: '코드로 던지기' }));
    fireEvent.click(screen.getByRole('button', { name: '다시 놓기' }));
    fireEvent.click(screen.getByRole('button', { name: '지연된 던지기 종료' }));

    expect(screen.getByText('준비')).toBeInTheDocument();
    getContext.mockRestore();
  });

  it('unlocks the third mission only after the second mission and resets the scene and aim', () => {
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({} as RenderingContext);

    render(<App />);

    const editor = screen.getByLabelText('돌 던지는 코드');
    completeFirstMission(editor);
    expect(
      screen.queryByRole('button', { name: '다음 미션' }),
    ).not.toBeInTheDocument();

    const aimPad = screen.getByLabelText('던지는 방향 조준');
    const aimDot = aimPad.firstElementChild as HTMLDivElement;
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(aimDot).toHaveStyle({ left: '57%' });

    fireEvent.change(editor, {
      target: { value: 'const power = 7;\nbiseok.throw({ power });' },
    });
    fireEvent.click(screen.getByRole('button', { name: '코드로 던지기' }));
    fireEvent.click(screen.getByRole('button', { name: '던지기 종료' }));
    expect(
      screen.getByRole('button', { name: '다음 미션' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '다음 미션' }));
    expect(
      screen.getByRole('heading', { name: '세 번째 미션' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('더하기 식으로 power를 5 이상 만들어 보세요.'),
    ).toBeInTheDocument();
    expect(editor).toHaveValue(
      'const power = 3 + 0;\nbiseok.throw({ power });',
    );
    expect(screen.getByTestId('scene-status')).toHaveTextContent('ready');
    expect(aimDot).toHaveStyle({ left: '50%', top: '50%' });

    getContext.mockRestore();
  });

  it('guides third-mission throws and completes from the recorded expression round', () => {
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({} as RenderingContext);

    render(<App />);

    const editor = screen.getByLabelText('돌 던지는 코드');
    moveToThirdMission(editor);

    fireEvent.click(screen.getByRole('button', { name: '코드로 던지기' }));
    fireEvent.click(screen.getByRole('button', { name: '던지기 종료' }));
    expect(
      screen.getByText('power를 5 이상으로 만들어 보세요.'),
    ).toBeInTheDocument();
    expect(screen.getByText('준비')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '다시 놓기' }));
    fireEvent.change(editor, {
      target: { value: 'biseok.throw({ power: 7 });' },
    });
    fireEvent.click(screen.getByRole('button', { name: '코드로 던지기' }));
    fireEvent.click(screen.getByRole('button', { name: '던지기 종료' }));
    expect(screen.getByText('더하기 식을 사용해 보세요.')).toBeInTheDocument();
    expect(screen.getByText('준비')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '다시 놓기' }));
    fireEvent.change(editor, {
      target: { value: 'const power = 7;\nbiseok.throw({ power });' },
    });
    fireEvent.click(screen.getByRole('button', { name: '코드로 던지기' }));
    fireEvent.click(screen.getByRole('button', { name: '던지기 종료' }));
    expect(screen.getByText('더하기 식을 사용해 보세요.')).toBeInTheDocument();
    expect(screen.getByText('준비')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '다시 놓기' }));
    fireEvent.change(editor, {
      target: { value: 'const power = 3 + 4;\nbiseok.throw({ power });' },
    });
    fireEvent.click(screen.getByRole('button', { name: '코드로 던지기' }));
    fireEvent.change(editor, {
      target: { value: 'biseok.throw({ power: 3 });' },
    });
    fireEvent.click(screen.getByRole('button', { name: '던지기 종료' }));
    expect(screen.getByText('완료')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '다시 놓기' }));
    fireEvent.change(editor, {
      target: { value: 'const power = 3 + 0;\nbiseok.throw({ power });' },
    });
    fireEvent.click(screen.getByRole('button', { name: '코드로 던지기' }));
    fireEvent.click(screen.getByRole('button', { name: '던지기 종료' }));
    expect(screen.getByText('완료')).toBeInTheDocument();

    getContext.mockRestore();
  });

  it('ignores reset, late, and duplicate callbacks in the third mission', () => {
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({} as RenderingContext);

    render(<App />);

    const editor = screen.getByLabelText('돌 던지는 코드');
    moveToThirdMission(editor);
    fireEvent.change(editor, {
      target: { value: 'const power = 3 + 4;\nbiseok.throw({ power });' },
    });
    fireEvent.click(screen.getByRole('button', { name: '코드로 던지기' }));
    fireEvent.click(screen.getByRole('button', { name: '다시 놓기' }));
    fireEvent.click(screen.getByRole('button', { name: '지연된 던지기 종료' }));
    expect(screen.getByText('준비')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '코드로 던지기' }));
    fireEvent.click(screen.getByRole('button', { name: '던지기 종료' }));
    fireEvent.click(screen.getByRole('button', { name: '던지기 종료' }));
    fireEvent.click(screen.getByRole('button', { name: '지연된 던지기 종료' }));
    expect(screen.getByText('완료')).toBeInTheDocument();

    getContext.mockRestore();
  });
});
