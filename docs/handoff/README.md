# Handoff: 지옥도 VTT 확장 (TRPG 가상 테이블)

## Overview

기존 jiokdo는 TRPG 게시판 + 1d100 다이스 명령(`/cc`, `/roll`)이 동작하는 Next.js 사이트입니다.
이 핸드오프는 그 위에 **VTT(가상 테이블) 7화면을 신규 추가**하고, 사이트 전체의 **디자인 시스템을 paper + oxblood 톤으로 교체**하는 작업을 다룹니다.

목표: 사용자(키퍼·플레이어)가 한 곳에서 캠페인을 운영하고, 룰북을 검색하고, 캐릭터 시트와 NPC 스탯블록을 펴 보고, 시네마틱 무대에서 세션을 굴리는 통합 경험.

라이브 데모(현재 jiokdo): https://jiokdo.vercel.app/
타깃 브랜치 베이스: `claude/adoring-meitner-r4W9Q`
새로 만들 브랜치(권장): `claude/vtt-redesign`

---

## About the Design Files

`prototype/` 폴더에 들어 있는 HTML 파일들은 **순수 HTML+CSS+바닐라 JS로 만든 디자인 레퍼런스**입니다.
프로덕션 코드로 그대로 복사하지 마시고, **Next.js 14 App Router + 기존 jiokdo 패턴**으로 다시 구현해주세요.

- `prototype/index.html` — 7개 화면을 해시 라우팅(`#home`, `#rulebook`, ...)으로 전환하는 통합 데모. 각 화면 마크업이 `<script type="text/x-screen">` 안에 들어 있습니다.
- `prototype/styles.css` — **새 디자인 시스템 토큰 + 베이스 컴포넌트**. 이 파일이 `app/globals.css`를 **대체합니다**.
- `prototype/extensions.css` — 화면별 확장 스타일(위키, 시네마틱, 시트 등). 컴포넌트 단위로 분리할 때 분리 기준 참고.
- `wireframes/index.html` — 작업 의사결정의 시작점이었던 저화질 와이어프레임 35개 (참고용).

`reference/jiokdo-existing/` 에 현재 코드베이스의 핵심 파일들을 그대로 떠놓았습니다.
**새 코드는 이 패턴을 따라야 합니다:**
- 서버 컴포넌트 + `"use server"` action (`actions.ts` 참조)
- libSQL/Turso 클라이언트 (`db.ts` 참조)
- `/cc`/`/roll` 명령 파서 (`dice.ts` — **그대로 재사용**, 변경 금지)
- `<ContentRenderer segments={...} />` 로 본문 렌더링

---

## Fidelity

**Hi-fi.** 색·타이포·간격·그림자·인터랙션 모두 의도된 최종 디자인입니다.
픽셀 단위로 따라 만들되, 콘텐츠(예: "이도윤", "검은 4월", 굴림 결과 등)는 **데모용 더미**이므로 실제 DB·세션 데이터로 교체해야 합니다.

---

## 작업 순서 (권장)

1. **베이스 브랜치 생성**
   ```bash
   git checkout claude/adoring-meitner-r4W9Q
   git checkout -b claude/vtt-redesign
   ```

2. **디자인 시스템 교체** — `app/globals.css`를 prototype의 `styles.css` 내용으로 갈아 끼움.
   기존 `--accent: #cf6614`(오렌지) → `--accent: #8a1c1c`(oxblood) 등 전체 토큰 변경.
   기존 화면(`/`, `/board/[slug]`, `/post/[id]`, `/help`)이 새 톤으로 자동 적용되는지 먼저 확인하세요.

3. **공통 컴포넌트 추출** — 아래 [Components](#components) 섹션의 컴포넌트들을 `components/vtt/` 폴더에 만듭니다.

4. **DB 스키마 확장** — 아래 [Database](#database) 섹션 참고. `lib/db.ts`에 마이그레이션 추가.

5. **7개 화면 라우트** — 아래 [Screens](#screens) 순서대로 구현.

6. **PR 올리기** — 화면 단위로 커밋을 나누면 리뷰가 쉽습니다.

---

## Design Tokens

`app/globals.css` 의 `:root` 블록을 다음으로 교체합니다.

### 컬러
```css
/* 페이퍼 + 잉크 */
--bg:        #f5f3ee;  /* 본문 배경 — 종이톤 크림 */
--bg-2:      #ebe7df;  /* 한 단계 짙은 배경(테이블 헤드 등) */
--bg-elev:   #fbf9f4;  /* 카드 표면 — 본문보다 살짝 밝게 */
--bg-elev-2: #ebe7df;

--ink:       #1a1714;  /* 본문 텍스트, 보더, 검은 버튼 */
--ink-2:     #4a443c;  /* 보조 텍스트 */
--ink-3:     #7a7268;  /* 메타·라벨 */

--line:        rgba(26, 23, 20, 0.18);
--line-strong: rgba(26, 23, 20, 0.32);

/* 액센트: Call of Cthulhu oxblood */
--accent:        #8a1c1c;
--accent-hover:  #6a1414;
--accent-soft:   rgba(138, 28, 28, 0.10);

/* 다이스 결과 6단계 */
--gold:    #7a5a2a;   --gold-bg:   #fef3c7;  /* critical */
--green:   #3b6e3b;   --green-bg:  #d8ead8;  /* extreme */
--blue:    #2c466c;   --blue-bg:   #dde6f1;  /* hard */
--purple:  #5b3a78;   --purple-bg: #e6dff0;  /* regular */
--grey:    #3d3a36;   --grey-bg:   #e8e4dc;  /* fail */
--red:     #8a1c1c;   --red-bg:    rgba(138, 28, 28, 0.10); /* fumble */
```

### 타이포 (Google Fonts)
`app/layout.tsx`에 `next/font/google` 로 로드 권장:
```ts
import { Inter, IBM_Plex_Mono, Special_Elite, Caveat, Kalam, Noto_Serif_KR } from "next/font/google";
```

| 변수 | 폰트 | 용도 |
|---|---|---|
| `--font-ui` | Inter (400/500/600/700) | 본문 UI · 버튼 라벨 |
| `--font-mono` | IBM Plex Mono (400/500/600/700) | 다이스 expr, 메타·라벨, 코드, breadcrumb |
| `--font-display` | Special Elite | **모든 h1/h2 + 큰 숫자** (타이프라이터 톤) |
| `--font-anno` | Kalam (400/700) | 손글씨 메모, eyebrow, occupation |
| `--font-script` | Caveat | 더 큰 손글씨 강조 (옵션) |
| `--font-kr` | Noto Serif KR (400/500/700) | 룰북 본문 등 긴 한글 |

### 간격/모양
```css
--radius:    4px;
--radius-lg: 6px;

/* 그림자: 종이톤 — offset, ink-tinted */
--shadow-sm: 2px 2px 0 rgba(26, 23, 20, 0.06);
--shadow:    3px 3px 0 rgba(26, 23, 20, 0.08), 0 1px 2px rgba(26, 23, 20, 0.04);
--shadow-lg: 6px 6px 0 rgba(26, 23, 20, 0.10), 0 10px 30px rgba(26, 23, 20, 0.12);
```

보더는 항상 **1.5px solid** (또는 dashed). 둥근 모서리는 최소(4px).
종이 위에 도장 찍은 듯한 느낌이 핵심 — 그림자는 항상 우-하단 오프셋.

---

## Components

`components/vtt/` 에 만들 컴포넌트. 모두 서버 컴포넌트로 가능 (인터랙티브한 부분만 `"use client"`).

| 컴포넌트 | 파일 | 역할 | 사용처 |
|---|---|---|---|
| `DiceBlock` | `dice-block.tsx` | 굴림 결과 블록 (기존 `ContentRenderer`의 dice 분기 분리) | 모든 곳 |
| `Meter` | `meter.tsx` | HP/SAN/MP/Luck 바 (props: `label`, `value`, `max`, `variant`) | 시트, 시네마틱 HUD |
| `StatBlock` | `statblock.tsx` | NPC/몬스터 스탯 카드 | 04, 05 |
| `InitiativeTracker` | `initiative-tracker.tsx` | 라운드·이니셔티브 (`"use client"` — HP 편집) | 04 |
| `WikiLayout` | `wiki-layout.tsx` | 좌 사이드바 + 본문 + 우 앵커 | 02 |
| `SearchBar` | `search-bar.tsx` | 큰 검색 입력 + 결과 카운트 | 06 |
| `SearchResultGroup` | `search-result-group.tsx` | 출처별 그룹 헤더 + 결과 리스트 | 06 |
| `CampaignCard` | `campaign-card.tsx` | 보드/캠페인 카드 (기존 board-card 확장) | 01, 07 |
| `SceneStage` | `scene-stage.tsx` | 시네마틱 무대 (어두운 배경) | 05 |
| `LiveTicker` | `live-ticker.tsx` | 홈 라이브 다이스 피드 (`"use client"` — 폴링) | 01 |
| `Countdown` | `countdown.tsx` | 다음 세션까지 (`"use client"` — 매분 업데이트) | 07 |

기존 `ContentRenderer`는 그대로 유지하되, 내부에서 `DiceBlock`을 import 하도록 리팩토링.

---

## Database

기존 스키마: `boards`, `posts`, `comments`. 이건 그대로 둡니다.
다음 테이블을 `lib/db.ts`의 `ensureReady()` 마이그레이션에 추가:

```sql
CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  keeper_nickname TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',  -- active/dormant/closed
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS campaign_members (
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  role TEXT NOT NULL,                      -- keeper/player
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (campaign_id, nickname)
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  scheduled_at INTEGER,
  started_at INTEGER,
  ended_at INTEGER,
  notes_json TEXT NOT NULL DEFAULT '[]',   -- Segment[]
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS characters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
  owner_nickname TEXT NOT NULL,
  name TEXT NOT NULL,
  occupation TEXT NOT NULL DEFAULT '',
  era TEXT NOT NULL DEFAULT '',
  sheet_json TEXT NOT NULL,                 -- CharacterSheet (스키마 아래)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS statblocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  name_en TEXT,
  category TEXT NOT NULL DEFAULT 'creature', -- creature/npc/mythos
  block_json TEXT NOT NULL,                  -- StatBlock (스키마 아래)
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS clues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  resolved INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
```

`lib/types.ts` 에 추가:

```ts
export interface CharacterSheet {
  characteristics: { STR: number; CON: number; SIZ: number; DEX: number; APP: number; INT: number; POW: number; EDU: number; };
  status: { hp: { cur: number; max: number }; mp: { cur: number; max: number }; san: { cur: number; max: number }; luck: { cur: number; max: number }; };
  skills: Array<{ name: string; value: number; used?: boolean; group?: "combat" | "investigation" | "social" | "academic"; }>;
  backstory: { ideology?: string; significant_person?: string; meaningful_location?: string; treasured_possession?: string; trait?: string; };
  inventory: Array<{ name: string; qty?: string; note?: string }>;
  conditions: string[];
  portrait_url?: string;
}

export interface StatBlock {
  characteristics: Partial<Record<"STR"|"CON"|"SIZ"|"DEX"|"INT"|"POW"|"APP"|"EDU", number>>;
  hp: number;
  move?: string;       // "8/10 수영"
  armor?: number;
  san_loss?: string;   // "0/1d6"
  dodge?: number;
  fighting_back?: number;
  attacks: Array<{ name: string; pct: number; damage: string; }>;
  notes?: string;
  source?: string;     // "핸드북 p.217"
}
```

---

## Screens

### 01 — 홈/랜딩 (Live Product Peek) ─ `app/page.tsx` 교체

**경로:** `/`
**역할:** "지옥도가 뭐냐"를 5초 안에 보여주고, 보드 그리드 + 라이브 다이스 피드로 활기를 전달.

**레이아웃 (위→아래):**
1. **Hero** — `grid-template-columns: 1.05fr 0.95fr;` (모바일 1열)
   - 좌: eyebrow(손글씨 "현장 보고서 №01" 같은) + 큰 헤드라인 (Special Elite, `2.6rem`, em 부분은 `var(--accent)`) + lede + CTA 2개 + 통계 3개 (등록 탐사자/누적 굴림/이번 주 세션)
   - 우: **터미널 미리보기 창** — `border: 1.5px solid var(--ink)`, 타이프라이터 줄 패턴 배경, 안에서 무한루프로 한 세션이 진행되는 듯이 보임
     - 키퍼 묘사 → 플레이어 명령 타이핑 → `DiceBlock` 표시 → 다음 묘사…
2. **Live ticker** — 검정 헤더 "지금 굴려지는 다이스 · 펄스 dot · 오늘 N개". 새 다이스가 위에서 떨어지듯 추가 (`insertAdjacentHTML("afterbegin")`, max 5개 유지, 2.4s 간격).
3. **보드 그리드** — 기존 `listBoards()` 3개 (로비/시나리오/세션) 각 카드에:
   - 보드명 (Special Elite)
   - 설명 (Kalam 약간)
   - 통계 mono `247 글 · 1.2k 댓글`
   - **최근 1줄** (dashed 보더 위, `var(--accent)` "방금" + 손글씨 톤 인용)
   카드 클릭 → 기존 `/board/[slug]`

**서버 동작:** 라이브 ticker는 `useEffect` + `setInterval`로 `/api/recent-dice` 폴링 (2.4s).
- 새 API: `GET /api/recent-dice?limit=5` → 최근 다이스 결과 5개 (현재는 `posts.segments_json`과 `comments.segments_json`을 LIKE로 훑어도 OK; 더 잘 하려면 별도 `dice_log` 테이블)

**상태:**
- 빈 상태(굴림 0개): "아직 첫 굴림이 떨어지지 않았습니다 — `/cc 도서관 60`을 시도해보세요" Kalam 안내.
- 로딩: 카드 placeholder는 dashed 박스 (`var(--bg-elev-2)`).

**핵심 디자인 디테일:**
- Hero 배경에 `background-image: radial-gradient(...)`로 미세한 그라데이션 텍스처.
- 터미널 창 내부 줄 패턴: `repeating-linear-gradient(0deg, transparent 0 23px, rgba(26,23,20,.03) 23px 24px);`
- CTA 큰 버튼 `.btn`은 검정 채움 + `box-shadow: 2px 2px 0`. accent 변형은 oxblood 채움.

---

### 02 — 룰북 (Wiki / 검색-우선) ─ `app/rulebook/page.tsx` 신규

**경로:** `/rulebook` (모든 페이지), `/rulebook/[chapter]/[section]?` (선택 시)
**역할:** Call of Cthulhu 7판 핸드북의 규칙을 검색·앵커·인용 가능한 위키로.

**레이아웃 3열:** `grid-template-columns: 220px 1fr 210px;`
1. **좌 사이드바** (`position: sticky`)
   - 상단: 검색 박스(클릭 시 `/search?in=rulebook`)
   - 그룹: "기본" / "판정" / "기타" — `<details open>` 또는 항상 펼침
   - 활성 링크는 `border-left: 2px solid var(--accent); background: var(--accent-soft); color: var(--accent);`
2. **본문** (`.wiki-main`)
   - `padding: 2rem 2.2rem;`, `border: 1.5px solid var(--ink);` 카드
   - h1 = Special Elite `2rem`
   - subhead: §4 · 읽기 약 6분 · 자주 쓰임 (mono, dashed under)
   - 각 `.wiki-section`: dashed 보더 위, h2(Special Elite)에 `<span class="anchor">#hard-extreme</span>` + `<span class="en">Hard / Extreme Rolls</span>`
   - 본문 한글은 **Noto Serif KR**, `line-height: 1.8`
   - 표(`.wiki-table`): 헤더 row가 **검정 채움**, 본문 mono 11pt
   - 인용 콜아웃(`.wiki-callout`): oxblood-soft 배경, 좌측 3px solid accent, b 태그가 mono accent로 "키퍼 노트 ─" 강조
3. **우 사이드 (앵커)** (`position: sticky`)
   - "이 문서 안에서": 본문 `<h2>` 자동 수집 → IntersectionObserver로 현재 섹션 강조
   - "관련 명령어" — mono 코드 `/cc 기능명 60` 등
   - "관련 글" — 같은 키워드의 캠페인 글 (검색 결과 미리보기)

**콘텐츠:** 핸드북 7판은 저작권이 있으므로 **자체 정리한 룰 요약**으로 채우거나, 사용자가 직접 입력한 `wiki_pages` 테이블을 만들어 마크다운으로 저장하는 방식을 추천. (테이블 스키마는 핸드오프 범위 외)

**모바일:** 사이드바·앵커는 `<details>`로 접고, 검색 박스는 헤더에 sticky.

---

### 03 — 캐릭터 시트 (Classic 3-Column) ─ `app/character/[id]/page.tsx` 신규

**경로:** `/character/[id]`, `/character/new`
**역할:** Call of Cthulhu 1928년 모던 투자자 시트 — 특성·기능·배경·소지품을 한 화면에.

**레이아웃:**
- **헤더** (`.sheet-header`) — `background: repeating-linear-gradient(45deg, ...)` 종이 텍스처
  - 좌: 초상화 placeholder (68×84px, 1.5px solid, 우하단 그림자)
  - 중앙: H1 이름(Special Elite) + occupation(Kalam) + meta(mono: POW · EDU · SAN)
  - 우: 액션 버튼 (편집 / 세션에 연결)

- **3열 본문** (`grid-template-columns: 245px 1fr 265px;`) — 각 열은 dashed 우보더로 구분
  - **좌**: 특성 8개 (`.char-row`로 STR/CON/SIZ/DEX/APP/INT/POW/EDU) — 각 row에 키(mono 굵게 2.8rem 폭) + 값(Special Elite 1.15rem) + halves(mono "½ 22 · ⅕ 9") + 우측 `roll-btn` (mono "d100", oxblood 외곽)
    그 아래 **Meter** 4개 (HP/MP/SAN/Luck) — HP=accent, MP=blue, SAN=gold, Luck=green
    조건 pill 행 (경상/장기부상/일시 광기 — `.tag-pill`)
  - **중앙**: 기능 — 상단 카테고리 필터 chip(전부/전투/조사/사회/학문, 기존 chip 스타일 재활용)
    `.skill-list` `grid-template-columns: 1fr 1fr;` 로 2열 — 자주 쓰는 기능은 `.used` 클래스(앞에 oxblood `●`)
  - **우**: 배경 — `.note-block` (dashed 보더, Kalam 제목, Noto Serif KR 본문) ×4 (이상/의미있는 사람/소중한 장소/특성)
    그 아래 소지품 `.inv-list` (이름·수량 split, qty는 mono `<span class="qty">`)
    하단 "최근 굴림" mini `.dice-block.cc` 2개

**상호작용:**
- `roll-btn` 클릭 → POST `/api/roll` → 결과를 캐릭터의 최근 굴림 영역에 추가 + (선택) 현재 세션 채팅으로 송출. 기존 `dice.ts`의 `judgeCoc()` 사용.
- 기능 row 클릭 → 해당 기능명·값으로 `/cc` 굴림 실행.
- `편집` 버튼 → 새 페이지 `/character/[id]/edit` 또는 인라인 편집 (작은 PR로 분리 권장).

**모바일:** 3열 → 1열. col 사이는 dashed 하단 보더로 구분. 특성 8개는 `grid-template-columns: repeat(4, 1fr);` 2행으로 압축.

---

### 04 — 스탯블록 / 몬스터 (V1+V3 혼합) ─ `app/session/[id]/scene/page.tsx` (또는 `/scene/[id]`)

**경로:** `/session/[id]/scene` 또는 `/campaign/[slug]/scene/[id]`
**역할:** 세션 중 키퍼가 NPC들의 이니셔티브와 스탯을 한눈에 추적.

**레이아웃 2열:** `grid-template-columns: 1fr 1.2fr;`
- **좌 — Initiative tracker** (`.initiative`):
  - 헤더 "이니셔티브 (DEX 순) · 라운드 N" — N은 Special Elite oxblood 1.2rem
  - row 6~10개: DEX(mono, 좌 32px 폭) + 이름 + HP `mono 14/14`
  - `.active` (`background: accent-soft; border: solid accent;`) — 지금 행동 중인 행
  - `.dead` (`opacity: 0.4; text-decoration: line-through;`)
  - 하단 액션: "↺ 라운드 초기화" (ghost) / "다음 라운드 →" (검정 채움)
- **우 — StatBlock 카드** (`.statblock`):
  - 검은 헤더(3px 하단 oxblood) — 이름(Special Elite, white) + en(mono, opacity .7)
  - body 안: 6컬럼 stat-grid (STR/CON/SIZ/DEX/INT/POW) — Special Elite 1.25rem
  - 2x3 meta grid (HP/이동/장갑/SAN 손실/회피/대응) — mono
  - 공격 row (`.attack-row`) — dashed 보더, name + formula(mono) + `d100` 버튼
  - 콜아웃 "키퍼 메모 ─ …"
  - 하단 액션 chip 행 (-1d6 HP, -1d4 HP, 상태: 출혈, 상태: 기절, + NPC 복제)

**하단 — "오늘 세션의 다른 NPC"** — board-grid 패턴으로 4개 카드 (이름 / 짧은 분류 / HP·POW·회피 통계 3개)

**상호작용:**
- HP 감소 칩 → 클라이언트 상태 + DB 업데이트(낙관적 업데이트 권장)
- "다음 라운드" → 라운드 +1, active 인덱스를 다음 살아있는 NPC로
- 모든 굴림은 세션 채팅 로그(`session_log` 또는 별도 채널)로 송출

`"use client"` 필요. 서버는 초기 데이터(`getSession(id)`, `listStatblocks(campaignId)`)만 SSR.

---

### 05 — 세션 플레이 (시네마틱) ─ `app/session/[id]/page.tsx` 신규

**경로:** `/session/[id]`
**역할:** 키퍼 묘사를 무대처럼 띄우고, 플레이어는 자기 기능 칩을 눌러 굴린다. 몰입 우선.

**핵심:** 화면 거의 전부가 **검정 무대** (`#14110d`).

**레이아웃:**
- **상단** `grid-template-columns: 1fr 320px;`
  - **좌 — `.scene`** (min-height 38rem):
    - 배경: `radial-gradient` 2개 (좌상단 oxblood-15%, 우하단 gold-15%) + 45도 줄패턴
    - 상단바: 메타(`§3 부두 · 1928.11.14 · 23:48`) + 우측 "● 4명 접속 · 라운드 3" (pulse pip는 oxblood)
    - 중앙: 장면 일러스트 placeholder (16:9 dashed)
    - **묘사 박스** `.scene-narration` — 반투명 검정 + 좌측 3px oxblood. who(mono accent uppercase) + Noto Serif KR 1.02rem
    - **하단 HUD** `.scene-hud`:
      - 좌: 기능 chip 4개 (mono name + accent val)
      - 중앙: vitals (HP / SAN mono)
      - 우: "💬 말하기" 크림 채움 mono uppercase
  - **우** — 참여자 roster + 단서 list (각각 검은 헤더 + body)
- **하단 — 세션 로그** — 기존 `.post-list` 그대로 사용. 묘사/굴림/메모가 시간순으로.

**상호작용:**
- 기능 chip 클릭 → 굴림 → 결과가 묘사 박스 위에 `DiceBlock` 카드로 1.5초간 페이드인 후 묘사로 변환되거나, 채팅 로그로 추가
- "말하기" → 모달/하단 input → comment 생성 (기존 `createCommentAction` 패턴)
- 라운드/장면 이동 → URL 쿼리 `?round=3&scene=2`

**기존 `ContentRenderer`를 이 안에서도 그대로 사용**해서 묘사 + 다이스가 함께 흐르도록.

---

### 06 — 검색 결과 (출처별 그룹) ─ `app/search/page.tsx` 신규

**경로:** `/search?q=...&in=all|rulebook|campaign|sheet|note`
**역할:** 한국어로 "권총" 검색 시 영어 "handgun"·룰북·캠페인 단서·시트 항목·노트까지 종합.

**레이아웃:**
- **상단 검색 바** (`.search-bar`) — 1.5px solid ink, mono input 1.1rem, 우측 "23건" + "esc" 버튼
- **본문 2열** `grid-template-columns: 210px 1fr;`
  - **좌 — facets** (sticky):
    - "출처" 그룹: 📦 전부 / 📖 룰북 / 📚 캠페인·글 / 👤 캐릭터 시트 / 🗒 노트·단서 (각 카운트)
    - "언어": 한국어 / English
    - "기간": 전체 / 이번 주 / 이번 달
    - 활성 facet: `border-left: 2px solid accent; background: accent-soft;`
  - **우 — 결과 그룹**:
    - 각 그룹 헤더: Special Elite 1.1rem + oxblood mono 카운트 + 우측 "관련도 순" (mono dim)
    - 결과 카드(`.search-result`): hover 시 bg-elev + 보더 노출
    - **하이라이트** — query 단어는 **oxblood 채움 white 텍스트** `<mark>`로 감쌈. snippet 내부 하이라이트는 gold-bg.
    - 메타 mono: 출처 · 페이지 · 시간

**서버 동작:**
- 신규 API: `GET /api/search?q=...&in=...`
- 각 소스 검색은 LIKE 또는 FTS5(`CREATE VIRTUAL TABLE search USING fts5`)
- 결과는 `{ source, title, snippet, meta, href }[]` 형태

**모바일:** facets → 가로 chip 스크롤로 변환.

---

### 07 — 캠페인 대시보드 (V4 랜딩 + V5 상세 분리)

랜딩(`/campaigns`) — 단일 포커스 + 누적 세션 시간 표시
상세(`/campaigns/[slug]`) — Linear 스타일 표 + 활동 피드

#### 07a `/campaigns` (랜딩 · 단일 포커스)

**핵심 메트릭이 가장 큰 화면.**

- **`.dash-hero`** — 종이톤 줄 패턴 배경 + 우상단 회전 `CONFIDENTIAL · 진행 中` 배지
  - "다음 세션까지" (mono uppercase tracking .18em)
  - **카운트다운** — Special Elite **3.6rem** "`<em>3</em>` 시간 `<em>24</em>` 분" (em은 oxblood). `"use client"` 컴포넌트로 1분마다 재계산
  - 캠페인 이름 Special Elite 1.45rem
  - 키퍼 · 플레이어 N명 · 현재 시나리오 (Kalam 1rem)
  - CTA: "세션 입장" / "준비 페이지"
  - **mini-stats 4개 grid** — 각 박스 1.5px solid ink + 2px offset shadow:
    - **미해결 단서 N** (warn: oxblood)
    - 위험 PC N (SAN 30↓)
    - 지난 세션 수
    - **누적 플레이 시간** ← V5의 "현재까지의 세션 시간 기록" 요구사항

- **`.dash-history`** — "「캠페인명」 지난 세션" 표
  - row 각각: 세션 번호 mono accent #11 / 제목 / 날짜 mono / 소요시간 mono
  - 클릭 → `/session/[id]`

#### 07b `/campaigns/[slug]` (상세 · Linear 스타일)

- **`.section-head`** "모든 캠페인" + pill 그룹(활성 4 / 휴면 2 / 종료 7) + "+ 새 캠페인"
- **`.dash-table`** — Linear/Notion 표:
  - thead: 검정 채움 white mono uppercase
  - trow grid: `2fr 1fr 1.3fr 1fr 90px` — 캠페인 / 역할 / 다음 세션 / 멤버(●●●●) / 상태
  - `.c-next.urgent` = oxblood bold (오늘)
  - `.dormant` = opacity 0.55
- **`.activity-feed`** — 최근 활동 5~10개
  - grid: `80px 1fr auto` — 시간 mono / 내용(b 태그가 인물명) / where mono

**서버 동작:**
- `listCampaigns(nickname)` — 사용자가 속한 캠페인
- 누적 플레이 시간: `SUM(ended_at - started_at)` from sessions
- 활동 피드: posts/comments/dice를 시간순 union

---

## Interactions & Behavior

### 다이스 굴림 (핵심)
**절대 새로 구현하지 마세요.** `lib/dice.ts`의 `contentToSegments()`와 `judgeCoc()`를 그대로 사용.
새 화면에서 굴림이 필요할 때:
1. 본문에 `/cc 도서관 85` 형식 텍스트 삽입 → `contentToSegments()` → `Segment[]`
2. 그 결과를 적당한 곳에 저장(post/comment/session_log/character.recent_rolls)
3. UI에서 `<DiceBlock segment={...} />`로 렌더

### 결과 단계 색상 매핑 (`level.*` 클래스)
| 단계 | 클래스 | 배경/글자 |
|---|---|---|
| critical | `.critical` | gold-bg / #78350f |
| extreme  | `.extreme`  | green-bg / green |
| hard     | `.hard`     | blue-bg / blue |
| regular  | `.regular`  | purple-bg / purple |
| fail     | `.fail`     | grey-bg / grey |
| fumble   | `.fumble`   | red-bg / red |

### 애니메이션
- **펄스 dot** (live/scene): `box-shadow` 키프레임 1.5~1.8s
- **타이핑 데모**(홈): JS `setTimeout` 48±40ms per char
- **카운트다운**: 1분 단위 재계산 (`setInterval`)
- **티커**: `insertAdjacentHTML("afterbegin")` + CSS `transition` (선택, opacity 페이드인)
- 페이지 전환·hover는 모두 `transition: ... .12s` 짧고 가볍게

### 라우팅
- 기존 `Link` 패턴 유지. 외부 이동 없이 SPA-ish.
- 검색은 `useSearchParams()` + 서버 컴포넌트.

### 빈/로딩/에러 상태
모든 리스트 화면에 `.empty` 클래스(dashed 보더 + Kalam 안내문)로 처리.
로딩은 Next.js `loading.tsx`로 dashed placeholder.

---

## State Management

서버 컴포넌트 + Server Actions 우선. 클라이언트 상태는 다음에서만:

| 컴포넌트 | 상태 | 비고 |
|---|---|---|
| `LiveTicker` | 결과 배열 (최근 5) | 2.4s 폴링 또는 SSE |
| `InitiativeTracker` | 활성 인덱스, 라운드 | 낙관적 업데이트 |
| `Countdown` | 남은 시간 | 1분 setInterval |
| 시네마틱 묘사 페이드 | 표시 segment | 짧은 트랜지션 |
| 시트 인라인 편집(추후) | dirty 필드 | useState |

---

## Responsive

| 분기점 | 변화 |
|---|---|
| `≤ 980px` | wiki 3열 → 1열, 시트 3열 → 1열, scene-side 1열, dash-table 일부 컬럼 숨김 |
| `≤ 640px` | 헤더 검색 trigger 숨김, hero 헤드라인 1.85rem, countdown 2.6rem, mini-stats 2열, statblock stat-grid 3열 |

`prototype/extensions.css` 마지막 `@media` 블록에 모든 분기 정의됨 — 그대로 옮겨도 됨.

---

## Accessibility

- 모든 인터랙티브 요소(`.roll-btn`, `.skill-chip`, `.facet`)는 `<button>` 또는 `<a>`. 시각용 `<div>` 안 됨.
- 다이스 결과 단계는 색상만으로 구분되지 않도록 항상 한글 라벨 동반 ("결정적 성공" 등).
- 다크 배경 화면(시네마틱)은 텍스트 대비 WCAG AA 충족 — `#ece6d8` on `#14110d` = ~14:1 OK.
- 키보드 탐색: 위키 사이드바, facets, statblock 공격 row, character skill row 모두 tab 순서 자연스럽게.

---

## Assets

이 디자인은 **외부 이미지 자산 없이** SVG + 텍스트 + CSS 패턴으로 모든 시각 효과를 만듭니다.
- 초상화/장면 일러스트는 dashed placeholder. 실제 자료를 사용자가 업로드하기 전까지는 placeholder 유지.
- 보드/캠페인 카드의 아이콘은 emoji 사용 (📖 📚 👤 🗒 📌 ●). 추후 자체 SVG 아이콘 세트로 교체 가능.

---

## Files in this bundle

```
design_handoff_vtt/
├── README.md                          ← 이 파일
├── prototype/
│   ├── index.html                     ← 7개 화면 통합 데모 (해시 라우팅)
│   ├── styles.css                     ← 새 디자인 시스템 (= 새 globals.css)
│   └── extensions.css                 ← 화면별 확장 스타일
├── wireframes/
│   └── index.html                     ← 저화질 와이어프레임 35개 (의사결정 참고용)
└── reference/jiokdo-existing/         ← 현재 jiokdo 코드 (그대로 두고 패턴 따를 것)
    ├── globals.css                    ← 교체 대상
    ├── layout.tsx
    ├── page.tsx
    ├── board.tsx                      (app/board/[slug]/page.tsx)
    ├── post.tsx                       (app/post/[id]/page.tsx)
    ├── help.tsx
    ├── actions.ts
    ├── CommentForm.tsx
    ├── ContentRenderer.tsx
    ├── PostForm.tsx
    ├── db.ts
    └── dice.ts                        ← 절대 수정 금지
```

---

## 마지막 체크리스트

- [ ] `claude/adoring-meitner-r4W9Q`에서 `claude/vtt-redesign` 브랜치 생성
- [ ] `app/globals.css`를 `prototype/styles.css`로 교체. 기존 4개 페이지 자동 적용 확인
- [ ] `next/font/google`로 폰트 6종 추가
- [ ] DB 마이그레이션 추가 (campaigns/sessions/characters/statblocks/clues)
- [ ] `components/vtt/` 11개 컴포넌트 작성
- [ ] 7개 라우트 추가
- [ ] 헤더 nav 항목 확장: 홈 / 캠페인 / 룰북 / 도움말 + 검색 trigger
- [ ] 새 화면 모두 모바일에서 확인 (`≤ 640px`)
- [ ] WCAG AA 컬러 대비 확인 (특히 시네마틱 화면)
- [ ] PR — 화면 단위 또는 step 단위 커밋 분리

질문 있으면 디자인 파일 비교하면서 보세요. 자주 헷갈리는 건:
- 보더 두께 = **1.5px** (1px 아님)
- 그림자 = **offset 우-하단** (블러 없는 도장 느낌)
- 헤딩 = **Special Elite** (Inter 아님)
- 본문 한글(룰북) = **Noto Serif KR** (Sans 아님)
