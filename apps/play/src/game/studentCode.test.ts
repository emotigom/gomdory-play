import { describe, expect, it } from 'vitest';

import {
  compileStudentCode,
  MAX_SHARED_STUDENT_CODE_LENGTH,
} from './studentCode';

describe('compileStudentCode', () => {
  it('converts the allowed throw statement into a command', () => {
    expect(compileStudentCode('biseok.throw({ power: 7 });')).toEqual({
      ok: true,
      command: { kind: 'throw', power: 7 },
      form: 'literal',
    });
  });

  it('allows whitespace and line breaks around the same statement', () => {
    expect(
      compileStudentCode('\n biseok . throw ( { power : 3.5 } ) ; \n'),
    ).toEqual({
      ok: true,
      command: { kind: 'throw', power: 3.5 },
      form: 'literal',
    });
  });

  it('accepts code at the shared length limit', () => {
    const source = 'biseok.throw({ power: 7 });'.padEnd(
      MAX_SHARED_STUDENT_CODE_LENGTH,
    );

    expect(source).toHaveLength(MAX_SHARED_STUDENT_CODE_LENGTH);
    expect(compileStudentCode(source)).toEqual({
      ok: true,
      command: { kind: 'throw', power: 7 },
      form: 'literal',
    });
  });

  it('converts the exact const variable form into a command with metadata', () => {
    expect(
      compileStudentCode('const power = 7;\nbiseok.throw({ power });'),
    ).toEqual({
      ok: true,
      command: { kind: 'throw', power: 7 },
      form: 'variable',
    });
  });

  it('adds two literal operands into an expression command', () => {
    expect(
      compileStudentCode('const power = 3 + 4;\nbiseok.throw({ power });'),
    ).toEqual({
      ok: true,
      command: { kind: 'throw', power: 7 },
      form: 'expression',
    });
  });

  it('allows whitespace and line breaks in the expression form', () => {
    expect(
      compileStudentCode(
        '\n const power\n =\n 2.5\n +\n 3.5 ;\n biseok . throw ( { power } ) ;\n',
      ),
    ).toEqual({
      ok: true,
      command: { kind: 'throw', power: 6 },
      form: 'expression',
    });
  });

  it.each([
    { expression: '0.5 + 0.5', power: 1 },
    { expression: '6 + 4', power: 10 },
  ])(
    'accepts expression power at the range boundary: $power',
    ({ expression, power }) => {
      expect(
        compileStudentCode(
          `const power = ${expression};\nbiseok.throw({ power });`,
        ),
      ).toEqual({
        ok: true,
        command: { kind: 'throw', power },
        form: 'expression',
      });
    },
  );

  it('accepts expression code at the shared length limit', () => {
    const source = 'const power = 3 + 4; biseok.throw({ power });'.padEnd(
      MAX_SHARED_STUDENT_CODE_LENGTH,
    );

    expect(source).toHaveLength(MAX_SHARED_STUDENT_CODE_LENGTH);
    expect(compileStudentCode(source)).toEqual({
      ok: true,
      command: { kind: 'throw', power: 7 },
      form: 'expression',
    });
  });

  it.each([1, 10])(
    'accepts variable power at the range boundary: %s',
    (power) => {
      expect(
        compileStudentCode(`const power = ${power};\nbiseok.throw({ power });`),
      ).toEqual({
        ok: true,
        command: { kind: 'throw', power },
        form: 'variable',
      });
    },
  );

  it('rejects code over the shared length limit before parsing', () => {
    const source = '('.repeat(MAX_SHARED_STUDENT_CODE_LENGTH + 1);

    expect(compileStudentCode(source)).toEqual({ ok: false, error: 'length' });
  });

  it.each([0, 0.5, 10.5, 11])('rejects power outside 1 to 10: %s', (power) => {
    expect(
      compileStudentCode(`const power = ${power}; biseok.throw({ power });`),
    ).toEqual({ ok: false, error: 'power' });
  });

  it.each(['0 + 0', '10 + 0.5', '1e309 + 0'])(
    'rejects expression results outside the finite 1 to 10 range: %s',
    (expression) => {
      expect(
        compileStudentCode(
          `const power = ${expression}; biseok.throw({ power });`,
        ),
      ).toEqual({ ok: false, error: 'power' });
    },
  );

  it.each(['4 - 1', '2 * 3', '8 / 2', '7 % 4', '2 ** 3'])(
    'rejects expression operator outside addition: %s',
    (expression) => {
      expect(
        compileStudentCode(
          `const power = ${expression}; biseok.throw({ power });`,
        ),
      ).toEqual({ ok: false, error: 'statement' });
    },
  );

  it.each([
    '"3" + 4',
    'other + 4',
    'getPower() + 4',
    '+3 + 4',
    '-3 + 4',
    '1 + 2 + 3',
    '1 + (2 + 3)',
  ])('rejects disallowed expression operands: %s', (expression) => {
    expect(
      compileStudentCode(
        `const power = ${expression}; biseok.throw({ power });`,
      ),
    ).toEqual({ ok: false, error: 'statement' });
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
    'let power = 7; biseok.throw({ power });',
    'var power = 7; biseok.throw({ power });',
    'const power = 7; power = 8; biseok.throw({ power });',
    'const power = 7, other = 8; biseok.throw({ power });',
    'const { power } = value; biseok.throw({ power });',
    'const strength = 7; biseok.throw({ power });',
    'const power = 7; biseok.throw({ power: power });',
    'const power = 7; biseok.throw({ power, extra: true });',
    'const power = 7; biseok.throw({ [power]: power });',
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
    'const power = document.body; biseok.throw({ power })',
    'const power = fetch("/api"); biseok.throw({ power })',
    'const power = localStorage.power; biseok.throw({ power })',
    'const power = WebSocket.constructor; biseok.throw({ power })',
    'const power = biseok.throw.constructor; biseok.throw({ power })',
    'import("/code")',
    'eval("biseok.throw({ power: 7 })")',
    'Function("return 7")()',
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
