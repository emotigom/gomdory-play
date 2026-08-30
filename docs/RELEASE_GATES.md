# 출시 게이트

PR을 열기 전에 다음을 모두 통과해야 합니다.

- `npm ci`
- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run check`
- `git diff --check`

제품 기능 PR은 이 목록에 더해 해당 변경의 관찰 가능한 동작, 접근성·성능 영향, 보안 경계를 검토합니다. 배포와 production secret은 PR 워크플로에서 사용하지 않습니다.
