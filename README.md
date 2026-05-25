# 지옥도

TRPG 롤플레잉과 다이스 굴림이 가능한 게시판형 웹사이트.
Call of Cthulhu의 1d100 판정에 맞춰 다이스 시스템이 짜여 있습니다.

## 실행

```bash
npm install
npm run dev          # 개발
npm run build && npm run start   # 프로덕션
```

기본 포트 3000. SQLite 파일은 `data/jiokdo.db`에 자동 생성됩니다.

## 다이스 명령

본문이나 댓글에 한 줄 단위로 입력합니다.

- `/roll NdM[±K]` — 일반 굴림 (예: `/roll 1d100`, `/r 3d6+2`)
- `/cc [이름] 기능치` — CoC 1d100 판정 (예: `/cc 50`, `/cc 탐색 65`)

CoC 판정은 결정적 성공 / 극단적 / 어려운 / 일반 성공 / 실패 / 펌블을
자동으로 분류해 라벨로 표시합니다.

## 구조

- `app/` — Next.js App Router 페이지
- `lib/db.ts` — SQLite 초기화 + 게시판/글/댓글 쿼리
- `lib/dice.ts` — 다이스 파서, CoC 판정 로직
- `components/` — 폼과 다이스 블록 렌더러
