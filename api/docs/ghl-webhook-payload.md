# Q12 → GHL Webhook Payload Reference

This document describes every field sent by `api/send-email.ts` to the
GoHighLevel inbound webhook **after** a user successfully submits the Q12
quiz and SES delivers their email. Use this as the source of truth when
mapping GHL custom fields, tags, and workflow triggers.

---

## Webhook URL (production)

```
https://services.leadconnectorhq.com/hooks/f5ehsbHfdFg2UsHEIb49/webhook-trigger/48b59c89-5b44-483a-bf7c-874d69beee35
```

Stored in Vercel as `GHL_WEBHOOK_URL` env var. If the value is blank or the
endpoint returns non-2xx, the email still goes out — failure is logged in
Vercel runtime logs but does not block the user flow.

---

## Trigger order

Sequence inside `api/send-email.ts`:

1. Validate request body (12 answers + name + email)
2. `runAssessment()` → score, band, plan
3. `buildPlannerPdf()` → PDF planner bytes
4. `renderReport()` → email HTML + plain text
5. `ses.send()` → email goes out
6. **`fireGHLWebhook(toGHLPayload)`** ← only fires if SES succeeded
7. Respond 200 to the browser

GHL receives the payload AFTER the user already has the email in their inbox.

---

## Full sample payload

```json
{
  "first_name": "Niki",
  "email": "niki@finalplaybook.com",

  "total_score": 16,
  "percent_ready": 67,
  "tier": "SOMEWHAT PREPARED",
  "band": "SOMEWHAT PREPARED",

  "digital_score": 5,
  "legal_score": 2,
  "financial_score": 5,
  "physical_score": 4,

  "digital_percent": 83,
  "legal_percent": 33,
  "financial_percent": 83,
  "physical_percent": 67,

  "domain_d_score": 5,
  "domain_l_score": 2,
  "domain_f_score": 5,
  "domain_p_score": 4,

  "weakest_domain": "Legal",
  "second_weakest_domain": "Physical",
  "third_weakest_domain": "Digital",
  "strongest_domain": "Financial",
  "domain_ranks": ["Legal", "Physical", "Digital", "Financial"],

  "day_1_action_id": "LEGAL_A",
  "day_1_action_title": "Identify Primary, Secondary, Tertiary for Executor...",
  "day_2_action_id": "PHYSICAL_A",
  "day_2_action_title": "Decide burial vs cremation...",
  "day_3_action_id": "DIGITAL_A",
  "day_3_action_title": "Set up Legacy Contact on your phone...",
  "day_4_action_id": "FINANCIAL_A",
  "day_4_action_title": "Verify beneficiaries on one retirement account...",
  "day_5_action_id": "LEGAL_B",
  "day_5_action_title": "Status-check your estate documents...",
  "day_6_action_id": "PHYSICAL_B",
  "day_6_action_title": "Draft your medical wishes...",
  "day_7_action_id": "DAY_7",
  "day_7_action_title": "Tell your Know/Love/Trust person...",

  "tag_band": "Q12_SOMEWHAT_PREPARED",
  "tag_weakest": "Q12_WEAKEST_LEGAL",

  "answers": {
    "D1": "Y", "D2": "P", "D3": "Y",
    "L1": "N", "L2": "IP", "L3": "O",
    "F1": "A", "F2": "Y", "F3": "P",
    "P1": "Y", "P2": "P", "P3": "S"
  },
  "completed_at": "2026-04-25T14:32:11.123Z",
  "source": "Q12_GAP_ANALYSIS"
}
```

---

## Field-by-field mapping guide

### Contact identification

| Field | Type | Range / Values | GHL mapping suggestion |
|---|---|---|---|
| `first_name` | string | user-entered | → Standard Contact field `firstName` |
| `email` | string | valid email | → Standard Contact field `email` (this is the primary identifier — use it for upsert/dedupe) |

### Top-line scoring

| Field | Type | Range | GHL mapping suggestion |
|---|---|---|---|
| `total_score` | integer | `0` – `24` | → custom field `q12_total_score` (number) |
| `percent_ready` | integer | `0` – `100` | → custom field `q12_percent_ready` (number) |
| `tier` | enum string | `"AT RISK"` / `"SOMEWHAT PREPARED"` / `"PREPARED"` | → custom field `q12_tier` (text) |
| `band` | enum string | same as `tier` | duplicate of `tier`, kept for legacy GHL workflows that already use `band` — map to whichever matches your existing automations |

### Per-domain raw score (0–6 each)

| Field | Type | GHL mapping |
|---|---|---|
| `digital_score` | integer | → `q12_digital_score` |
| `legal_score` | integer | → `q12_legal_score` |
| `financial_score` | integer | → `q12_financial_score` |
| `physical_score` | integer | → `q12_physical_score` |

### Per-domain percentage (0–100 each)

| Field | Type | GHL mapping |
|---|---|---|
| `digital_percent` | integer | → `q12_digital_percent` |
| `legal_percent` | integer | → `q12_legal_percent` |
| `financial_percent` | integer | → `q12_financial_percent` |
| `physical_percent` | integer | → `q12_physical_percent` |

### Legacy compact keys

`domain_d_score`, `domain_l_score`, `domain_f_score`, `domain_p_score` are
duplicates of the per-domain scores above using the original Q4 short keys.
Keep these mapped if you have any pre-existing GHL workflows that reference
them. Otherwise prefer the longer `digital_score` etc.

### Domain ranking (rank 1 = weakest, rank 4 = strongest)

| Field | Type | Values | GHL mapping suggestion |
|---|---|---|---|
| `weakest_domain` | enum | `Digital` / `Legal` / `Financial` / `Physical` | → `q12_weakest_domain` (drives Day 1 of the plan) |
| `second_weakest_domain` | enum | same | → `q12_second_weakest_domain` |
| `third_weakest_domain` | enum | same | → `q12_third_weakest_domain` |
| `strongest_domain` | enum | same | → `q12_strongest_domain` |
| `domain_ranks` | array | `[weakest, ...4]` | usually skip — same info as the four fields above |

### 7-day plan (per-day action assigned)

For each day 1–7, two fields:

| Field | Description | GHL mapping |
|---|---|---|
| `day_N_action_id` | Stable ID like `LEGAL_A`, `DIGITAL_B`, `DAY_7` (use for branching logic) | → `q12_day_N_action_id` |
| `day_N_action_title` | Human-readable title (use for emails/SMS) | → `q12_day_N_action_title` |

Day 7 is always `DAY_7` (consolidation) for every user — same content for everyone.

### Auto-tag hints

The webhook produces two pre-formatted GHL tag strings ready to apply:

| Field | Sample value | GHL action |
|---|---|---|
| `tag_band` | `"Q12_AT_RISK"` / `"Q12_SOMEWHAT_PREPARED"` / `"Q12_PREPARED"` | In your inbound workflow, **Apply Tag** = `{{ tag_band }}` |
| `tag_weakest` | `"Q12_WEAKEST_DIGITAL"` / `"Q12_WEAKEST_LEGAL"` / `"Q12_WEAKEST_FINANCIAL"` / `"Q12_WEAKEST_PHYSICAL"` | In your inbound workflow, **Apply Tag** = `{{ tag_weakest }}` |

These let you segment contacts in one step without writing per-band /
per-domain branching in GHL.

### Raw answers + metadata

| Field | Type | Notes |
|---|---|---|
| `answers` | object | Question-ID → option-value map. Keys are `D1`/`D2`/`D3`/`L1`–`L3`/`F1`–`F3`/`P1`–`P3`. Values are option codes (e.g. `Y`/`N`/`P`/`M`/`IP` etc.). Map only if you need fine-grained answer reporting; usually skip. |
| `completed_at` | ISO 8601 string | Quiz completion timestamp. |
| `source` | string | Always `"Q12_GAP_ANALYSIS"`. Use this in workflow filters to scope automations to this quiz only. |

---

## Recommended minimum GHL mapping (V1)

If you want to ship with the smallest custom-field surface, map only:

1. `email` → standard email (dedupe key)
2. `first_name` → standard first name
3. `tier` (or `band`) → one custom text field
4. `percent_ready` → one custom number field
5. `weakest_domain` → one custom text field
6. **Apply tag** = `tag_band`
7. **Apply tag** = `tag_weakest`

That gives you per-band and per-weakest-domain segmentation without needing
the full 30+ field map. The rest of the fields stay in the payload and you
can wire them up later as workflows demand them.

---

## When to update this doc

If `api/_lib/engine.ts :: toGHLPayload` changes (new field added, key renamed,
shape modified), update this doc in the same commit so the GHL operator and
the Q12 codebase stay in sync.
