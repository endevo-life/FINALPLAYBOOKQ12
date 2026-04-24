import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";
import {
  runAssessment,
  getStaticWrapper,
  toGHLPayload,
  QUESTIONS,
  type Answer,
} from "../src/lib/engine";
import { buildPlannerPdf } from "./_lib/pdf";
import { renderEmailHtml, renderEmailText } from "./_lib/emailHtml";

interface SendEmailBody {
  name?: unknown;
  email?: unknown;
  answers?: unknown;
}

function validate(body: SendEmailBody): { name: string; email: string; answers: Answer[] } | string {
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
    const a = raw as Answer;
    const q = QUESTIONS.find((x) => x.id === a.questionId);
    if (!q) return `Unknown question: ${a.questionId}`;
    if (!q.options.some((o) => o.value === a.value)) {
      return `Invalid value for ${a.questionId}: ${a.value}`;
    }
    answers.push(a);
  }
  return { name: body.name.trim(), email: body.email.trim(), answers };
}

function buildRawMimeEmail(opts: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  pdf: Uint8Array;
  pdfFilename: string;
}): Buffer {
  const boundaryMixed = `mixed_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;
  const boundaryAlt = `alt_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;

  const pdfB64 = Buffer.from(opts.pdf).toString("base64").match(/.{1,76}/g)?.join("\r\n") ?? "";

  const lines = [
    `From: ${opts.from}`,
    `To: ${opts.to}`,
    `Subject: ${opts.subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundaryMixed}"`,
    "",
    `--${boundaryMixed}`,
    `Content-Type: multipart/alternative; boundary="${boundaryAlt}"`,
    "",
    `--${boundaryAlt}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    opts.text,
    "",
    `--${boundaryAlt}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    opts.html,
    "",
    `--${boundaryAlt}--`,
    "",
    `--${boundaryMixed}`,
    "Content-Type: application/pdf",
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${opts.pdfFilename}"`,
    "",
    pdfB64,
    "",
    `--${boundaryMixed}--`,
    "",
  ];

  return Buffer.from(lines.join("\r\n"), "utf-8");
}

async function fireGHLWebhook(payload: unknown): Promise<void> {
  const url = process.env.GHL_WEBHOOK_URL;
  if (!url) return;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn("GHL webhook non-OK:", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.warn("GHL webhook failed:", err);
  }
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
  const wrapper = getStaticWrapper(result);

  const pdf = await buildPlannerPdf(result, wrapper);
  const html = renderEmailHtml(result, wrapper);
  const text = renderEmailText(result, wrapper);

  const from = process.env.SES_FROM;
  if (!from) {
    res.status(500).json({ error: "SES_FROM not configured." });
    return;
  }

  const ses = new SESClient({ region: process.env.AWS_REGION ?? "us-east-1" });
  const raw = buildRawMimeEmail({
    from,
    to: email,
    subject: `${name}, your ENDevo 7-day plan is here`,
    html,
    text,
    pdf,
    pdfFilename: `endevo-7day-plan-${name.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "plan"}.pdf`,
  });

  try {
    await ses.send(new SendRawEmailCommand({ RawMessage: { Data: raw } }));
  } catch (err) {
    console.error("SES send failed:", err);
    res.status(502).json({ error: "Email delivery failed. Please try again." });
    return;
  }

  await fireGHLWebhook(toGHLPayload(result, email, answers));

  res.status(200).json({
    ok: true,
    band: result.band,
    percentReady: result.percentReady,
  });
}
