// ============================================================
// ENDevo Q12 Gap Analysis — Deterministic Engine (v2)
// Spec locked by Niki (PO), April 2026
// Updated Action Pool copy per PO review
// No Claude API. No domain status labels. Band-only tiering.
// ============================================================

export type Domain = "Digital" | "Legal" | "Financial" | "Physical";
export type Band = "AT RISK" | "SOMEWHAT PREPARED" | "PREPARED";

export interface QuestionOption {
  label: string;
  value: string;
  points: 0 | 1 | 2;
}

export interface Question {
  id: string;
  domain: Domain;
  text: string;
  options: QuestionOption[];
}

export interface Answer {
  questionId: string;
  value: string;
}

export interface DomainResult {
  domain: Domain;
  score: number;    // 0-6
  percent: number;  // 0-100
  rank: 1 | 2 | 3 | 4; // 1 = weakest
}

export interface Action {
  id: string;
  domain: Domain | "ALL";
  slot: "A" | "B" | "Day7";
  title: string;
  time: string;
  socialProof: string;
  howTo: string;
}

export interface DayAssignment {
  day: number;
  domain: Domain | "ALL";
  action: Action;
}

export interface AssessmentResult {
  name: string;
  totalScore: number;    // 0-24
  percentReady: number;  // 0-100
  band: Band;
  weakestDomain: Domain;
  domainResults: DomainResult[]; // sorted by rank (weakest first)
  plan: DayAssignment[];         // Day 1 - Day 7
}

// ============================================================
// QUESTIONS — 12 total, 3 per domain
// ============================================================

export const QUESTIONS: Question[] = [
  {
    id: "D1",
    domain: "Digital",
    text: "If you died tomorrow and your cell phone died with you, do you have your Legacy Contact set up on your phone account?",
    options: [
      { label: "Yes", value: "Y", points: 2 },
      { label: "Maybe", value: "M", points: 1 },
      { label: "No", value: "N", points: 0 },
    ],
  },
  {
    id: "D2",
    domain: "Digital",
    text: "Have you designated someone to manage your social media accounts if you were incapacitated or dead?",
    options: [
      { label: "Yes, with instructions", value: "Y", points: 2 },
      { label: "Named but no instructions", value: "P", points: 1 },
      { label: "No", value: "N", points: 0 },
    ],
  },
  {
    id: "D3",
    domain: "Digital",
    text: "Do you use a password manager to store your login/password credentials?",
    options: [
      { label: "Yes", value: "Y", points: 2 },
      { label: "No", value: "N", points: 0 },
    ],
  },
  {
    id: "L1",
    domain: "Legal",
    text: "Do you have a trusted person who knows where your important legal documents are stored?",
    options: [
      { label: "Yes", value: "Y", points: 2 },
      { label: "No", value: "N", points: 0 },
      { label: "Don't have executor", value: "NE", points: 0 },
    ],
  },
  {
    id: "L2",
    domain: "Legal",
    text: "Do you have a Will and/or Trust that reflects your current wishes?",
    options: [
      { label: "Yes", value: "Y", points: 2 },
      { label: "In Progress", value: "IP", points: 1 },
      { label: "No", value: "N", points: 0 },
      { label: "Don't know", value: "DK", points: 0 },
    ],
  },
  {
    id: "L3",
    domain: "Legal",
    text: "Have you assigned Power of Attorney for both financial and healthcare decisions?",
    options: [
      { label: "Both", value: "B", points: 2 },
      { label: "One only", value: "O", points: 1 },
      { label: "No", value: "N", points: 0 },
      { label: "Don't know", value: "DK", points: 0 },
    ],
  },
  {
    id: "F1",
    domain: "Financial",
    text: "Do you have beneficiary designations confirmed on all accounts (retirement, life insurance, bank)?",
    options: [
      { label: "All confirmed", value: "A", points: 2 },
      { label: "Some", value: "S", points: 1 },
      { label: "No", value: "N", points: 0 },
      { label: "Don't know", value: "DK", points: 0 },
    ],
  },
  {
    id: "F2",
    domain: "Financial",
    text: "Do you have a list of all your recurring subscriptions and autopay accounts?",
    options: [
      { label: "Yes", value: "Y", points: 2 },
      { label: "Partially", value: "P", points: 1 },
      { label: "No", value: "N", points: 0 },
    ],
  },
  {
    id: "F3",
    domain: "Financial",
    text: "Do you have a written inventory of all your assets and debts?",
    options: [
      { label: "Complete", value: "C", points: 2 },
      { label: "Partial", value: "P", points: 1 },
      { label: "No", value: "N", points: 0 },
    ],
  },
  {
    id: "P1",
    domain: "Physical",
    text: "Do you have a Medical Advance Directive documenting your end-of-life wishes?",
    options: [
      { label: "Yes", value: "Y", points: 2 },
      { label: "In Progress", value: "IP", points: 1 },
      { label: "No", value: "N", points: 0 },
      { label: "Don't know", value: "DK", points: 0 },
    ],
  },
  {
    id: "P2",
    domain: "Physical",
    text: "If you died tomorrow, have you documented whether you want to be buried or cremated?",
    options: [
      { label: "Yes, decided and documented", value: "Y", points: 2 },
      { label: "Decided but not documented", value: "P", points: 1 },
      { label: "No", value: "N", points: 0 },
    ],
  },
  {
    id: "P3",
    domain: "Physical",
    text: "Are you familiar with Death with Dignity?",
    options: [
      { label: "Yes", value: "Y", points: 2 },
      { label: "Somewhat", value: "S", points: 1 },
      { label: "No", value: "N", points: 0 },
    ],
  },
];

// ============================================================
// ACTION POOL — Updated per Niki PO review (Apr 2026)
// Copy is LOCKED. Do not modify without PO sign-off.
// ============================================================

export const ACTION_POOL: Action[] = [
  {
    id: "DIGITAL_A",
    domain: "Digital",
    slot: "A",
    title: "Set up Legacy Contact on your phone (iPhone or Android)",
    time: "10 min",
    socialProof: "$600B in digital assets lost annually because nobody can unlock the phone.",
    howTo: "iPhone: Settings → Apple ID → Sign-In & Security → Add Legacy Contact. Android: Google Inactive Account Manager. Add primary + secondary + tertiary.",
  },
  {
    id: "DIGITAL_B",
    domain: "Digital",
    slot: "B",
    title: "Install a password manager and add your top 5 accounts",
    time: "15 min",
    socialProof: "Only 22% of adults use a password manager. A locked password vault dies with you without emergency access.",
    howTo: "Choose a digital password manager. Import your 5 most critical logins. Configure emergency access for your Digital Legacy Executor.",
  },
  {
    id: "LEGAL_A",
    domain: "Legal",
    slot: "A",
    title: "Identify Primary, Secondary, Tertiary for Executor and ask the primary if they are willing to manage your affairs after you are gone",
    time: "15 min",
    socialProof: "88% of Executors were never asked. Court-appointed administrators cost estates 6-18 months and thousands of dollars.",
    howTo: "Write 3 names: Primary, Secondary, Tertiary. Text the Primary: 'Would you be willing to be my Executor? It means handling my estate. I would like to talk about what is involved.'",
  },
  {
    id: "LEGAL_B",
    domain: "Legal",
    slot: "B",
    title: "Status-check your estate documents: exists / outdated / does not exist",
    time: "15 min",
    socialProof: "76% of people die without any estate documents. State intestacy law then decides who gets what, rarely matching what you wanted.",
    howTo: "One of three: (1) if you have one, text your Executor the location of this document. (2) If outdated, review to determine if it needs to be updated. (3) If none, write ONE sentence: 'If I died tomorrow, I would want ___.' Visit www.freewill.com to learn more about what you need.",
  },
  {
    id: "FINANCIAL_A",
    domain: "Financial",
    slot: "A",
    title: "Verify beneficiaries on one retirement account and one insurance policy",
    time: "10 min",
    socialProof: "Outdated beneficiaries are the #1 estate planning mistake. They override the Will entirely. Do not let your ex-spouse inherit by default.",
    howTo: "Log into one retirement account (401k, IRA). Check beneficiary page. Update or confirm. Repeat for one insurance policy.",
  },
  {
    id: "FINANCIAL_B",
    domain: "Financial",
    slot: "B",
    title: "List your 5 most important financial accounts (include the institution + point of contact)",
    time: "15 min",
    socialProof: "67% of families struggle to find accounts after death. $70B sits unclaimed in the US as we speak.",
    howTo: "Create a hard-copy document. Write: institution name, account type, last 4 digits, beneficiary. 5 accounts.",
  },
  {
    id: "PHYSICAL_A",
    domain: "Physical",
    slot: "A",
    title: "Decide burial vs cremation. Write it. Tell someone you know/love/trust.",
    time: "10 min",
    socialProof: "This is the decision your family dreads most in the first 72 hours. Documented wishes take precedence over family preference in most states.",
    howTo: "Pick burial, cremation, aquamation, green burial, or body donation. Write: 'I want [choice] at [funeral home].' Sign. Date. Store with Will.",
  },
  {
    id: "PHYSICAL_B",
    domain: "Physical",
    slot: "B",
    title: "Draft your medical wishes in case of incapacitation. Be specific as to your true wishes.",
    time: "15 min",
    socialProof: "77% do not have a Medical Advance Directive. Hospitals default to maximum intervention without it.",
    howTo: "Write: 'If I am dying and cannot speak, I want ___. I do NOT want ___. If there is no hope of meaningful recovery, please ___.' Signal your preference now; formalize with attorney later.",
  },
  {
    id: "DAY_7",
    domain: "ALL",
    slot: "Day7",
    title: "Tell your Know/Love/Trust person where every list from this week lives. Then book your next step.",
    time: "20 min",
    socialProof: "You just completed 7 actions in 7 days. 96% of people who say they will plan never start. You did.",
    howTo: "Send one message to your KLT person with: location of each doc, password manager access plan, Executor choices, disposition decision. Then book a 1:1 with Niki OR enroll in the 7-Week Sprint.",
  },
];

// ============================================================
// CORE ENGINE
// ============================================================

const TIE_BREAK_ORDER: Domain[] = ["Digital", "Legal", "Financial", "Physical"];

export function calculateScore(answers: Answer[]): number {
  let total = 0;
  for (const answer of answers) {
    const question = QUESTIONS.find((q) => q.id === answer.questionId);
    if (!question) continue;
    const option = question.options.find((o) => o.value === answer.value);
    if (!option) continue;
    total += option.points;
  }
  return total;
}

export function calculateDomainScores(answers: Answer[]): Record<Domain, number> {
  const scores: Record<Domain, number> = {
    Digital: 0,
    Legal: 0,
    Financial: 0,
    Physical: 0,
  };
  for (const answer of answers) {
    const question = QUESTIONS.find((q) => q.id === answer.questionId);
    if (!question) continue;
    const option = question.options.find((o) => o.value === answer.value);
    if (!option) continue;
    scores[question.domain] += option.points;
  }
  return scores;
}

export function assignBand(totalScore: number): Band {
  if (totalScore <= 11) return "AT RISK";
  if (totalScore <= 19) return "SOMEWHAT PREPARED";
  return "PREPARED";
}

export function rankDomains(domainScores: Record<Domain, number>): DomainResult[] {
  const domains: Domain[] = ["Digital", "Legal", "Financial", "Physical"];
  const withWeakness = domains.map((domain) => ({
    domain,
    score: domainScores[domain],
    weakness: 6 - domainScores[domain],
    tieBreakIndex: TIE_BREAK_ORDER.indexOf(domain),
  }));
  withWeakness.sort((a, b) => {
    if (b.weakness !== a.weakness) return b.weakness - a.weakness;
    return a.tieBreakIndex - b.tieBreakIndex;
  });
  return withWeakness.map((item, idx) => ({
    domain: item.domain,
    score: item.score,
    percent: Math.round((item.score / 6) * 100),
    rank: (idx + 1) as 1 | 2 | 3 | 4,
  }));
}

export function buildPlan(rankedDomains: DomainResult[]): DayAssignment[] {
  const getAction = (domain: Domain, slot: "A" | "B"): Action => {
    const action = ACTION_POOL.find((a) => a.domain === domain && a.slot === slot);
    if (!action) throw new Error(`Action not found: ${domain} slot ${slot}`);
    return action;
  };
  const day7 = ACTION_POOL.find((a) => a.slot === "Day7");
  if (!day7) throw new Error("Day 7 action not found");

  return [
    { day: 1, domain: rankedDomains[0].domain, action: getAction(rankedDomains[0].domain, "A") },
    { day: 2, domain: rankedDomains[1].domain, action: getAction(rankedDomains[1].domain, "A") },
    { day: 3, domain: rankedDomains[2].domain, action: getAction(rankedDomains[2].domain, "A") },
    { day: 4, domain: rankedDomains[3].domain, action: getAction(rankedDomains[3].domain, "A") },
    { day: 5, domain: rankedDomains[0].domain, action: getAction(rankedDomains[0].domain, "B") },
    { day: 6, domain: rankedDomains[1].domain, action: getAction(rankedDomains[1].domain, "B") },
    { day: 7, domain: "ALL", action: day7 },
  ];
}

export function runAssessment(name: string, answers: Answer[]): AssessmentResult {
  const totalScore = calculateScore(answers);
  const percentReady = Math.round((totalScore / 24) * 100);
  const band = assignBand(totalScore);
  const domainScores = calculateDomainScores(answers);
  const domainResults = rankDomains(domainScores);
  const weakestDomain = domainResults[0].domain;
  const plan = buildPlan(domainResults);
  return { name, totalScore, percentReady, band, weakestDomain, domainResults, plan };
}

// ============================================================
// GHL WEBHOOK PAYLOAD
// ============================================================

/**
 * Pre-format a day's action into a single multi-line string for the GHL
 * drip-email merge tag {{contact.q12_day_N_action}}. Niki's drip templates
 * just merge this one field — title + time + why + how all baked in.
 */
function formatDayAction(d: DayAssignment): string {
  return [
    `${d.action.title} (${d.action.time})`,
    ``,
    `Why this matters:`,
    d.action.socialProof,
    ``,
    `How to do it:`,
    d.action.howTo,
  ].join("\n");
}

export function toGHLPayload(
  result: AssessmentResult,
  email: string,
  answers: Answer[]
) {
  const byRank = (r: number) => result.domainResults.find((d) => d.rank === r)!.domain;
  const byDomainScore = (d: Domain) => result.domainResults.find((r) => r.domain === d)!.score;
  const byDomainPercent = (d: Domain) => result.domainResults.find((r) => r.domain === d)!.percent;

  return {
    // ── Contact
    first_name: result.name,
    email,

    // ── Top-line scoring
    total_score: result.totalScore,           // 0-24 raw
    percent_ready: result.percentReady,       // 0-100 average across 4 domains
    tier: result.band,                        // "AT RISK" | "SOMEWHAT PREPARED" | "PREPARED"
    band: result.band,                        // alias — same value, for backward compat

    // ── Per-domain raw score (0-6)
    digital_score: byDomainScore("Digital"),
    legal_score: byDomainScore("Legal"),
    financial_score: byDomainScore("Financial"),
    physical_score: byDomainScore("Physical"),

    // ── Per-domain percentage (0-100)
    digital_percent: byDomainPercent("Digital"),
    legal_percent: byDomainPercent("Legal"),
    financial_percent: byDomainPercent("Financial"),
    physical_percent: byDomainPercent("Physical"),

    // ── Legacy compact keys (kept for existing GHL workflows)
    domain_d_score: byDomainScore("Digital"),
    domain_l_score: byDomainScore("Legal"),
    domain_f_score: byDomainScore("Financial"),
    domain_p_score: byDomainScore("Physical"),

    // ── Domain ranking (rank 1 = weakest)
    weakest_domain: byRank(1),
    second_weakest_domain: byRank(2),
    third_weakest_domain: byRank(3),
    strongest_domain: byRank(4),
    domain_ranks: [byRank(1), byRank(2), byRank(3), byRank(4)],

    // ── Personalised 7-day plan
    // day_N_action: ONE pre-formatted block per day (title + time + why + how).
    // This is the field the drip-email merge tag {{contact.q12_day_N_action}}
    // pulls — keeps the GHL mapping at 7 fields instead of 28.
    day_1_action: formatDayAction(result.plan[0]),
    day_2_action: formatDayAction(result.plan[1]),
    day_3_action: formatDayAction(result.plan[2]),
    day_4_action: formatDayAction(result.plan[3]),
    day_5_action: formatDayAction(result.plan[4]),
    day_6_action: formatDayAction(result.plan[5]),
    day_7_action: formatDayAction(result.plan[6]),
    // Granular per-day fields kept for forward compat / power workflows.
    // Niki's drip templates use day_N_action; she only needs to map those 7.
    day_1_action_id: result.plan[0].action.id,
    day_1_action_title: result.plan[0].action.title,
    day_1_time: result.plan[0].action.time,
    day_1_why: result.plan[0].action.socialProof,
    day_1_how: result.plan[0].action.howTo,
    day_2_action_id: result.plan[1].action.id,
    day_2_action_title: result.plan[1].action.title,
    day_2_time: result.plan[1].action.time,
    day_2_why: result.plan[1].action.socialProof,
    day_2_how: result.plan[1].action.howTo,
    day_3_action_id: result.plan[2].action.id,
    day_3_action_title: result.plan[2].action.title,
    day_3_time: result.plan[2].action.time,
    day_3_why: result.plan[2].action.socialProof,
    day_3_how: result.plan[2].action.howTo,
    day_4_action_id: result.plan[3].action.id,
    day_4_action_title: result.plan[3].action.title,
    day_4_time: result.plan[3].action.time,
    day_4_why: result.plan[3].action.socialProof,
    day_4_how: result.plan[3].action.howTo,
    day_5_action_id: result.plan[4].action.id,
    day_5_action_title: result.plan[4].action.title,
    day_5_time: result.plan[4].action.time,
    day_5_why: result.plan[4].action.socialProof,
    day_5_how: result.plan[4].action.howTo,
    day_6_action_id: result.plan[5].action.id,
    day_6_action_title: result.plan[5].action.title,
    day_6_time: result.plan[5].action.time,
    day_6_why: result.plan[5].action.socialProof,
    day_6_how: result.plan[5].action.howTo,
    day_7_action_id: result.plan[6].action.id,
    day_7_action_title: result.plan[6].action.title,
    day_7_time: result.plan[6].action.time,
    day_7_why: result.plan[6].action.socialProof,
    day_7_how: result.plan[6].action.howTo,

    // ── GHL tag hints (apply these on webhook receipt)
    tag_band: `Q12_${result.band.replace(/\s+/g, "_")}`,
    tag_weakest: `Q12_WEAKEST_${byRank(1).toUpperCase()}`,

    // ── Raw answers + metadata
    answers: answers.reduce(
      (acc, a) => ({ ...acc, [a.questionId]: a.value }),
      {} as Record<string, string>
    ),
    completed_at: new Date().toISOString(),
    source: "Q12_GAP_ANALYSIS",
  };
}

// ============================================================
// JESSE WRAPPER COPY — Static, band-based. No Claude API.
// ============================================================

export interface JesseWrapper {
  opening: string;
  day1Note: string;
  day2Note: string;
  day3Note: string;
  day4Note: string;
  day5Note: string;
  day6Note: string;
  day7Closing: string;
}

export function getJesseWrapper(result: AssessmentResult): JesseWrapper {
  const { name, percentReady, band, weakestDomain } = result;

  const openings: Record<Band, string> = {
    "AT RISK": `Hi ${name}. Your Legacy Readiness Score is ${percentReady}%. You are at risk, and you are not alone, most people are here. Your 7-day plan opens with ${weakestDomain} because that is your biggest gap, and closing it first protects everything else. One action a day. Tomorrow is Day 1.`,
    "SOMEWHAT PREPARED": `Hi ${name}. Your Legacy Readiness Score is ${percentReady}%. You are somewhat prepared, which means you have started but gaps remain. Your plan opens with ${weakestDomain} because that is where you have the most room to grow. One action a day. Tomorrow is Day 1.`,
    "PREPARED": `Hi ${name}. Your Legacy Readiness Score is ${percentReady}%. You are prepared, which puts you in the top tier. Your plan still opens with ${weakestDomain} because even the strongest have something to sharpen. One action a day. Tomorrow is Day 1.`,
  };

  const closings: Record<Band, string> = {
    "AT RISK": `${name}, seven days ago you were at risk. You just completed 7 actions in 7 days. That is what readiness starts to look like. Your next step: book a 1:1 with Niki to lock in what you have built.`,
    "SOMEWHAT PREPARED": `${name}, seven days ago you had real gaps. You just closed the most important ones. Next step: a 1:1 with Niki to finish the plan, or the 7-Week Sprint to go deeper.`,
    "PREPARED": `${name}, you started prepared and spent seven days sharpening the edges. The 7-Week Sprint is built for people at your level who want to move from prepared to bulletproof.`,
  };

  return {
    opening: openings[band],
    day1Note: "Day 1 is done. Tomorrow moves to your second weakest domain.",
    day2Note: "Two days in, streak is live. Tomorrow is the halfway lean-in.",
    day3Note: "Halfway there. Tomorrow you touch your fourth and final domain.",
    day4Note: "Every domain has now been touched. Tomorrow we return to your weakest for a second, deeper action.",
    day5Note: "Back to the hardest domain. One more day before consolidation.",
    day6Note: "Six days down. Tomorrow is consolidation and your next step.",
    day7Closing: closings[band],
  };
}
