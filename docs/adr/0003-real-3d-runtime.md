# ADR 0003: 실제 3D 런타임

- 상태: Accepted
- 날짜: 2026-08-30

## 결정

실제 게임 런타임은 Three.js, React Three Fiber, Rapier를 사용합니다.

## 결과

`gom-clean`의 vendor stub이나 2D Canvas 구현을 이식하지 않습니다. 이 기반 PR에는 해당 패키지나 3D 장면을 아직 넣지 않으며, 런타임 시제품 PR에서 필요한 범위만 추가합니다.
