export const EMOTION_IDS = [
  "joy",
  "excitement",
  "surprise",
  "sadness",
  "anger",
  "fear",
  "disgust",
  "confusion",
  "neutral",
  "ambiguous",
] as const;

export type EmotionId = (typeof EMOTION_IDS)[number];

export interface EmotionDefinition {
  id: EmotionId;
  labelZh: string;
  description: string;
}

export const EMOTIONS: EmotionDefinition[] = [
  {
    id: "joy",
    labelZh: "开心",
    description: "Happy, pleased, warm, amused, or positive enjoyment",
  },
  {
    id: "excitement",
    labelZh: "兴奋",
    description: "Enthusiastic, eager, thrilled, or high-energy delight",
  },
  {
    id: "surprise",
    labelZh: "惊讶",
    description: "Astonished, startled, or amazed",
  },
  {
    id: "sadness",
    labelZh: "难过",
    description: "Sad, sorrowful, disappointed, or grieving",
  },
  {
    id: "anger",
    labelZh: "生气",
    description: "Angry, annoyed, frustrated, or hostile",
  },
  {
    id: "fear",
    labelZh: "害怕",
    description: "Afraid, anxious, worried, or terrified",
  },
  {
    id: "disgust",
    labelZh: "厌恶",
    description: "Revolted, grossed out, or contemptuous",
  },
  {
    id: "confusion",
    labelZh: "困惑",
    description: "Puzzled, uncertain, or bewildered",
  },
  {
    id: "neutral",
    labelZh: "平淡/严肃",
    description: "Plain, serious, factual, calm, or no clear emotional color",
  },
  {
    id: "ambiguous",
    labelZh: "无法判断",
    description: "Emotional signal too weak, mixed, or unreadable",
  },
];

export const EMOTION_BY_ID = Object.fromEntries(
  EMOTIONS.map((emotion) => [emotion.id, emotion]),
) as Record<EmotionId, EmotionDefinition>;

export const EMOTION_INSTRUCTIONS = {
  question: "What is the dominant emotion expressed by `current`?",
  language:
    "The subtitle may be in Chinese, English, or mixed Chinese-English. Judge by meaning, not by language.",
  context:
    "Use `previous` and `next` only as conversational context. Classify `current`, not the surrounding lines.",
  literal_meaning:
    "Classify the speaker's emotional stance, not the dictionary meaning of an isolated word.",
  boundaries:
    "Use each option's definition, include, exclude, and examples. Exclusions are strict: if the line matches an exclusion, do not choose that option.",
  humor:
    "Do not choose a humor or amusement category merely because the line contains 可笑, 好笑, 笑话, or 哈哈. Choose it only when the line actually expresses amusement or a joke. If 可笑 means ridiculous, absurd, contemptible, or mocking, classify the underlying emotion or choose the uncertainty category.",
  neutral:
    "Choose neutral when the line is plain, serious, factual, calm, or has no clear emotional color.",
  ambiguous:
    "Choose the uncertainty category when the emotional signal is too weak, mixed, unreadable, or lacks enough context.",
};

export const EMOTION_CRITERIA = Object.fromEntries(
  EMOTIONS.map((emotion) => [emotion.id, emotion.description]),
) as Record<EmotionId, string>;

export const SHOULD_ADD_EMOJI_INSTRUCTIONS = {
  question: "Should an emoji be appended to `current`?",
  context:
    "Use `previous` and `next` only as conversational context. Judge whether an emoji would fit the current subtitle itself.",
  guidance:
    "Choose yes only when an emoji would feel natural and improve the subtitle. Choose no for serious, factual, sensitive, or ambiguous lines.",
};

export const SHOULD_ADD_EMOJI_CRITERIA = {
  true: "An emoji would fit naturally and improve the subtitle.",
  false: "An emoji would feel distracting, inappropriate, or uncertain.",
};
