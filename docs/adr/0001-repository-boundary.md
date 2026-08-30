# ADR 0001: 저장소 경계

- 상태: Accepted
- 날짜: 2026-08-30

## 결정

`gom-clean`은 www.gomdory.com의 검색 페이지, 교사 화면, 로그인, 과제, 장기 진도를 맡습니다. `gomdory-play`는 실제 3D 플레이와 코딩 실행을 맡습니다.

## 결과

두 저장소는 역할을 섞지 않습니다. `gom-clean`을 수정하지 않으며, 그 코드를 `gomdory-play`로 복사하지 않습니다.
