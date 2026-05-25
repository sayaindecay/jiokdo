import type { BestiaryEntry, RuleSection } from "./types";

export const RULE_SECTIONS: Omit<RuleSection, "id">[] = [
  {
    slug: "intro",
    parent_slug: null,
    order_index: 0,
    title: "들어가며",
    body: `Call of Cthulhu는 1920년대 미국을 주된 무대로 하는 코즈믹 호러 TRPG입니다. 플레이어는 평범한 시민, 곧 **탐사자(Investigator)** 가 되어 인류의 이해 너머에 도사린 진실을 조금씩 들춰냅니다. 살아남을 수도, 미쳐버릴 수도 있습니다.

지옥도(Jiokdo)는 이 시스템을 위한 **비동기 굴림판 + 가상 테이블탑(VTT)** 입니다. 캠페인을 만들고 플레이어를 초대 코드로 받은 다음, 글로 진행하면서 본문에 명령어를 끼워 굴리세요. 한 번 굴린 결과는 영원히 보존됩니다.`,
  },
  {
    slug: "checks",
    parent_slug: null,
    order_index: 1,
    title: "기능 판정",
    body: `대부분의 판정은 **1d100 ≤ 기능치** 로 결정됩니다.

명령: \`/cc [이름] 기능치\`

| 결과 | 조건 |
|---|---|
| 결정적 성공 | 굴림 = 1 |
| 극단적 성공 | 굴림 ≤ ⌊기능치/5⌋ |
| 어려운 성공 | 굴림 ≤ ⌊기능치/2⌋ |
| 일반 성공 | 굴림 ≤ 기능치 |
| 실패 | 굴림 > 기능치 |
| 펌블 | 기능치<50: 96–100 / 기능치≥50: 100 |

키퍼가 "어려운 판정"을 요구하면 굴림이 ⌊기능치/2⌋ 이하여야 성공입니다. 시스템은 단계만 알려주고, 채택 여부는 키퍼가 결정합니다.`,
  },
  {
    slug: "combat",
    parent_slug: null,
    order_index: 2,
    title: "전투",
    body: `전투는 DEX 순서로 라운드를 돕니다. 각 라운드마다 한 번의 행동을 선택합니다.

**근접 전투**: 공격자가 무기 기능 판정, 방어자는 회피(Dodge) 또는 받아치기(Fighting) 판정. 더 높은 단계로 성공한 쪽이 이깁니다(승급 우선).

**총기**: 공격자만 굴립니다. 사거리 안이면 일반 성공으로 명중. 어려운 거리는 어려운 성공 필요.

**피해**: 무기의 데미지 다이스 + 데미지 보너스. 극단적 성공은 최대치 또는 추가 굴림(시스템마다).`,
  },
  {
    slug: "sanity",
    parent_slug: null,
    order_index: 3,
    title: "이성(SAN)",
    body: `초자연적이거나 끔찍한 것을 마주하면 **이성 판정**을 합니다. \`/cc 이성 <현재SAN>\`.

성공 시 표기된 SAN 감소량의 **최소치**(예: 1/1d6 → 1), 실패 시 **최대치**를 굴립니다.

한 번에 5포인트 이상 잃으면 **일시적 광기**, 단기간에 SAN의 20% 이상을 잃으면 **부정기적 광기**로 빠집니다.`,
  },
  {
    slug: "character-creation",
    parent_slug: null,
    order_index: 4,
    title: "캐릭터 생성",
    body: `1. **능력치 굴림**: STR/CON/DEX/APP/POW × 3d6×5, SIZ/INT/EDU × (2d6+6)×5
2. **파생 능력치**: HP=(SIZ+CON)/10, MP=POW/5, 시작 SAN=POW
3. **직업 선택**: 직업 기능 8종에 EDU×4 분배, 흥미 기능에 INT×2 분배
4. **나이/외모/배경**: 자유 기술

지옥도에서는 \`/캐릭터\` 메뉴에서 시트를 만들면 굴림 시 자동으로 능력치/기능치를 인용할 수 있습니다.`,
  },
];

export const BESTIARY: Omit<BestiaryEntry, "id">[] = [
  {
    slug: "deep-one",
    name: "딥 원 (Deep One)",
    category: "독립 종족 / 미고스의 친척",
    description: "물고기와 양서류, 인간이 뒤섞인 키 큰 인간형 종족. 인스머스의 해저 도시 Y'ha-nthlei에 거주하며 다곤과 히드라를 숭배한다. 인간과 교배하여 처음에는 인간으로 보이다가 점차 본모습으로 변해가는 잡종을 만든다.",
    attrs: {
      str: 85, con: 80, siz: 75,
      dex: 60, int: 60, pow: 50,
      hp: 15, move: 8, build: 1,
    },
    attacks: [
      { name: "발톱 (Claw)", skill: 25, damage: "1d6 + 데미지 보너스" },
      { name: "물기 (Bite)", skill: 30, damage: "1d4 + 데미지 보너스" },
    ],
    sanity_loss: "0/1d6",
    source: "코어 룰북",
  },
  {
    slug: "byakhee",
    name: "비야키 (Byakhee)",
    category: "하스터의 사역수",
    description: "박쥐의 날개와 까마귀의 머리를 한 비행 괴물. 별 사이를 자유로이 날아다닌다. 황금 꿀(Space Mead)를 마시면 사람도 등에 태우고 우주를 횡단할 수 있다.",
    attrs: {
      str: 75, con: 65, siz: 70,
      dex: 75, int: 50, pow: 65,
      hp: 13, move: 5,
    },
    attacks: [
      { name: "할퀴기와 물기", skill: 50, damage: "1d6 + 데미지 보너스" },
      { name: "피 빨기 (붙은 후)", skill: 0, damage: "1d6 STR / 라운드", note: "물기 성공 후 자동" },
    ],
    sanity_loss: "1/1d6",
    source: "코어 룰북",
  },
  {
    slug: "mi-go",
    name: "미고 (Mi-go)",
    category: "유고스의 균류",
    description: "유고스(명왕성)에서 온 갑각류와 균류의 잡종. 분홍빛 몸체에 박쥐 같은 날개. 인간의 뇌를 원통에 담아 우주를 횡단시키는 기술을 가졌다. 외계 광물 채굴이 목적.",
    attrs: {
      str: 50, con: 65, siz: 55,
      dex: 65, int: 85, pow: 75,
      hp: 12, move: 7, build: 0,
    },
    attacks: [
      { name: "발톱", skill: 40, damage: "1d6" },
      { name: "외과 무기", skill: 50, damage: "1d8" },
    ],
    sanity_loss: "0/1d6",
    source: "코어 룰북",
  },
  {
    slug: "hound-of-tindalos",
    name: "틴달로스의 사냥개 (Hound of Tindalos)",
    category: "외계 생물",
    description: "시간의 \"각진\" 부분을 통해 이동하는 비뚤어진 생명체. 시간 여행이나 약물 등으로 시간의 곡선을 거스르는 자를 영원히 추적한다. 어떤 모서리에서든 응결되어 나타난다.",
    attrs: {
      str: 65, con: 75, siz: 50,
      dex: 90, int: 70, pow: 80,
      hp: 12, move: 9,
    },
    attacks: [
      { name: "혀와 발톱", skill: 50, damage: "2d6 + 1d6 출혈" },
    ],
    sanity_loss: "1d3/1d20",
    source: "코어 룰북",
  },
  {
    slug: "shoggoth",
    name: "쇼고스 (Shoggoth)",
    category: "고대 종족의 노예 → 자율 생물",
    description: "수많은 눈과 입이 솟아오르고 사라지는 거대한 검은 원형질. 본디 고대 종족이 만든 도구였으나 반란을 일으켜 일부는 자아를 얻었다. \"테켈리-리!\" 라는 외침으로 알려져 있다.",
    attrs: {
      str: 200, con: 90, siz: 200,
      dex: 30, int: 30, pow: 75,
      hp: 29, move: 8, damage_bonus: "+6d6",
    },
    attacks: [
      { name: "강타 (Crush)", skill: 60, damage: "데미지 보너스만" },
      { name: "감싸기 (Engulf)", skill: 60, damage: "감싼 후 1d10 + 산성/라운드" },
    ],
    sanity_loss: "1d6/1d20",
    source: "코어 룰북",
  },
];

export const SAMPLE_CHARACTER_TEMPLATE = {
  name: "허버트 웨스트",
  occupation: "의대생",
  age: 23,
  attrs: { str: 50, con: 60, siz: 55, dex: 70, app: 55, int: 85, pow: 70, edu: 80, luck: 60 },
  hp: 11, hp_max: 11,
  mp: 14, mp_max: 14,
  san: 70, san_max: 99,
  skills: [
    { name: "의학", value: 70, group: "academic", used: true },
    { name: "약학", value: 60, group: "academic", used: true },
    { name: "응급처치", value: 55, group: "academic" },
    { name: "도서관 이용", value: 65, group: "investigation", used: true },
    { name: "심리학", value: 50, group: "social" },
    { name: "오컬트", value: 30, group: "academic" },
    { name: "탐색", value: 50, group: "investigation" },
    { name: "은밀행동", value: 30, group: "investigation" },
    { name: "회피", value: 35, group: "combat" },
    { name: "권총", value: 25, group: "combat" },
  ],
  weapons: [
    { name: "주먹", skill: 50, damage: "1d3 + 데미지 보너스" },
    { name: "수술용 메스", skill: 25, damage: "1d4" },
  ],
  backstory: "재학 중인 미스캐토닉 대학 의대생. 죽음을 되돌리는 시약을 비밀리에 연구한다. 친구들 사이에서 점점 평판이 나빠지고 있다.",
};
