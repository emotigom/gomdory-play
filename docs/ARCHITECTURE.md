# 아키텍처

## 현재

`apps/play`은 Vite, React, TypeScript로 만든 단일 웹 앱입니다. 아직 런타임·월드·에셋 계층은 만들지 않았습니다.

## 앞으로의 경계

- 실제 3D 런타임은 Three.js, React Three Fiber, Rapier를 사용합니다. 2D Canvas 대체 구현이나 vendor stub을 옮기지 않습니다.
- 실시간 플레이는 별도 Cloudflare Worker와 GameRoom Durable Object에서 다룹니다. 방 하나는 Durable Object 하나에 대응합니다.
- Supabase는 계정·과제·진도에만 사용합니다. 프레임 단위 게임 좌표를 중계하지 않습니다.
- R2는 3D 모델·음원·월드 패키지를 보관하는 용도입니다.

자세한 결정은 [ADR](adr/)을 따릅니다.
