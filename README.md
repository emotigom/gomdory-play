# Gomdory Play

아이들이 **3D 세계를 직접 플레이하고 코드를 바꿔 결과를 확인하는 게임 코딩 교육 프로토타입**입니다. 첫 작품은 **골목 199X — 비석치기**입니다.

학생은 제한된 JavaScript 형태의 코드를 수정하고 실행해 `power`와 `angle`이 실제 3D 물리 장면에 어떤 차이를 만드는지 확인합니다.

## 현재 구현

- React + TypeScript 기반 단일 화면 게임
- React Three Fiber + Three.js 3D 장면
- Rapier 기반 비석치기 물리 상호작용
- Acorn 기반 학생 코드 파싱 및 허용 구문 검증
- 포인터 드래그 / 키보드 조준
- WebGL 미지원 브라우저 fallback
- Vitest 기반 상태·입력·미션 로직 검증

## 학습 미션

1. **power 바꾸기** — 서로 다른 힘으로 두 번 던져 차이를 확인
2. **변수 사용하기** — `const power` 값을 바꿔 던지기
3. **더하기 식 만들기** — 표현식으로 `power >= 5` 만들기
4. **angle 바꾸기** — 각도를 높여 궤적 차이를 확인

예시:

```js
const power = 3 + 2;
biseok.throw({ power });
```

```js
biseok.throw({ power: 7, angle: 35 });
```

## 기술 스택

- React 19
- TypeScript
- Vite
- @react-three/fiber
- Three.js
- @react-three/rapier
- Acorn
- Vitest / Testing Library

## 시작하기

Node.js 24.20.0과 npm을 사용합니다.

```bash
npm ci
npm run dev
```

## 검증

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run check
```

`npm run check`는 format → lint → typecheck → test → build를 순서대로 실행합니다.

## 제품 경계

현재 저장소는 **3D 게임 코딩 학습 프로토타입**에 집중합니다.

- 로그인/사용자 계정 없음
- 클라우드 백엔드 없음
- 학생 코드 전체를 임의 실행하지 않고 허용된 던지기 구문만 파싱
- 교안·이미지·음원은 별도 라이선스를 정하기 전까지 저장소 범위에서 분리

작업 방식과 설계 결정은 [AGENTS.md](AGENTS.md), [docs/](docs/), [ADR](docs/adr/)에서 확인할 수 있습니다.

## License

코드는 [Apache-2.0](LICENSE) 라이선스를 따릅니다.
