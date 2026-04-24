export const ROUTES = {
  landing: "/",
  quiz: "/quiz",
  capture: "/capture",
  done: "/done",
} as const;

export const TIMING = {
  answerCommitMs: 250,
  slideOutMs: 320,
  backSlideMs: 200,
} as const;

export const BRAND = {
  privacyUrl: "https://www.endevo.life/legal/privacy-policy",
  siteUrl: "https://endevo.life",
  productName: "ENDevo",
  quizName: "ENDevo Q12 Gap Analysis",
} as const;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
