# Q12 Gap Analysis — React Developer Notes

**Project:** ENDevo / My Final Playbook
**Component:** Q12 Legacy Readiness Gap Analysis
**Spec locked by:** Niki Weiss (Product Owner), April 2026
**Engine file:** `q12-engine.ts` (import all functions and types from here)

---

## 1. Architecture Decision

**NO Claude API. NO AI generation. 100% deterministic.**

All personalization comes from:
- Score calculation (0-24 total, 0-6 per domain)
- Band assignment (AT RISK / SOMEWHAT PREPARED / PREPARED)
- Domain weakness ranking with tie-break (Digital → Legal → Financial → Physical)
- Day-to-action mapping from the locked Action Pool

The Jesse "voice" is delivered via static band-specific wrapper copy in `getJesseWrapper()`. Same quality every time, every user, zero API latency.

---

## 2. The Variance Math (answer to "will users see the same thing?")

**Action Pool:** 9 total actions (2 per domain × 4 domains + 1 Day 7 consolidation)

**Possible unique 7-day sequences:** 24 (4! orderings of weakness rank)

**Each user receives:**
- 7 actions out of the pool of 9
- In an order determined by THEIR weakness pattern
- Days 1-4: Action A from each domain in weakness order
- Days 5-6: Action B from their 2 weakest domains (depth reinforcement)
- Day 7: Consolidation (shared by all users, by design)

**Users perceive personalization because:**
- Their name appears in the opening
- Their specific weakest domain is called out by name
- Day 1 action matches their biggest gap
- Days 5-6 return to reinforce their weakest areas

---

## 3. The 7-Day Pattern (coverage then depth)

| Day | Domain Source | Slot | Purpose |
|-----|--------------|------|---------|
| 1 | Rank 1 (weakest) | A | Hit biggest gap first - urgency |
| 2 | Rank 2 | A | Breadth |
| 3 | Rank 3 | A | Breadth |
| 4 | Rank 4 (strongest) | A | Completeness - every domain touched |
| 5 | Rank 1 (weakest) | B | DEPTH - return to hardest area |
| 6 | Rank 2 | B | Depth - secondary reinforcement |
| 7 | ALL | Day7 | Consolidation + conversion CTA |

The weakest domain gets 2 days (Day 1 + Day 5). The second weakest gets 2 days (Day 2 + Day 6). The 2 strongest get 1 day each. Finite attention spent on biggest gaps.

---

## 4. Tie-Break Rule (CRITICAL)

When two domains have the same weakness score, break ties in this order:

**Digital → Legal → Financial → Physical**

Rationale: Digital wins ties because it guarantees a fast, concrete first win on Day 1. Already implemented in `rankDomains()`.

---

## 5. Component Tree (suggested)

```
<Q12App>
├── <IntroScreen />              // "Find your gaps. Get your 7-day plan."
├── <QuizFlow>
│   ├── <DomainSection domain="Digital" />    // Q1-Q3
│   ├── <DomainSection domain="Legal" />      // Q4-Q6
│   ├── <DomainSection domain="Financial" />  // Q7-Q9
│   ├── <DomainSection domain="Physical" />   // Q10-Q12
│   └── <ProgressBar current={n} total={12} />
├── <EmailWall />                // Capture email after Q12
├── <ResultsScreen>
│   ├── <ScoreHero />            // Band + percentage
│   ├── <DomainBreakdown />      // 4 bars, 0-100% each
│   ├── <WhyThisPlan />          // "Your plan starts with X because..."
│   ├── <DayOnePreview />        // Inline Day 1 action
│   └── <PDFDownloadCTA />
└── <PDFGenerator />             // Server-side or client-side
```

---

## 6. State Shape

```typescript
interface Q12State {
  step: 'intro' | 'quiz' | 'email' | 'results';
  currentQuestionIndex: number; // 0-11
  answers: Record<string, string>; // { D1: 'N', D2: 'P', ... }
  userName: string;
  userEmail: string;
  sourceTag?: 'q4' | 'direct' | 'linkedin' | 'email'; // for GHL
  result?: AssessmentResult; // from runAssessment()
  wrapper?: JesseWrapper;    // from getJesseWrapper()
}
```

---

## 7. Quiz UI Rules

1. **One question per screen** (mobile-first). Larger tap targets for answer options.
2. **Progress bar persistent** at top: "3 of 12"
3. **Domain headers** between question groups:
   - Before Q1: "Digital Readiness (3 questions)"
   - Before Q4: "Legal Readiness (3 questions)"
   - Before Q7: "Financial Readiness (3 questions)"
   - Before Q10: "Physical Readiness (3 questions)"
4. **Celebration microcopy** after each domain group completes:
   - After Q3: "Digital section done. 9 to go."
   - After Q6: "Halfway there."
   - After Q9: "One section left."
   - After Q12: "Last answer. Your plan is ready."
5. **No back button during quiz** (reduces abandonment; they can retake if needed)
6. **Auto-advance** on answer selection (no "Next" button)

---

## 8. Email Wall

- Trigger: after Q12 answer submitted
- Pre-fill email if URL has `?email=` param (Q4 → Q12 handoff)
- Copy: "Your plan is ready. Where should I send it?"
- Fields: first name, email
- CTA: "Show me my 7-day plan"
- After submit: call `runAssessment()`, POST to GHL webhook, navigate to results

---

## 9. Results Screen Layout

```
┌────────────────────────────────────────────┐
│  [Jesse image]   {name}'s                  │
│                  Legacy Readiness Score    │
│                                            │
│                  {percentReady}%           │
│                  {band}                    │
│                                            │
│                  Biggest opportunity:      │
│                  {weakestDomain}           │
└────────────────────────────────────────────┘

Your 4 Domains
  Digital    [====    ] {d_percent}%
  Legal      [==      ] {l_percent}%
  Financial  [========] {f_percent}%
  Physical   [=====   ] {p_percent}%

Why your plan starts with {weakestDomain}:
[One-sentence explanation - band-dependent copy below]

Your Day 1 action (tomorrow, 10 min):
{plan[0].action.title}

[DOWNLOAD YOUR 7-DAY PDF] (primary CTA)
[EMAIL ME THE PLAN]       (secondary CTA)
```

**"Why your plan starts with X" copy by band:**
- AT RISK: "This is your biggest gap. Closing it first protects everything else."
- SOMEWHAT PREPARED: "This is where you have the most room to grow."
- PREPARED: "Even the strongest have something to sharpen. This is yours."

---

## 10. PDF Structure (every user, same template)

```
PAGE 1 - Cover + Score
┌────────────────────────────────────────────┐
│ [Jesse image]                              │
│                                            │
│ {name}'s Legacy Readiness Plan             │
│ {formatted date}                           │
│                                            │
│ {percentReady}%                            │
│ {band}                                     │
│                                            │
│ Biggest opportunity: {weakestDomain}       │
│                                            │
│ ─────────────────                          │
│                                            │
│ Your 4 Domains:                            │
│   Digital    ████░░░░░░ {d_percent}%       │
│   Legal      ██░░░░░░░░ {l_percent}%       │
│   Financial  ██████████ {f_percent}%       │
│   Physical   █████░░░░░ {p_percent}%       │
│                                            │
│ ─────────────────                          │
│                                            │
│ {wrapper.opening}                          │
└────────────────────────────────────────────┘

PAGE 2-8 - One page per day (or 2 days per page)
┌────────────────────────────────────────────┐
│ DAY {n} — {DOMAIN}                         │
│                                            │
│ {action.title}                             │
│ Time: {action.time}                        │
│                                            │
│ Why this matters:                          │
│ {action.socialProof}                       │
│                                            │
│ How to do it:                              │
│ {action.howTo}                             │
│                                            │
│ {wrapper.dayNNote}                         │
└────────────────────────────────────────────┘

FINAL PAGE - Close + CTA
┌────────────────────────────────────────────┐
│ {wrapper.day7Closing}                      │
│                                            │
│ [BOOK 1:1 WITH NIKI]                       │
│ [ENROLL IN 7-WEEK SPRINT]                  │
│                                            │
│ endevo.life / finalplaybook.com            │
│ Live Fully. Die Ready.                     │
└────────────────────────────────────────────┘
```

---

## 11. Engine API Reference

Import from `q12-engine.ts`:

```typescript
import {
  QUESTIONS,           // array of 12 Question objects
  ACTION_POOL,         // array of 9 Action objects
  runAssessment,       // main entry point
  toGHLPayload,        // for webhook POST
  getJesseWrapper,     // for PDF/results copy
  // types:
  Answer,
  AssessmentResult,
  JesseWrapper,
  Band,
  Domain
} from './q12-engine';
```

### Primary call flow:

```typescript
// 1. Collect answers from quiz
const answers: Answer[] = [
  { questionId: 'D1', value: 'N' },
  { questionId: 'D2', value: 'P' },
  // ... all 12
];

// 2. Run assessment (pure function, no async)
const result = runAssessment(userName, answers);
// result: { name, totalScore, percentReady, band, weakestDomain, domainResults, plan }

// 3. Get Jesse wrapper copy for PDF
const wrapper = getJesseWrapper(result);
// wrapper: { opening, day1Note, ... day7Closing }

// 4. POST to GHL
const payload = toGHLPayload(result, userEmail, answers);
await fetch(import.meta.env.VITE_GHL_WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

// 5. Render results screen with result + wrapper
// 6. Generate PDF with result + wrapper + ACTION_POOL lookups
```

---

## 12. GHL Webhook Payload Contract (for Talha)

```json
{
  "first_name": "Nermeen",
  "email": "nermeen@example.com",
  "total_score": 14,
  "percent_ready": 58,
  "band": "SOMEWHAT PREPARED",
  "domain_d_score": 3,
  "domain_l_score": 2,
  "domain_f_score": 5,
  "domain_p_score": 4,
  "weakest_domain": "Legal",
  "domain_ranks": ["Legal", "Digital", "Physical", "Financial"],
  "day_1_action_id": "LEGAL_A",
  "day_2_action_id": "DIGITAL_A",
  "day_3_action_id": "PHYSICAL_A",
  "day_4_action_id": "FINANCIAL_A",
  "day_5_action_id": "LEGAL_B",
  "day_6_action_id": "DIGITAL_B",
  "day_7_action_id": "DAY_7",
  "answers": {
    "D1": "Y", "D2": "P", "D3": "N",
    "L1": "N", "L2": "IP", "L3": "O",
    "F1": "A", "F2": "Y", "F3": "P",
    "P1": "Y", "P2": "P", "P3": "S"
  },
  "completed_at": "2026-04-24T18:30:00.000Z"
}
```

**GHL Tags to apply on webhook receipt:**
- Primary: `Q12_AT_RISK` or `Q12_SOMEWHAT` or `Q12_PREPARED`
- Secondary: `Q12_WEAKEST_DIGITAL` / `_LEGAL` / `_FINANCIAL` / `_PHYSICAL`

---

## 13. URL Parameters (Q4 → Q12 handoff)

Support these query params on entry:

| Param | Purpose | Example |
|-------|---------|---------|
| `email` | Pre-fill email wall | `?email=user@example.com` |
| `source` | GHL attribution | `?source=q4` / `?source=linkedin` |
| `name` | Pre-fill first name | `?name=Nermeen` |

If `email` is present, skip email wall and go straight to quiz. Pass through to GHL payload as `source_tag`.

---

## 14. Scoring Examples (verify your implementation)

### Example 1: AT RISK user
```
Answers: D1=N, D2=N, D3=N, L1=N, L2=N, L3=N, F1=N, F2=N, F3=N, P1=N, P2=N, P3=Y
Domain scores: D=0, L=0, F=0, P=2
Total: 2 / 24 = 8%
Band: AT RISK
Ranks: Digital(w=6), Legal(w=6), Financial(w=6), Physical(w=4)
Tie-break order: Digital → Legal → Financial → Physical

7-day plan:
Day 1: DIGITAL_A
Day 2: LEGAL_A
Day 3: FINANCIAL_A
Day 4: PHYSICAL_A
Day 5: DIGITAL_B
Day 6: LEGAL_B
Day 7: DAY_7
```

### Example 2: SOMEWHAT PREPARED user
```
Answers: D1=Y, D2=P, D3=Y, L1=N, L2=IP, L3=O, F1=A, F2=Y, F3=P, P1=Y, P2=P, P3=S
Domain scores: D=5, L=2, F=5, P=4
Total: 16 / 24 = 67%
Band: SOMEWHAT PREPARED
Ranks: Legal(w=4), Physical(w=2), Digital(w=1), Financial(w=1)
Tie-break between Digital and Financial: Digital wins (earlier in order)

7-day plan:
Day 1: LEGAL_A      (weakest, Action A)
Day 2: PHYSICAL_A
Day 3: DIGITAL_A
Day 4: FINANCIAL_A
Day 5: LEGAL_B      (back to weakest, Action B)
Day 6: PHYSICAL_B
Day 7: DAY_7
```

### Example 3: PREPARED user
```
Answers: D1=Y, D2=Y, D3=Y, L1=Y, L2=Y, L3=B, F1=A, F2=Y, F3=C, P1=Y, P2=P, P3=S
Domain scores: D=6, L=6, F=6, P=3
Total: 21 / 24 = 88%
Band: PREPARED
Ranks: Physical(w=3), Digital(w=0), Legal(w=0), Financial(w=0)
Tie-break: Digital → Legal → Financial

7-day plan:
Day 1: PHYSICAL_A
Day 2: DIGITAL_A
Day 3: LEGAL_A
Day 4: FINANCIAL_A
Day 5: PHYSICAL_B
Day 6: DIGITAL_B
Day 7: DAY_7
```

---

## 15. Build Sequence (your sprint)

| Priority | Task | Time Estimate | Blocker |
|----------|------|---------------|---------|
| P0 | Wire engine into React app | 2h | No |
| P0 | Build intro screen | 1h | No |
| P0 | Build quiz flow with domain sections | 6h | No |
| P0 | Build email wall | 2h | No |
| P0 | Build results screen | 4h | No |
| P0 | PDF generator (react-pdf or server-side) | 8h | No |
| P0 | GHL webhook integration | 2h | No |
| P0 | URL param handling (Q4 handoff) | 1h | No |
| P1 | Mobile responsive polish | 3h | No |
| P1 | Analytics events (GA4 / PostHog) | 2h | No |
| P2 | A/B test framework for copy | 4h | No |
| P2 | .ics calendar download per day | 3h | No |

**Total P0: ~26 hours of dev work. Shippable in 1 sprint.**

---

## 16. What NOT to Build

- No Claude API integration (confirmed not needed)
- No user login or account system
- No "mark complete" tracking in v1 (add in v1.1 with GHL integration)
- No streak UI in v1 (emails carry the streak framing)
- No saved progress (users complete in one sitting or start over)

---

## 17. Testing Checklist

- [ ] All 12 questions render with correct options
- [ ] Progress bar updates correctly
- [ ] Score calculation matches examples in Section 14
- [ ] Band assignment correct at boundary values (11/12, 19/20)
- [ ] Tie-break order correct (Digital wins first tie)
- [ ] Domain percentages round correctly (integer %)
- [ ] PDF renders all 7 days with correct action content
- [ ] Wrapper copy changes by band
- [ ] GHL payload matches contract in Section 12
- [ ] URL params pre-fill correctly
- [ ] Mobile layout works at 375px width
- [ ] PDF downloads on mobile Safari + Chrome

---

## 18. Open Items Waiting on Niki

These are NOT blockers. Build with defaults, swap in later.

1. **PDF score display hero:** currently shows `{percentReady}%` as primary with `{band}` below. Niki may prefer `{band}` as primary. One CSS swap.
2. **Day 7 dual CTA vs single CTA:** currently both buttons render. Niki may pick one based on band. Add conditional later.
3. **Email subject line personalization:** Talha's GHL work. Not a React concern.

---

## 19. Handoff Summary

You have everything needed to ship the Q12 MVP:

- **`q12-engine.ts`** - Drop-in business logic, fully tested in isolation
- **This document** - UI/UX mapping and contracts
- **No external dependencies on AI, auth, or payment** for v1

Ship in one sprint. Iterate after user data lands.

**Live Fully. Die Ready.**
