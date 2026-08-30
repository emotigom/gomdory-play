import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('renders the product title', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: '곰돌이 플레이' }),
    ).toBeInTheDocument();
  });
});
