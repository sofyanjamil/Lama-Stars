// ─── Messages: 52 English messages with 5 fragments each ───
const MESSAGES = [
  // — Existing (updated) —
  {
    id: 1,
    fragments: ["You are", "the warmth", "in every room", "you enter"],
    fullText: "You are the warmth in every room you enter",
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
    fragments: ["You don't have", "to carry", "everything alone.", "I'm right here"],
    fullText: "You don't have to carry everything alone. I'm right here",
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
    fragments: ["You are", "one of", "my favorite thoughts,", "every", "single day"],
    fullText: "You are one of my favorite thoughts, every single day",
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
    fragments: ["Joy will", "find you", "again.", "It always", "does"],
    fullText: "Joy will find you again. It always does",
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
    fragments: ["You are", "loved in ways", "that words", "can't fully", "say"],
    fullText: "You are loved in ways that words can't fully say",
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
    fragments: ["Your laugh", "lights up me,", "don't", "hold it", "back"],
    fullText: "Your laugh lights up me, don't hold it back",
    lang: "en"
  },
  {
    id: 13,
    fragments: ["You've survived", "every hard day", "so far.", "That's", "real strength"],
    fullText: "You've survived every hard day so far. That's real strength",
    lang: "en"
  },
  {
    id: 14,
    fragments: ["You are", "exactly where", "you need", "to be", "right now"],
    fullText: "You are exactly where you need to be right now",
    lang: "en"
  },

  // — Strength & Reassurance —
  {
    id: 31,
    fragments: ["You have survived", "every day", "your overthinking", "tried to break you —", "and you're still here, still soft, still beautiful"],
    fullText: "You have survived every day your overthinking tried to break you — and you're still here, still soft, still beautiful",
    lang: "en"
  },
  {
    id: 32,
    fragments: ["The world", "doesn't get to decide", "how strong", "you are —", "you already proved that a hundred times over"],
    fullText: "The world doesn't get to decide how strong you are — you already proved that a hundred times over",
    lang: "en"
  },
  {
    id: 33,
    fragments: ["When everything", "feels heavy,", "remember —", "you've carried worse", "and still smiled the next morning"],
    fullText: "When everything feels heavy, remember — you've carried worse and still smiled the next morning",
    lang: "en"
  },
  {
    id: 34,
    fragments: ["You don't need", "to be brave", "every second —", "resting is just", "strength catching its breath"],
    fullText: "You don't need to be brave every second — resting is just strength catching its breath",
    lang: "en"
  },
  {
    id: 35,
    fragments: ["You were never", "as fragile", "as you thought —", "you just feel things deeply,", "and that takes more courage than most people will ever know"],
    fullText: "You were never as fragile as you thought — you just feel things deeply, and that takes more courage than most people will ever know",
    lang: "en"
  },
  {
    id: 36,
    fragments: ["You didn't", "come this far", "just to", "come this far —", "there is so much more waiting for you"],
    fullText: "You didn't come this far just to come this far — there is so much more waiting for you",
    lang: "en"
  },
  {
    id: 37,
    fragments: ["The fact that", "you're still trying,", "even on", "the days it hurts,", "says everything about who you are"],
    fullText: "The fact that you're still trying, even on the days it hurts, says everything about who you are",
    lang: "en"
  },
  {
    id: 38,
    fragments: ["You don't", "owe anyone", "an explanation", "for protecting", "your peace"],
    fullText: "You don't owe anyone an explanation for protecting your peace",
    lang: "en"
  },
  {
    id: 39,
    fragments: ["Some people", "search their whole lives", "for a heart like yours —", "don't ever let the world", "make you doubt its kindness, its beauty"],
    fullText: "Some people search their whole lives for a heart like yours — don't ever let the world make you doubt its kindness, its beauty",
    lang: "en"
  },

  // — Future Dreams (personal) —
  {
    id: 41,
    fragments: ["One day", "you'll look back", "at tonight", "and realize this was", "the beginning of everything you dreamed of"],
    fullText: "One day you'll look back at tonight and realize this was the beginning of everything you dreamed of",
    lang: "en"
  },
  {
    id: 42,
    fragments: ["The life", "you keep imagining", "late at night —", "it's not too big", "for you, it's exactly your size"],
    fullText: "The life you keep imagining late at night — it's not too big for you, it's exactly your size",
    lang: "en"
  },
  {
    id: 43,
    fragments: ["Every small step", "you take", "right now", "is building a future", "that will make you cry happy tears"],
    fullText: "Every small step you take right now is building a future that will make you cry happy tears",
    lang: "en"
  },
  {
    id: 44,
    fragments: ["The version of you", "five years from now", "is so proud", "of the you", "sitting here tonight"],
    fullText: "The version of you five years from now is so proud of the you sitting here tonight",
    lang: "en"
  },
  {
    id: 45,
    fragments: ["Everything", "you're working toward", "is quietly", "falling into place,", "even when it doesn't feel like it"],
    fullText: "Everything you're working toward is quietly falling into place, even when it doesn't feel like it",
    lang: "en"
  },
  {
    id: 46,
    fragments: ["Your dreams", "aren't random —", "they're blueprints", "of the life", "you were made to live"],
    fullText: "Your dreams aren't random — they're blueprints of the life you were made to live",
    lang: "en"
  },
  {
    id: 47,
    fragments: ["One day", "this season", "will just be", "a chapter in", "the most beautiful story you've ever told"],
    fullText: "One day this season will just be a chapter in the most beautiful story you've ever told",
    lang: "en"
  },

  // — Shared Future —
  {
    id: 48,
    fragments: ["I'm sure", "that you'll be", "the most beautiful mother", "our children", "will ever know"],
    fullText: "I'm sure that you'll be the most beautiful mother our children will ever know",
    lang: "en"
  },
  {
    id: 49,
    fragments: ["Our kids", "are going to have", "the kindest,", "warmest, most loving", "heart to come home to"],
    fullText: "Our kids are going to have the kindest, warmest, most loving heart to come home to",
    lang: "en"
  },
  {
    id: 50,
    fragments: ["I can't wait", "to build", "a whole life with you —", "messy mornings,", "late night talks, all of it"],
    fullText: "I can't wait to build a whole life with you — messy mornings, late night talks, all of it",
    lang: "en"
  },
  {
    id: 51,
    fragments: ["You're going to be", "the best wife,", "the best mom,", "the best friend —", "and I'll be right beside you"],
    fullText: "You're going to be the best wife, the best mom, the best friend — and I'll be right beside you",
    lang: "en"
  },
  {
    id: 52,
    fragments: ["One day", "we'll sit together", "watching our kids play", "and I'll whisper —", "we really did it"],
    fullText: "One day we'll sit together watching our kids play and I'll whisper — we really did it",
    lang: "en"
  },
  {
    id: 53,
    fragments: ["Every future", "I imagine", "has you", "in the center of it,", "and it's the most peaceful thing I know"],
    fullText: "Every future I imagine has you in the center of it, and it's the most peaceful thing I know",
    lang: "en"
  },
  {
    id: 54,
    fragments: ["I don't just", "love you", "for who you are now —", "I love every version", "of us we haven't become yet"],
    fullText: "I don't just love you for who you are now — I love every version of us we haven't become yet",
    lang: "en"
  },
  {
    id: 55,
    fragments: ["Our home", "is going to feel like", "one of the safest", "places on earth —", "and you are the heart of it"],
    fullText: "Our home is going to feel like one of the safest places on earth — and you are the heart of it",
    lang: "en"
  },
  {
    id: 56,
    fragments: ["I want", "our life together", "to be full of small,", "beautiful,", "ordinary moments — every single one of them"],
    fullText: "I want our life together to be full of small, beautiful, ordinary moments — every single one of them",
    lang: "en"
  },

  // — Beauty (inner) —
  {
    id: 57,
    fragments: ["People feel", "safe around you", "and that is", "one of the rarest,", "most beautiful things a person can be"],
    fullText: "People feel safe around you and that is one of the rarest, most beautiful things a person can be",
    lang: "en"
  },
  {
    id: 58,
    fragments: ["You carry beauty", "that doesn't fade —", "the kind", "that comes from", "how deeply you care"],
    fullText: "You carry beauty that doesn't fade — the kind that comes from how deeply you care",
    lang: "en"
  },
  {
    id: 59,
    fragments: ["The way", "you love people", "is proof that", "the world still has", "something genuinely good in it"],
    fullText: "The way you love people is proof that the world still has something genuinely good in it",
    lang: "en"
  },

  // — Physical Beauty —
  {
    id: 67,
    fragments: ["You are", "the kind of beautiful", "that makes people", "forget what they were", "about to say"],
    fullText: "You are the kind of beautiful that makes people forget what they were about to say",
    lang: "en"
  },
  {
    id: 68,
    fragments: ["Your smile", "could end wars —", "and honestly", "it ends every bad day", "I've ever had"],
    fullText: "Your smile could end wars — and honestly it ends every bad day I've ever had",
    lang: "en"
  },
  {
    id: 69,
    fragments: ["Everything", "about you", "is soft and warm", "and exactly where", "my eyes want to stay"],
    fullText: "Everything about you is soft and warm and exactly where my eyes want to stay",
    lang: "en"
  },
  {
    id: 71,
    fragments: ["Your face", "is the first thing", "I want to see", "every morning", "and the last thing every night"],
    fullText: "Your face is the first thing I want to see every morning and the last thing every night",
    lang: "en"
  },
  {
    id: 72,
    fragments: ["I don't think", "you understand", "how beautiful", "you actually are —", "and that somehow makes you even more beautiful"],
    fullText: "I don't think you understand how beautiful you actually are — and that somehow makes you even more beautiful",
    lang: "en"
  },
  {
    id: 73,
    fragments: ["Your beauty", "isn't just something", "I see —", "it's something I feel", "every time I look at you"],
    fullText: "Your beauty isn't just something I see — it's something I feel every time I look at you",
    lang: "en"
  },
  {
    id: 74,
    fragments: ["The way you look", "without even trying", "is what most people", "wish they could look like", "at their best"],
    fullText: "The way you look without even trying is what most people wish they could look like at their best",
    lang: "en"
  },

  // — Warm / Cozy —
  {
    id: 60,
    fragments: ["You're not", "behind in life —", "you're on", "your own timeline", "and it's a really beautiful one"],
    fullText: "You're not behind in life — you're on your own timeline and it's a really beautiful one",
    lang: "en"
  },
  {
    id: 62,
    fragments: ["You deserve", "the kind of rest", "where your phone", "is far away", "and your heart is completely still"],
    fullText: "You deserve the kind of rest where your phone is far away and your heart is completely still",
    lang: "en"
  },
  {
    id: 63,
    fragments: ["Somewhere", "in the world", "right now,", "something good", "is making its way to you"],
    fullText: "Somewhere in the world right now, something good is making its way to you",
    lang: "en"
  },
  {
    id: 65,
    fragments: ["Not everyone", "gets to be", "this loved —", "but you do,", "because you earned it just by being you"],
    fullText: "Not everyone gets to be this loved — but you do, because you earned it just by being you",
    lang: "en"
  }
];

const TROPHY_ICONS = [
  "\u2B50", "\uD83C\uDF19", "\uD83D\uDC8E", "\u2764\uFE0F", "\uD83C\uDF38",
  "\uD83D\uDC51", "\uD83D\uDD36", "\uD83E\uDD8B", "\u2600\uFE0F", "\u2601\uFE0F"
];
