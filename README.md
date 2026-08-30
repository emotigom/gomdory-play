# Gomdory Play

곰돌이 플레이는 아이들이 실제 3D 세계를 플레이하고 코드를 실행해 보는 공간입니다. 첫 작품은 **골목 199X — 비석치기**입니다.

## 시작하기

이 저장소는 Node.js 24.20.0과 npm을 사용합니다. 다른 패키지 관리자는 지원하지 않습니다.

```bash
npm ci
npm run dev
```

개발 서버는 `apps/play`을 실행합니다.

## 명령

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run check
```

작업 방식과 제품의 경계는 [AGENTS.md](AGENTS.md), [문서](docs/), [ADR](docs/adr/)에서 확인할 수 있습니다.

## 범위

이 PR은 React 개발 기반과 저장소 계약만 다룹니다. 아직 3D 런타임, 게임 규칙, 에셋, 로그인, 클라우드 인프라는 넣지 않았습니다.

코드는 Apache-2.0 라이선스를 따릅니다. 교안·이미지·음원은 별도 라이선스를 정하기 전까지 이 저장소에 추가하지 않습니다.
