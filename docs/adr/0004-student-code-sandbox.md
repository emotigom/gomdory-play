# ADR 0004: 학생 코드 샌드박스

- 상태: Accepted
- 날짜: 2026-08-30

## 제안

학생 코드는 `eval`이나 `Function`으로 실행하지 않습니다. Acorn으로 구문을 읽고, 허용한 AST만 `ThrowCommand` IR로 변환합니다. DOM·네트워크·저장소 접근을 허용하지 않습니다.

현재 허용하는 문장은 `biseok.throw({ power: 숫자 });` 하나이며, `power`는 유한한 1~10 사이 숫자입니다. 변환된 값만 Rapier의 던지기 impulse에 전달합니다.

## 이유

학습용 명령과 게임 상태의 경계를 작게 유지해 안전한 실행 모델을 검증합니다. Blockly, CodeMirror, Monaco, QuickJS의 채택은 이 결정 이후 별도로 검토합니다.

## 검증 근거

- 허용 문장과 공백·줄바꿈 형식은 `ThrowCommand`로 변환한다.
- 범위 밖 수, 비유한 수 표현, 추가 문장과 계산식·접근 시도는 거절한다.
- 동일 조준에서 더 큰 `power`는 더 큰 impulse를 만든다.
