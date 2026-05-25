# 지옥도

TRPG 롤플레잉과 다이스 굴림이 가능한 게시판형 웹사이트.
Call of Cthulhu의 1d100 판정에 맞춰 다이스 시스템이 짜여 있습니다.

DB는 libSQL(Turso)을 쓰며 로컬에서는 `file:./data/jiokdo.db`로 자동 폴백합니다.

## 로컬 실행

```bash
npm install
npm run dev          # 개발
npm run build && npm run start   # 프로덕션
```

기본 포트 3000. 환경변수 없으면 로컬 SQLite 파일을 사용합니다.

## Vercel 배포

### 1) Turso 데이터베이스 만들기

[turso.tech](https://turso.tech)에 가입(GitHub 로그인 가능) → 새 DB 생성.

CLI 사용 시:
```bash
brew install tursodatabase/tap/turso     # macOS
turso auth login
turso db create jiokdo
turso db show jiokdo                     # URL 확인
turso db tokens create jiokdo            # 토큰 발급
```

웹 대시보드에서도 같은 정보를 받을 수 있습니다.

### 2) Vercel에 GitHub 레포 연결

1. [vercel.com/new](https://vercel.com/new) → GitHub 레포 import
2. Framework가 자동으로 Next.js로 잡힙니다
3. **Environment Variables**에 두 개 추가:
   - `TURSO_DATABASE_URL` = `libsql://<your-db>.turso.io`
   - `TURSO_AUTH_TOKEN` = (위에서 발급한 토큰)
4. Deploy 클릭

이후 이 브랜치에 push할 때마다 자동 재배포됩니다.

## 다이스 명령

본문이나 댓글에 한 줄 단위로 입력합니다.

- `/roll NdM[±K]` — 일반 굴림 (예: `/roll 1d100`, `/r 3d6+2`)
- `/cc [이름] 기능치` — CoC 1d100 판정 (예: `/cc 50`, `/cc 탐색 65`)

CoC 판정은 결정적 성공 / 극단적 / 어려운 / 일반 성공 / 실패 / 펌블을
자동으로 분류해 라벨로 표시합니다.

## 구조

- `app/` — Next.js App Router 페이지 + 서버 액션
- `lib/db.ts` — libSQL 클라이언트, 스키마 자동 초기화
- `lib/dice.ts` — 다이스 파서, CoC 판정 로직
- `components/` — 폼과 다이스 블록 렌더러
