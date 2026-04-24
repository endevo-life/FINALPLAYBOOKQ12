import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  runAssessment,
  toGHLPayload,
  QUESTIONS,
  type Answer,
} from "../src/lib/engine";

interface Body {
  name?: unknown;
  email?: unknown;
  answers?: unknown;
}

function validate(body: Body): { name: string; email: string; answers: Answer[] } | string {
  if (typeof body.name !== "string" || !body.name.trim()) return "Missing name.";
  if (typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return "Invalid email.";
  }
  if (!Array.isArray(body.answers) || body.answers.length !== QUESTIONS.length) {
    return "Invalid answers.";
  }
  const answers: Answer[] = [];
  for (const raw of body.answers) {
    if (
      typeof raw !== "object" ||
      raw === null ||
      typeof (raw as { questionId?: unknown }).questionId !== "string" ||
      typeof (raw as { value?: unknown }).value !== "string"
    ) {
      return "Invalid answer shape.";
    }
    answers.push(raw as Answer);
  }
  return { name: body.name.trim(), email: body.email.trim(), answers };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const validated = validate(req.body ?? {});
  if (typeof validated === "string") {
    res.status(400).json({ error: validated });
    return;
  }

  const { name, email, answers } = validated;
  const result = runAssessment(name, answers);
  const payload = toGHLPayload(result, email, answers);

  const url = process.env.GHL_WEBHOOK_URL;
  if (!url) {
    res.status(500).json({ error: "GHL_WEBHOOK_URL not configured." });
    return;
  }

  try {
    const ghlRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!ghlRes.ok) {
      const body = await ghlRes.text().catch(() => "");
      console.warn("GHL webhook non-OK:", ghlRes.status, body);
      res.status(502).json({ error: "Upstream webhook failed." });
      return;
    }
  } catch (err) {
    console.error("GHL webhook failed:", err);
    res.status(502).json({ error: "Upstream webhook failed." });
    return;
  }

  res.status(200).json({ ok: true });
}
