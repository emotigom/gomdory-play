import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { App } from './App';

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
});
