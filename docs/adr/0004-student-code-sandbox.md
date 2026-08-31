# ADR 0004: 학생 코드 샌드박스

- 상태: Accepted
- 날짜: 2026-08-30

## 제안

학생 코드는 `eval`이나 `Function`으로 실행하지 않습니다. Acorn으로 구문을 읽고, 허용한 AST만 `ThrowCommand` IR로 변환합니다. DOM·네트워크·저장소 접근을 허용하지 않습니다.

허용하는 문장은 다음 네 AST 모양뿐이며, `power`는 유한한 1~10 사이 숫자입니다.

```js
biseok.throw({ power: 7 });

const power = 7;
biseok.throw({ power });

const power = 3 + 4;
biseok.throw({ power });

biseok.throw({ power: 7, angle: 10 });
```

두 번째와 세 번째 형식은 Program 본문 두 문장, `const` 선언 하나, 이름 `power`, 그리고 shorthand `power` 속성 하나를 정확히 요구합니다. 세 번째 형식의 초기값은 `+` 연산자와 숫자 리터럴 피연산자 둘만 가진 단일 `BinaryExpression`이어야 합니다. 컴파일러가 두 숫자를 직접 더하며 중첩 식은 허용하지 않습니다.

네 번째 `trajectory` 형식은 일반 `power`, `angle` 프로퍼티를 정확히 한 번씩 요구하고 두 프로퍼티의 순서만 바꿀 수 있습니다. 두 값은 숫자 리터럴이어야 하며 `angle`은 유한한 5~45 사이 숫자입니다. computed·shorthand·spread·method·getter·setter와 빠진 값, 중복·추가 프로퍼티는 허용하지 않습니다. 컴파일러는 허용한 AST를 직접 확인해 `angleDegrees` 선택 필드가 있는 `ThrowCommand`를 만들 뿐, 일반 객체나 수식을 평가하지 않습니다.

기존 `literal`, `variable`, `expression` 형식은 `angleDegrees`를 만들지 않습니다. 물리 계층은 `angleDegrees`가 없으면 기존 조준 벡터를 그대로 사용하고, 값이 있을 때만 코드의 각도로 높이와 수평 진행량을 나눕니다.

## 이유

학습용 명령과 게임 상태의 경계를 작게 유지해 안전한 실행 모델을 검증합니다. 덧셈만 허용하면 일반 AST 평가기 없이 피연산자 두 개를 직접 계산하면서 더하기 학습 목표를 충족할 수 있습니다. Blockly, CodeMirror, Monaco, QuickJS의 채택은 이 결정 이후 별도로 검토합니다.

## 검증 근거

- 허용 문장과 공백·줄바꿈 형식은 `ThrowCommand`로 변환한다.
- `trajectory`의 프로퍼티 순서와 `power` 1/10, `angle` 5/45 경계를 허용하고 범위 밖 값과 비유한 값은 거절한다.
- 범위 밖 수, 비유한 결과, `let`·`var`·재할당·허용하지 않은 계산식·함수·여러 선언·구조 분해·다른 변수명·추가 문장·추가 속성·computed property는 거절한다.
- `trajectory`의 빠진 값, 중복·추가 프로퍼티, shorthand·computed·spread·method·getter·setter와 숫자 리터럴이 아닌 값을 거절한다.
- 덧셈 외 연산자, 문자열·식별자·호출·unary 피연산자, 중첩 `BinaryExpression`은 거절한다.
- DOM·네트워크·저장소·`constructor` 접근, 동적 import, `eval`, `Function`은 허용 AST에 없으므로 거절한다. 입력은 256자로 제한한다.
- 동일 조준에서 더 큰 `power`는 더 큰 impulse를 만든다. 같은 `power`와 좌우 조준에서는 `angle`이 커질수록 수직 impulse가 커지고 수평 진행량이 작아진다.
