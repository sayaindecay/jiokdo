export type DiceLevel =
  | "critical"
  | "extreme"
  | "hard"
  | "regular"
  | "fail"
  | "fumble";

export type RollResult = {
  kind: "roll";
  expression: string;
  notation: string;
  dice: number[];
  modifier: number;
  total: number;
};

export type CocResult = {
  kind: "cc";
  expression: string;
  name?: string;
  skill: number;
  roll: number;
  level: DiceLevel;
};

export type DiceResult = RollResult | CocResult;

export type Segment =
  | { type: "text"; value: string }
  | { type: "dice"; result: DiceResult };

export type CocAttrs = {
  str: number; con: number; siz: number;
  dex: number; app: number; int: number;
  pow: number; edu: number; luck: number;
};

export type CocSkillGroup = "combat" | "investigation" | "social" | "academic" | "other";
export type CocSkill = {
  name: string;
  value: number;
  used?: boolean;
  group?: CocSkillGroup;
};
export type CocWeapon = {
  name: string;
  skill: number;
  damage: string;
  range?: string;
  attacks?: string;
};

export type CampaignStatus = "active" | "dormant" | "closed";

export type Campaign = {
  id: number;
  slug: string;
  name: string;
  description: string;
  invite_code: string;
  keeper_nick: string;
  system: string;
  status: CampaignStatus;
  illustration_url: string | null;
  created_at: number;
  member_count?: number;
  character_count?: number;
};

export type CampaignMember = {
  campaign_id: number;
  nickname: string;
  role: "keeper" | "player";
  joined_at: number;
};

export type Character = {
  id: number;
  campaign_id: number;
  owner_nick: string;
  name: string;
  occupation: string;
  age: number | null;
  attrs: CocAttrs;
  hp: number; hp_max: number;
  mp: number; mp_max: number;
  san: number; san_max: number;
  skills: CocSkill[];
  weapons: CocWeapon[];
  backstory: string;
  portrait_url: string | null;
  created_at: number;
};

export type BestiaryEntry = {
  id: number;
  slug: string;
  name: string;
  category: string;
  description: string;
  attrs: Partial<CocAttrs> & { hp?: number; move?: number | string; build?: number; damage_bonus?: string };
  attacks: { name: string; skill: number; damage: string; note?: string }[];
  sanity_loss: string;
  source: string;
  image_url: string | null;
  created_by: string | null;
  created_at: number;
};

export type RuleSection = {
  id: number;
  slug: string;
  parent_slug: string | null;
  title: string;
  body: string;
  order_index: number;
};

export type PlayEntry = {
  id: number;
  campaign_id: number;
  nickname: string;
  character_id: number | null;
  character_name?: string;
  kind: "narration" | "dialogue" | "system";
  segments: Segment[];
  created_at: number;
};

export type Session = {
  id: number;
  campaign_id: number;
  number: number;
  title: string;
  scheduled_at: number | null;
  started_at: number | null;
  ended_at: number | null;
  notes_segments: Segment[];
  created_at: number;
};

export type Clue = {
  id: number;
  campaign_id: number;
  session_id: number | null;
  title: string;
  body: string;
  resolved: boolean;
  created_at: number;
};

export type ActivityItem = {
  when: number;
  who: string;
  what: string;
  where: string;
  campaign_id?: number;
};
