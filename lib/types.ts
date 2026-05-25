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

export type Board = {
  slug: string;
  name: string;
  description: string;
};

export type Post = {
  id: number;
  board_slug: string;
  nickname: string;
  title: string;
  segments: Segment[];
  created_at: number;
  comment_count?: number;
};

export type Comment = {
  id: number;
  post_id: number;
  nickname: string;
  segments: Segment[];
  created_at: number;
};
