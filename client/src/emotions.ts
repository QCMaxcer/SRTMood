import type { EmotionDefinition } from "./types";

export const PRESET_EMOTION_COLORS = [
  "#F59E0B",
  "#F97316",
  "#EC4899",
  "#3B82F6",
  "#EF4444",
  "#8B5CF6",
  "#84CC16",
  "#14B8A6",
  "#64748B",
  "#94A3B8",
];

export interface EmotionBoundary {
  definition: string;
  includes: string[];
  excludes: string[];
  examples: string[];
}

function boundary(
  definition: string,
  includes: string[] = [],
  excludes: string[] = [],
  examples: string[] = [],
): EmotionBoundary {
  return { definition, includes, excludes, examples };
}

export const LABEL_BOUNDARY_PRESETS: Record<string, EmotionBoundary> = {
  "开心/窃喜": boundary(
    "开心、愉快、窃喜、暗自得意或轻松满足。",
    ["高兴、满意、暗自开心", "小得意或偷偷高兴"],
    ["明显大笑或开玩笑", "讽刺、嘲笑", "只是礼貌性回应"],
    ["太好了！", "嘿嘿，没想到吧"],
  ),
  开心: boundary(
    "真正开心、愉快、满足、温暖或轻松享受。",
    ["笑、高兴、满意、期待", "真诚的积极情绪"],
    ["讽刺性夸奖", "勉强或礼貌性回应", "嘲笑、轻蔑、荒谬感"],
    ["太好了！", "哈哈，我真的太开心了"],
  ),
 兴奋: boundary(
    "强烈期待、激动、跃跃欲试或高能量喜悦。",
    ["期待、激动、迫不及待", "兴奋到想立刻行动"],
    ["单纯开心", "害怕或紧张", "冷静陈述事实"],
    ["我迫不及待要开始了！", "终于等到了！"],
  ),
  惊讶: boundary(
    "因为意外、突发或不符合预期而感到吃惊。",
    ["出乎意料、震惊、没想到", "突然的变故"],
    ["已经预料到的结果", "单纯的开心或难过"],
    ["啊？真的假的？", "没想到会是这样"],
  ),
  难过: boundary(
    "悲伤、失落、失望、心痛或情绪低落。",
    ["哭泣、失落、遗憾、被伤害", "情绪明显下沉"],
    ["生气或抱怨", "平静地陈述客观损失"],
    ["我真的很失望", "心里好难受"],
  ),
  生气: boundary(
    "愤怒、不满、被冒犯、讽刺性指责或强烈敌意。",
    ["愤怒、恼火、被激怒", "质问、指责、讽刺性攻击"],
    ["只是客观指出问题", "真正觉得好笑或轻松"],
    ["你太过分了", "这简直让人火大"],
  ),
  害怕: boundary(
    "害怕、焦虑、担心、紧张或感到危险。",
    ["恐惧、担忧、紧张、不安", "面临威胁或不确定风险"],
    ["普通的惊讶", "冷静的风险说明"],
    ["我有点害怕", "万一出事怎么办"],
  ),
  厌恶: boundary(
    "反感、恶心、鄙视、轻蔑或强烈排斥。",
    ["恶心、反感、看不起", "对人或行为感到排斥"],
    ["单纯生气", "客观描述不喜欢的事物"],
    ["太恶心了", "我真受不了这种做法"],
  ),
  困惑: boundary(
    "不理解、想不通、混乱、疑惑或不知道发生了什么。",
    ["疑问、迷惑、想不通", "信息矛盾或逻辑不清"],
    ["已经明白但觉得荒谬", "单纯的惊讶"],
    ["这到底是什么意思？", "我怎么想不通"],
  ),
  "平淡/严肃": boundary(
    "平铺直叙、严肃、事实陈述、冷静或没有明显情绪色彩。",
    ["信息说明、客观描述、严肃叙述", "情绪信号很弱"],
    ["明显的喜怒哀乐", "带有强烈讽刺或攻击性"],
    ["时间是下午三点", "他走进了房间"],
  ),
  平淡: boundary(
    "平铺直叙、冷静、客观陈述，没有明显情绪色彩。",
    ["信息说明、普通叙述、日常描述"],
    ["明显的喜怒哀乐", "讽刺、攻击或强烈评价"],
    ["时间是下午三点", "他走进了房间"],
  ),
  无法判断: boundary(
    "情绪信号太弱、混在一起、缺少上下文，或只有孤立的评价词。",
    ["无法确定说话人的情绪立场", "多个情绪互相冲突"],
    ["有明确、单一的主导情绪", "上下文已经足够支撑判断"],
    ["……", "可笑的"],
  ),
  "搞笑/有趣": boundary(
    "真正觉得好笑、幽默、轻松、俏皮或有趣。",
    ["笑话、梗、轻松调侃", "说话人确实在表达 amusement"],
    ["讽刺、嘲笑、轻蔑、荒谬、离谱、尴尬、无奈"],
    ["这个笑话真好笑", "哈哈哈哈哈太搞笑了"],
  ),
  可笑的: boundary(
    "仅在明确的幽默、玩笑或轻松语境中，表示真正觉得好笑或有趣。",
    ["笑话、梗、轻松的玩笑", "说话人确实在表达 amusement"],
    ["讽刺、嘲笑、轻蔑、荒谬、离谱、无语、尴尬"],
    ["这个笑话真好笑", "哈哈哈哈哈太搞笑了"],
  ),
  "伤心/难受/失落": boundary(
    "悲伤、心里难受、失落、遗憾或情绪明显下沉。",
    ["失落、难受、遗憾、被伤害", "情绪低落的表达"],
    ["生气、讽刺、单纯陈述事实"],
    ["我真的很失望", "心里好难受"],
  ),
  疑惑: boundary(
    "不理解、想不通、觉得不对劲或无法确认。",
    ["疑问、迷惑、想不通", "信息不足或互相矛盾"],
    ["已经明白但觉得荒谬", "单纯的惊讶"],
    ["这到底是什么意思？", "我怎么想不通"],
  ),
  紧迫: boundary(
    "时间压力、危机感、必须立刻行动或强烈的急迫感。",
    ["来不及了、快点、危险迫近", "明显的时间或生存压力"],
    ["只是普通的期待", "平静地说明计划"],
    ["快点，来不及了！", "我们必须马上行动"],
  ),
  自信: boundary(
    "确定、笃定、胸有成竹或有掌控感。",
    ["确信、笃定、我能做到", "冷静而坚定的判断"],
    ["自嘲", "害怕或不确定"],
    ["交给我吧", "我确定可以做到"],
  ),
  思考: boundary(
    "正在推理、分析、回忆或权衡，不一定带有情绪。",
    ["分析、判断、回忆、权衡", "认知活动本身"],
    ["明确的喜怒哀乐", "紧迫的压力感"],
    ["让我想一想", "这件事还要再分析"],
  ),
};

function createEmotion(
  seed: {
    id: string;
    label: string;
    color: string;
    emojis: string[];
    addEmoji: boolean;
  } & Partial<EmotionBoundary>,
): EmotionDefinition {
  const preset = LABEL_BOUNDARY_PRESETS[seed.label];
  return {
    ...seed,
    definition: seed.definition ?? preset?.definition ?? "",
    includes: seed.includes ?? preset?.includes ?? [],
    excludes: seed.excludes ?? preset?.excludes ?? [],
    examples: seed.examples ?? preset?.examples ?? [],
  };
}

export const DEFAULT_EMOTIONS: EmotionDefinition[] = [
  createEmotion({
    id: "happy_sneaky",
    label: "开心/窃喜",
    color: "#F59E0B",
    emojis: ["🙂", "😋"],
    addEmoji: true,
  }),
  createEmotion({
    id: "laughable",
    label: "可笑的",
    color: "#F97316",
    emojis: ["🤣"],
    addEmoji: true,
  }),
  createEmotion({
    id: "surprise",
    label: "惊讶",
    color: "#EC4899",
    emojis: ["😲"],
    addEmoji: true,
  }),
  createEmotion({
    id: "sadness",
    label: "伤心/难受/失落",
    color: "#3B82F6",
    emojis: ["😥"],
    addEmoji: true,
  }),
  createEmotion({
    id: "anger",
    label: "生气",
    color: "#EF4444",
    emojis: ["😠"],
    addEmoji: true,
  }),
  createEmotion({
    id: "fear",
    label: "害怕",
    color: "#8B5CF6",
    emojis: ["😨"],
    addEmoji: true,
  }),
  createEmotion({
    id: "confusion",
    label: "疑惑",
    color: "#84CC16",
    emojis: ["😕"],
    addEmoji: true,
  }),
  createEmotion({
    id: "confidence",
    label: "自信",
    color: "#14B8A6",
    emojis: ["😎", "✨"],
    addEmoji: true,
  }),
  createEmotion({
    id: "thinking",
    label: "思考",
    color: "#F97316",
    emojis: ["🤔"],
    addEmoji: true,
  }),
  createEmotion({
    id: "urgency",
    label: "紧迫",
    color: "#64748B",
    emojis: ["💀"],
    addEmoji: false,
  }),
  createEmotion({
    id: "neutral",
    label: "平淡",
    color: "#94A3B8",
    emojis: [],
    addEmoji: false,
  }),
  createEmotion({
    id: "ambiguous",
    label: "无法判断",
    color: "#64748B",
    emojis: [],
    addEmoji: false,
    examples: [],
  }),
];

const STORAGE_KEY = "srtmood.emotions.v1";

function normalizeList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeEmotion(
  value: unknown,
  index: number,
): EmotionDefinition | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const emotion = value as Record<string, unknown>;
  if (
    typeof emotion.id !== "string" ||
    typeof emotion.label !== "string"
  ) {
    return null;
  }

  let emojis: string[];
  if (Array.isArray(emotion.emojis)) {
    emojis = emotion.emojis.filter(
      (item): item is string => typeof item === "string",
    );
  } else if (typeof emotion.emoji === "string") {
    emojis = emotion.emoji ? [emotion.emoji] : [];
  } else {
    emojis = [];
  }

  let addEmoji: boolean;
  if (typeof emotion.addEmoji === "boolean") {
    addEmoji = emotion.addEmoji;
  } else if (typeof emotion.noEmoji === "boolean") {
    addEmoji = !emotion.noEmoji;
  } else {
    addEmoji = true;
  }

  const color =
    typeof emotion.color === "string" &&
    /^#[0-9a-f]{6}$/i.test(emotion.color)
      ? emotion.color.toUpperCase()
      : PRESET_EMOTION_COLORS[index % PRESET_EMOTION_COLORS.length];
  const preset = LABEL_BOUNDARY_PRESETS[emotion.label];

  return {
    id: emotion.id,
    label: emotion.label,
    color,
    emojis,
    addEmoji,
    definition:
      typeof emotion.definition === "string" &&
      emotion.definition.trim().length > 0
        ? emotion.definition
        : preset?.definition ?? "",
    includes:
      normalizeList(emotion.includes).length > 0
        ? normalizeList(emotion.includes)
        : preset?.includes ?? [],
    excludes:
      normalizeList(emotion.excludes).length > 0
        ? normalizeList(emotion.excludes)
        : preset?.excludes ?? [],
    examples:
      normalizeList(emotion.examples).length > 0
        ? normalizeList(emotion.examples)
        : preset?.examples ?? [],
  };
}

export function loadEmotions(): EmotionDefinition[] {
  if (typeof window === "undefined") {
    return DEFAULT_EMOTIONS;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_EMOTIONS;
    }

    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) {
      return DEFAULT_EMOTIONS;
    }

    const valid = parsed
      .map((value, index) => normalizeEmotion(value, index))
      .filter((emotion): emotion is EmotionDefinition => emotion !== null);
    return valid.length > 0 ? valid : DEFAULT_EMOTIONS;
  } catch {
    return DEFAULT_EMOTIONS;
  }
}

export function saveEmotions(emotions: EmotionDefinition[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(emotions));
}

export function createEmotionId(): string {
  return `custom-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function parseLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function swapEmotions(
  emotions: EmotionDefinition[],
  sourceId: string,
  targetId: string,
): EmotionDefinition[] {
  const sourceIndex = emotions.findIndex(
    (emotion) => emotion.id === sourceId,
  );
  const targetIndex = emotions.findIndex(
    (emotion) => emotion.id === targetId,
  );

  if (
    sourceIndex < 0 ||
    targetIndex < 0 ||
    sourceIndex === targetIndex
  ) {
    return emotions;
  }

  const next = [...emotions];
  [next[sourceIndex], next[targetIndex]] = [
    next[targetIndex],
    next[sourceIndex],
  ];
  return next;
}
