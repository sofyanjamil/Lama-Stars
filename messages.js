// ─── Messages: 30 messages with 5 fragments each ───
const MESSAGES = [
  // — English (1–15) —
  {
    id: 1,
    fragments: ["You are", "the warmth", "in every room", "you enter,", "ya hayati"],
    fullText: "You are the warmth in every room you enter, ya hayati",
    lang: "en"
  },
  {
    id: 2,
    fragments: ["Your heart", "is so full", "of light —", "even when", "you can't see it"],
    fullText: "Your heart is so full of light — even when you can't see it",
    lang: "en"
  },
  {
    id: 3,
    fragments: ["You don't have", "to carry", "everything alone.", "I'm right here,", "ya albi"],
    fullText: "You don't have to carry everything alone. I'm right here, ya albi",
    lang: "en"
  },
  {
    id: 4,
    fragments: ["The stars", "come out", "in the dark —", "and so does", "your strength"],
    fullText: "The stars come out in the dark — and so does your strength",
    lang: "en"
  },
  {
    id: 5,
    fragments: ["You are", "someone's", "favorite thought,", "every single day,", "ya rouhi"],
    fullText: "You are someone's favorite thought, every single day, ya rouhi",
    lang: "en"
  },
  {
    id: 6,
    fragments: ["Your softness", "is not weakness.", "It takes", "real courage", "to feel"],
    fullText: "Your softness is not weakness. It takes real courage to feel",
    lang: "en"
  },
  {
    id: 7,
    fragments: ["Joy will", "find you", "again.", "It always does,", "ya hayati"],
    fullText: "Joy will find you again. It always does, ya hayati",
    lang: "en"
  },
  {
    id: 8,
    fragments: ["You are", "not falling behind.", "You are", "on your own", "beautiful timeline"],
    fullText: "You are not falling behind. You are on your own beautiful timeline",
    lang: "en"
  },
  {
    id: 9,
    fragments: ["Even the moon", "takes time", "to become full.", "Be patient", "with yourself"],
    fullText: "Even the moon takes time to become full. Be patient with yourself",
    lang: "en"
  },
  {
    id: 10,
    fragments: ["You are", "loved in ways", "that words", "can't fully say,", "ya albi"],
    fullText: "You are loved in ways that words can't fully say, ya albi",
    lang: "en"
  },
  {
    id: 11,
    fragments: ["Let tonight", "be soft.", "You've", "more than", "earned it"],
    fullText: "Let tonight be soft. You've more than earned it",
    lang: "en"
  },
  {
    id: 12,
    fragments: ["Your laugh", "lights up", "the whole world,", "don't ever", "hold it back"],
    fullText: "Your laugh lights up the whole world, don't ever hold it back",
    lang: "en"
  },
  {
    id: 13,
    fragments: ["You've survived", "every hard day", "so far.", "That's real", "strength, ya rouhi"],
    fullText: "You've survived every hard day so far. That's real strength, ya rouhi",
    lang: "en"
  },
  {
    id: 14,
    fragments: ["The world", "is softer", "and kinder", "because you", "are in it"],
    fullText: "The world is softer and kinder because you are in it",
    lang: "en"
  },
  {
    id: 15,
    fragments: ["You are", "exactly where", "you need", "to be", "right now"],
    fullText: "You are exactly where you need to be right now",
    lang: "en"
  },

  // — Arabic (16–30) —
  {
    id: 16,
    fragments: ["\u0623\u0646\u062a\u0650 \u0646\u0648\u0631", "\u0645\u0627 \u064a\u0646\u0637\u0641\u0626", "\u062d\u062a\u0649 \u0644\u0648", "\u062d\u0633\u064a\u062a\u064a \u0628\u0627\u0644\u062a\u0639\u0628", "\u064a\u0627 \u062d\u064a\u0627\u062a\u064a"],
    fullText: "\u0623\u0646\u062a\u0650 \u0646\u0648\u0631 \u0645\u0627 \u064a\u0646\u0637\u0641\u0626 \u062d\u062a\u0649 \u0644\u0648 \u062d\u0633\u064a\u062a\u064a \u0628\u0627\u0644\u062a\u0639\u0628 \u064a\u0627 \u062d\u064a\u0627\u062a\u064a",
    lang: "ar"
  },
  {
    id: 17,
    fragments: ["\u0631\u0648\u062d\u0643 \u062d\u0644\u0648\u0629\u060c", "\u0648\u0642\u0644\u0628\u0643 \u0623\u062d\u0644\u0649\u060c", "\u0648\u0648\u062c\u0648\u062f\u0643", "\u064a\u0636\u0648\u064a", "\u0627\u0644\u062f\u0646\u064a\u0627 \u0643\u0644\u0647\u0627"],
    fullText: "\u0631\u0648\u062d\u0643 \u062d\u0644\u0648\u0629\u060c \u0648\u0642\u0644\u0628\u0643 \u0623\u062d\u0644\u0649\u060c \u0648\u0648\u062c\u0648\u062f\u0643 \u064a\u0636\u0648\u064a \u0627\u0644\u062f\u0646\u064a\u0627 \u0643\u0644\u0647\u0627",
    lang: "ar"
  },
  {
    id: 18,
    fragments: ["\u062e\u0630\u064a \u0648\u0642\u062a\u0643\u2026", "\u0645\u0627\u0641\u064a \u0623\u062d\u062f", "\u064a\u0633\u0627\u0628\u0642\u0643\u060c", "\u0623\u0646\u062a\u0650 \u0639\u0644\u0649", "\u0637\u0631\u064a\u0642\u0643 \u0627\u0644\u062e\u0627\u0635"],
    fullText: "\u062e\u0630\u064a \u0648\u0642\u062a\u0643\u2026 \u0645\u0627\u0641\u064a \u0623\u062d\u062f \u064a\u0633\u0627\u0628\u0642\u0643\u060c \u0623\u0646\u062a\u0650 \u0639\u0644\u0649 \u0637\u0631\u064a\u0642\u0643 \u0627\u0644\u062e\u0627\u0635",
    lang: "ar"
  },
  {
    id: 19,
    fragments: ["\u0643\u0644 \u064a\u0648\u0645 \u0635\u0639\u0628", "\u0639\u062f\u064a\u062a\u064a\u0647", "\u0647\u0648 \u062f\u0644\u064a\u0644", "\u0639\u0644\u0649 \u0642\u0648\u062a\u0643", "\u064a\u0627 \u0642\u0644\u0628\u064a"],
    fullText: "\u0643\u0644 \u064a\u0648\u0645 \u0635\u0639\u0628 \u0639\u062f\u064a\u062a\u064a\u0647 \u0647\u0648 \u062f\u0644\u064a\u0644 \u0639\u0644\u0649 \u0642\u0648\u062a\u0643 \u064a\u0627 \u0642\u0644\u0628\u064a",
    lang: "ar"
  },
  {
    id: 20,
    fragments: ["\u0623\u0646\u062a\u0650 \u062a\u0633\u062a\u062d\u0642\u064a\u0646", "\u062d\u0628 \u0647\u0627\u062f\u064a", "\u0648\u0644\u0637\u064a\u0641", "\u0648\u0635\u0628\u0648\u0631", "\u064a\u0627 \u0631\u0648\u062d\u064a"],
    fullText: "\u0623\u0646\u062a\u0650 \u062a\u0633\u062a\u062d\u0642\u064a\u0646 \u062d\u0628 \u0647\u0627\u062f\u064a \u0648\u0644\u0637\u064a\u0641 \u0648\u0635\u0628\u0648\u0631 \u064a\u0627 \u0631\u0648\u062d\u064a",
    lang: "ar"
  },
  {
    id: 21,
    fragments: ["\u0645\u0634\u0627\u0639\u0631\u0643 \u0645\u0647\u0645\u0629\u060c", "\u0643\u0644\u0647\u0627\u060c", "\u062d\u062a\u0649 \u0627\u0644\u0644\u064a", "\u062a\u062d\u0633\u064a\u0646\u0647\u0627", "\u062b\u0642\u064a\u0644\u0629"],
    fullText: "\u0645\u0634\u0627\u0639\u0631\u0643 \u0645\u0647\u0645\u0629\u060c \u0643\u0644\u0647\u0627\u060c \u062d\u062a\u0649 \u0627\u0644\u0644\u064a \u062a\u062d\u0633\u064a\u0646\u0647\u0627 \u062b\u0642\u064a\u0644\u0629",
    lang: "ar"
  },
  {
    id: 22,
    fragments: ["\u0627\u0644\u0631\u0627\u062d\u0629", "\u0645\u0648 \u0643\u0633\u0644\u2026", "\u0627\u0644\u0631\u0627\u062d\u0629", "\u062d\u0642 \u0645\u0646", "\u062d\u0642\u0648\u0642\u0643"],
    fullText: "\u0627\u0644\u0631\u0627\u062d\u0629 \u0645\u0648 \u0643\u0633\u0644\u2026 \u0627\u0644\u0631\u0627\u062d\u0629 \u062d\u0642 \u0645\u0646 \u062d\u0642\u0648\u0642\u0643",
    lang: "ar"
  },
  {
    id: 23,
    fragments: ["\u0623\u0646\u062a\u0650 \u0623\u062d\u0644\u0649 \u0634\u064a", "\u0635\u0627\u0631", "\u0641\u064a \u062d\u064a\u0627\u062a\u064a\u060c", "\u0648\u0623\u063a\u0644\u0649 \u0634\u064a", "\u064a\u0627 \u062d\u064a\u0627\u062a\u064a"],
    fullText: "\u0623\u0646\u062a\u0650 \u0623\u062d\u0644\u0649 \u0634\u064a \u0635\u0627\u0631 \u0641\u064a \u062d\u064a\u0627\u062a\u064a\u060c \u0648\u0623\u063a\u0644\u0649 \u0634\u064a \u064a\u0627 \u062d\u064a\u0627\u062a\u064a",
    lang: "ar"
  },
  {
    id: 24,
    fragments: ["\u062a\u0646\u0641\u0633\u064a \u0628\u0639\u0645\u0642\u2026", "\u0643\u0644 \u0634\u064a", "\u0631\u062d \u064a\u0639\u062f\u064a\u060c", "\u0648\u0623\u0646\u062a\u0650 \u0631\u062d", "\u062a\u0643\u0648\u0646\u064a\u0646 \u0628\u062e\u064a\u0631"],
    fullText: "\u062a\u0646\u0641\u0633\u064a \u0628\u0639\u0645\u0642\u2026 \u0643\u0644 \u0634\u064a \u0631\u062d \u064a\u0639\u062f\u064a\u060c \u0648\u0623\u0646\u062a\u0650 \u0631\u062d \u062a\u0643\u0648\u0646\u064a\u0646 \u0628\u062e\u064a\u0631",
    lang: "ar"
  },
  {
    id: 25,
    fragments: ["\u0636\u062d\u0643\u062a\u0643", "\u062a\u0636\u0648\u064a", "\u0639\u0627\u0644\u0645 \u0643\u0627\u0645\u0644\u060c", "\u0644\u0627 \u062a\u062e\u0628\u064a\u0647\u0627", "\u064a\u0627 \u0642\u0644\u0628\u064a"],
    fullText: "\u0636\u062d\u0643\u062a\u0643 \u062a\u0636\u0648\u064a \u0639\u0627\u0644\u0645 \u0643\u0627\u0645\u0644\u060c \u0644\u0627 \u062a\u062e\u0628\u064a\u0647\u0627 \u064a\u0627 \u0642\u0644\u0628\u064a",
    lang: "ar"
  },
  {
    id: 26,
    fragments: ["\u0627\u0644\u0641\u0631\u062d", "\u0631\u062d \u064a\u0631\u062c\u0639\u0644\u0643\u060c", "\u062f\u0627\u064a\u0645\u0627\u064b", "\u064a\u0631\u062c\u0639\u060c", "\u064a\u0627 \u0631\u0648\u062d\u064a"],
    fullText: "\u0627\u0644\u0641\u0631\u062d \u0631\u062d \u064a\u0631\u062c\u0639\u0644\u0643\u060c \u062f\u0627\u064a\u0645\u0627\u064b \u064a\u0631\u062c\u0639\u060c \u064a\u0627 \u0631\u0648\u062d\u064a",
    lang: "ar"
  },
  {
    id: 27,
    fragments: ["\u0642\u0644\u0628\u0643 \u064a\u0639\u0631\u0641", "\u0627\u0644\u0637\u0631\u064a\u0642\u060c", "\u062b\u0642\u064a \u0641\u064a\u0647\u060c", "\u0648\u062b\u0642\u064a", "\u0641\u064a \u0646\u0641\u0633\u0643"],
    fullText: "\u0642\u0644\u0628\u0643 \u064a\u0639\u0631\u0641 \u0627\u0644\u0637\u0631\u064a\u0642\u060c \u062b\u0642\u064a \u0641\u064a\u0647\u060c \u0648\u062b\u0642\u064a \u0641\u064a \u0646\u0641\u0633\u0643",
    lang: "ar"
  },
  {
    id: 28,
    fragments: ["\u0623\u0646\u062a\u0650 \u0632\u064a \u0627\u0644\u0646\u062c\u0648\u0645\u2026", "\u062a\u0636\u0648\u064a\u0646", "\u062d\u062a\u0649", "\u0641\u064a \u0627\u0644\u0638\u0644\u0627\u0645\u060c", "\u064a\u0627 \u062d\u064a\u0627\u062a\u064a"],
    fullText: "\u0623\u0646\u062a\u0650 \u0632\u064a \u0627\u0644\u0646\u062c\u0648\u0645\u2026 \u062a\u0636\u0648\u064a\u0646 \u062d\u062a\u0649 \u0641\u064a \u0627\u0644\u0638\u0644\u0627\u0645\u060c \u064a\u0627 \u062d\u064a\u0627\u062a\u064a",
    lang: "ar"
  },
  {
    id: 29,
    fragments: ["\u062e\u0644\u064a \u0627\u0644\u0644\u064a\u0644\u0629", "\u0647\u0627\u062f\u064a\u0629\u2026", "\u0623\u0646\u062a\u0650", "\u062a\u0633\u062a\u0627\u0647\u0644\u064a\u0646", "\u0627\u0644\u0633\u0644\u0627\u0645"],
    fullText: "\u062e\u0644\u064a \u0627\u0644\u0644\u064a\u0644\u0629 \u0647\u0627\u062f\u064a\u0629\u2026 \u0623\u0646\u062a\u0650 \u062a\u0633\u062a\u0627\u0647\u0644\u064a\u0646 \u0627\u0644\u0633\u0644\u0627\u0645",
    lang: "ar"
  },
  {
    id: 30,
    fragments: ["\u0646\u0627\u0645\u064a \u0628\u0633\u0644\u0627\u0645\u2026", "\u0623\u0646\u062a\u0650", "\u0645\u062d\u0628\u0648\u0628\u0629\u060c", "\u0648\u0645\u062d\u0645\u064a\u0629\u060c", "\u064a\u0627 \u0631\u0648\u062d\u064a"],
    fullText: "\u0646\u0627\u0645\u064a \u0628\u0633\u0644\u0627\u0645\u2026 \u0623\u0646\u062a\u0650 \u0645\u062d\u0628\u0648\u0628\u0629\u060c \u0648\u0645\u062d\u0645\u064a\u0629\u060c \u064a\u0627 \u0631\u0648\u062d\u064a",
    lang: "ar"
  }
];

const TROPHY_ICONS = [
  "\u2B50", "\uD83C\uDF19", "\uD83D\uDC8E", "\u2764\uFE0F", "\uD83C\uDF38",
  "\uD83D\uDC51", "\uD83D\uDD36", "\uD83E\uDD8B", "\u2600\uFE0F", "\u2601\uFE0F"
];
