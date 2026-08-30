import {
  parse,
  type CallExpression,
  type ExpressionStatement,
  type Identifier,
  type MemberExpression,
  type Node,
  type ObjectExpression,
  type Program,
  type Property,
} from 'acorn';

export const MAX_SHARED_STUDENT_CODE_LENGTH = 256;

export type ThrowCommand = Readonly<{
  kind: 'throw';
  power: number;
}>;

export type StudentCodeError = 'length' | 'syntax' | 'statement' | 'power';

export type StudentCodeResult =
  | Readonly<{ ok: true; command: ThrowCommand }>
  | Readonly<{ ok: false; error: StudentCodeError }>;

function isIdentifier(node: Node, name: string): node is Identifier {
  return node.type === 'Identifier' && (node as Identifier).name === name;
}

function isThrowCall(node: Node): node is CallExpression {
  if (node.type !== 'CallExpression') {
    return false;
  }

  const call = node as CallExpression;
  if (call.optional || call.arguments.length !== 1) {
    return false;
  }

  if (call.callee.type !== 'MemberExpression') {
    return false;
  }

  const callee = call.callee as MemberExpression;
  return (
    !callee.computed &&
    !callee.optional &&
    isIdentifier(callee.object, 'biseok') &&
    isIdentifier(callee.property, 'throw')
  );
}

function getPowerArgument(call: CallExpression): number | null {
  const [argument] = call.arguments;

  if (!argument || argument.type !== 'ObjectExpression') {
    return null;
  }

  const object = argument as ObjectExpression;
  if (object.properties.length !== 1) {
    return null;
  }

  const [property] = object.properties;
  if (!property || property.type !== 'Property') {
    return null;
  }

  const powerProperty = property as Property;
  if (
    powerProperty.computed ||
    powerProperty.kind !== 'init' ||
    powerProperty.method ||
    powerProperty.shorthand ||
    !isIdentifier(powerProperty.key, 'power') ||
    powerProperty.value.type !== 'Literal' ||
    typeof powerProperty.value.value !== 'number'
  ) {
    return null;
  }

  return powerProperty.value.value;
}

function getOnlyStatement(program: Program): ExpressionStatement | null {
  if (program.body.length !== 1) {
    return null;
  }

  const [statement] = program.body;
  return statement?.type === 'ExpressionStatement' ? statement : null;
}

export function compileStudentCode(source: string): StudentCodeResult {
  if (source.length > MAX_SHARED_STUDENT_CODE_LENGTH) {
    return { ok: false, error: 'length' };
  }

  let program: Program;

  try {
    program = parse(source, { ecmaVersion: 2026, sourceType: 'script' });
  } catch {
    return { ok: false, error: 'syntax' };
  }

  const statement = getOnlyStatement(program);
  if (!statement || !isThrowCall(statement.expression)) {
    return { ok: false, error: 'statement' };
  }

  const power = getPowerArgument(statement.expression);
  if (power === null) {
    return { ok: false, error: 'statement' };
  }

  if (!Number.isFinite(power) || power < 1 || power > 10) {
    return { ok: false, error: 'power' };
  }

  return { ok: true, command: { kind: 'throw', power } };
}
