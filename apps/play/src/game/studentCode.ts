import {
  parse,
  type BinaryExpression,
  type CallExpression,
  type ExpressionStatement,
  type Identifier,
  type Literal,
  type MemberExpression,
  type Node,
  type ObjectExpression,
  type Program,
  type Property,
  type VariableDeclaration,
  type VariableDeclarator,
} from 'acorn';

export const MAX_SHARED_STUDENT_CODE_LENGTH = 256;

export type ThrowCommand = Readonly<{
  kind: 'throw';
  power: number;
}>;

export type ThrowCodeForm = 'expression' | 'literal' | 'variable';

export type StudentCodeError = 'length' | 'syntax' | 'statement' | 'power';

export type StudentCodeResult =
  | Readonly<{
      ok: true;
      command: ThrowCommand;
      form: ThrowCodeForm;
    }>
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

function isShorthandPowerArgument(call: CallExpression): boolean {
  const [argument] = call.arguments;

  if (!argument || argument.type !== 'ObjectExpression') {
    return false;
  }

  const object = argument as ObjectExpression;
  if (object.properties.length !== 1) {
    return false;
  }

  const [property] = object.properties;
  if (!property || property.type !== 'Property') {
    return false;
  }

  const powerProperty = property as Property;
  return (
    !powerProperty.computed &&
    powerProperty.kind === 'init' &&
    !powerProperty.method &&
    powerProperty.shorthand &&
    isIdentifier(powerProperty.key, 'power') &&
    isIdentifier(powerProperty.value, 'power')
  );
}

function getOnlyStatement(program: Program): ExpressionStatement | null {
  if (program.body.length !== 1) {
    return null;
  }

  const [statement] = program.body;
  return statement?.type === 'ExpressionStatement' ? statement : null;
}

type DeclaredPower = Readonly<{
  form: 'expression' | 'variable';
  power: number;
}>;

function getExpressionPower(node: Node): number | null {
  if (node.type !== 'BinaryExpression') {
    return null;
  }

  const expression = node as BinaryExpression;
  if (
    expression.operator !== '+' ||
    expression.left.type !== 'Literal' ||
    expression.right.type !== 'Literal'
  ) {
    return null;
  }

  const left = expression.left as Literal;
  const right = expression.right as Literal;
  if (typeof left.value !== 'number' || typeof right.value !== 'number') {
    return null;
  }

  return left.value + right.value;
}

function getDeclaredPower(program: Program): DeclaredPower | null {
  if (program.body.length !== 2) {
    return null;
  }

  const [declarationStatement, throwStatement] = program.body;
  if (
    declarationStatement?.type !== 'VariableDeclaration' ||
    throwStatement?.type !== 'ExpressionStatement'
  ) {
    return null;
  }

  const declaration = declarationStatement as VariableDeclaration;
  if (declaration.kind !== 'const' || declaration.declarations.length !== 1) {
    return null;
  }

  const [declarator] = declaration.declarations;
  const powerDeclaration = declarator as VariableDeclarator | undefined;
  if (
    !powerDeclaration ||
    !isIdentifier(powerDeclaration.id, 'power') ||
    !powerDeclaration.init ||
    !isThrowCall(throwStatement.expression) ||
    !isShorthandPowerArgument(throwStatement.expression)
  ) {
    return null;
  }

  if (
    powerDeclaration.init.type === 'Literal' &&
    typeof powerDeclaration.init.value === 'number'
  ) {
    return { form: 'variable', power: powerDeclaration.init.value };
  }

  const expressionPower = getExpressionPower(powerDeclaration.init);
  return expressionPower === null
    ? null
    : { form: 'expression', power: expressionPower };
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
  const literalPower =
    statement && isThrowCall(statement.expression)
      ? getPowerArgument(statement.expression)
      : null;
  let form: ThrowCodeForm;
  let power: number;
  if (literalPower !== null) {
    form = 'literal';
    power = literalPower;
  } else {
    const declaredPower = getDeclaredPower(program);
    if (declaredPower === null) {
      return { ok: false, error: 'statement' };
    }

    form = declaredPower.form;
    power = declaredPower.power;
  }

  if (!Number.isFinite(power) || power < 1 || power > 10) {
    return { ok: false, error: 'power' };
  }

  return {
    ok: true,
    command: { kind: 'throw', power },
    form,
  };
}
