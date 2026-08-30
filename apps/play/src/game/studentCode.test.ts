import { describe, expect, it } from 'vitest';

import { compileStudentCode } from './studentCode';

describe('compileStudentCode', () => {
  it('converts the allowed throw statement into a command', () => {
    expect(compileStudentCode('biseok.throw({ power: 7 });')).toEqual({
      ok: true,
      command: { kind: 'throw', power: 7 },
    });
  });

  it('allows whitespace and line breaks around the same statement', () => {
    expect(
      compileStudentCode('\n biseok . throw ( { power : 3.5 } ) ; \n'),
    ).toEqual({ ok: true, command: { kind: 'throw', power: 3.5 } });
  });

  it.each([0, 0.5, 10.5, 11])('rejects power outside 1 to 10: %s', (power) => {
    expect(compileStudentCode(`biseok.throw({ power: ${power} });`)).toEqual({
      ok: false,
      error: 'power',
    });
  });

  it.each(['NaN', 'Infinity', '1 / 0'])(
    'rejects non-finite power expressions: %s',
    (power) => {
      expect(compileStudentCode(`biseok.throw({ power: ${power} });`)).toEqual({
        ok: false,
        error: 'statement',
      });
    },
  );

  it.each([
    'biseok.throw({ power: 7 }); biseok.throw({ power: 8 });',
    'const power = 7;',
    'biseok.throw({ power: 3 + 4 });',
    'function throwStone() {}',
    'biseok.throw({ power: 7, extra: true });',
  ])(
    'rejects statements and expressions outside the allowed shape: %s',
    (source) => {
      expect(compileStudentCode(source)).toEqual({
        ok: false,
        error: 'statement',
      });
    },
  );

  it.each([
    'document.body.append("x")',
    'fetch("/api")',
    'localStorage.setItem("power", "7")',
    'new WebSocket("wss://example.com")',
    'biseok.throw.constructor({ power: 7 })',
  ])('rejects access attempts: %s', (source) => {
    expect(compileStudentCode(source)).toEqual({
      ok: false,
      error: 'statement',
    });
  });

  it('separates parser errors from disallowed code', () => {
    expect(compileStudentCode('biseok.throw({ power: 7')).toEqual({
      ok: false,
      error: 'syntax',
    });
  });
});
