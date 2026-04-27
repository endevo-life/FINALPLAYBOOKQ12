import type { AssessmentResult } from "./engine.js";
import { BRAND } from "./constants.js";

export interface ReportPayload {
  name: string;
  email: string;
  result: AssessmentResult;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const PREVIEW_TEXT =
  "Day 1 starts tomorrow. Here is what this week is really about.";

export const LOGO_CID = "endevo-logo";
export const FP_ICON_CID = "endevo-finalplaybook";
export const ENDEVO_ICON_CID = "endevo-favicon";
export const DLP_ICON_CID = "endevo-dlp-podcast";
export const NIKI_PORTRAIT_CID = "niki-portrait";
export const NIKI_DETAILS_CID = "niki-details";

export const BOOK_NIKI_URL =
  "https://link.endevo.life/widget/bookings/time-with-niki";

const FONT_DISPLAY = "'Sora','Segoe UI',Arial,sans-serif";
const FONT_BODY = "'Inter','Segoe UI',Arial,sans-serif";

const INK = "#0f172a";
const SOFT = "#334155";
const MUTED = "#475569";
const DIVIDER = "#e2e8f0";
const PAGE_BG = "#f1f5f9";
const ORANGE = "#f97316";
const ORANGE_DEEP = "#ea580c";
const NAVY_GRAD = "linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%)";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function firstName(full: string): string {
  const trimmed = full.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0];
}

function renderHtml(payload: ReportPayload): string {
  const fName = escapeHtml(firstName(payload.name));
  const plan = payload.result.plan;
  const dScore = (d: string) => payload.result.domainResults.find((x) => x.domain === d)?.score ?? 0;
  const dPct = (d: string) => payload.result.domainResults.find((x) => x.domain === d)?.percent ?? 0;

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
  </head>
  <body style="margin:0;padding:0;background:${PAGE_BG};font-family:${FONT_BODY};color:${INK};">
    <div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0;mso-hide:all;">
      ${escapeHtml(PREVIEW_TEXT)}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE_BG};padding:16px 12px;">
      <tr><td align="center">
        <table role="presentation" width="80%" cellpadding="0" cellspacing="0"
          style="width:80%;max-width:800px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">

          <!-- Header: Jesse avatar + ENDevo logo + tagline -->
          <tr><td style="background:${NAVY_GRAD};padding:14px 24px 12px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
              <tr>
                <td width="120" align="left" valign="middle" style="width:120px;">
                  <img src="cid:${FP_ICON_CID}" width="104" height="104" alt="ENDevo"
                       style="display:block;width:104px;height:104px;border-radius:50%;border:2px solid rgba(255,255,255,0.30);" />
                </td>
                <td align="center" valign="middle">
                  <img src="cid:${LOGO_CID}" width="220" alt="ENDevo"
                       style="display:block;margin:0 auto 4px;height:auto;" />
                  <div style="font-family:${FONT_DISPLAY};font-size:11px;letter-spacing:0.16em;color:rgba(255,255,255,0.85);text-transform:uppercase;font-weight:600;">
                    Digital Legacy Planning Made Easy
                  </div>
                </td>
                <td width="40" valign="middle" style="width:40px;">&nbsp;</td>
              </tr>
            </table>
          </td></tr>

          <!-- Greeting -->
          <tr><td style="padding:24px 36px 0;">
            <div style="font-family:${FONT_DISPLAY};font-size:22px;font-weight:700;color:${INK};">
              Hi ${fName},
            </div>
          </td></tr>

          <!-- Opening -->
          <tr><td style="padding:14px 36px 4px;font-family:${FONT_BODY};font-size:15px;line-height:1.6;color:${SOFT};">
            You just did something most people refuse to do. You looked at your own death honestly. Twelve questions. Four domains. Five minutes.
          </td></tr>

          <tr><td style="padding:14px 36px 4px;font-family:${FONT_BODY};font-size:15px;line-height:1.6;color:${SOFT};">
            Here is what came back.
          </td></tr>

          <!-- Score line (percentage) -->
          <tr><td style="padding:14px 36px 4px;font-family:${FONT_BODY};font-size:17px;line-height:1.55;color:${SOFT};">
            Your <strong style="color:${INK};">Legacy Readiness Score</strong>:
            <strong style="color:${ORANGE_DEEP};font-size:22px;">${payload.result.percentReady}%</strong>
          </td></tr>

          <!-- Domain breakdown -->
          <tr><td style="padding:18px 36px 4px;">
            <div style="font-family:${FONT_DISPLAY};font-size:13px;color:${ORANGE_DEEP};letter-spacing:0.1em;text-transform:uppercase;font-weight:700;margin-bottom:6px;">
              Domain breakdown
            </div>
          </td></tr>
          <tr><td style="padding:2px 36px;font-family:${FONT_BODY};font-size:15px;line-height:1.55;color:${SOFT};">
            <strong style="color:${INK};display:inline-block;min-width:96px;">Digital:</strong>
            <strong style="color:${ORANGE_DEEP};">${dPct("Digital")}%</strong>
            <span style="color:${MUTED};">&nbsp;&middot;&nbsp; ${dScore("Digital")}/6</span>
          </td></tr>
          <tr><td style="padding:2px 36px;font-family:${FONT_BODY};font-size:15px;line-height:1.55;color:${SOFT};">
            <strong style="color:${INK};display:inline-block;min-width:96px;">Legal:</strong>
            <strong style="color:${ORANGE_DEEP};">${dPct("Legal")}%</strong>
            <span style="color:${MUTED};">&nbsp;&middot;&nbsp; ${dScore("Legal")}/6</span>
          </td></tr>
          <tr><td style="padding:2px 36px;font-family:${FONT_BODY};font-size:15px;line-height:1.55;color:${SOFT};">
            <strong style="color:${INK};display:inline-block;min-width:96px;">Financial:</strong>
            <strong style="color:${ORANGE_DEEP};">${dPct("Financial")}%</strong>
            <span style="color:${MUTED};">&nbsp;&middot;&nbsp; ${dScore("Financial")}/6</span>
          </td></tr>
          <tr><td style="padding:2px 36px 14px;font-family:${FONT_BODY};font-size:15px;line-height:1.55;color:${SOFT};">
            <strong style="color:${INK};display:inline-block;min-width:96px;">Physical:</strong>
            <strong style="color:${ORANGE_DEEP};">${dPct("Physical")}%</strong>
            <span style="color:${MUTED};">&nbsp;&middot;&nbsp; ${dScore("Physical")}/6</span>
          </td></tr>

          <!-- The deal -->
          <tr><td style="padding:14px 36px 4px;font-family:${FONT_BODY};font-size:15px;line-height:1.6;color:${SOFT};border-top:1px solid ${DIVIDER};">
            Here is the deal for the next 7 days. One action a day. Each one takes 10 to 15 minutes. Built for your specific gaps, in the right order. By Day 7 you will have done more legacy work than the majority of people. Let&rsquo;s break through this taboo topic together.
          </td></tr>

          <tr><td style="padding:10px 36px 4px;font-family:${FONT_BODY};font-size:15px;line-height:1.6;color:${SOFT};">
            This is not a content series. This is a project management plan. As your <strong style="color:${INK};">ENDevo Project Manager</strong>, I will walk you through the daily action items starting Day 2.
          </td></tr>

          <!-- 7-day plan -->
          <tr><td style="padding:18px 36px 4px;">
            <div style="font-family:${FONT_DISPLAY};font-size:13px;color:${ORANGE_DEEP};letter-spacing:0.1em;text-transform:uppercase;font-weight:700;margin-bottom:6px;">
              Your 7-day plan
            </div>
          </td></tr>
          <tr><td style="padding:2px 36px;font-family:${FONT_BODY};font-size:15px;line-height:1.55;color:${SOFT};">
            <strong style="color:${INK};">Day 1:</strong> ${escapeHtml(plan[0].action.title)}
          </td></tr>
          <tr><td style="padding:2px 36px;font-family:${FONT_BODY};font-size:15px;line-height:1.55;color:${SOFT};">
            <strong style="color:${INK};">Day 2:</strong> ${escapeHtml(plan[1].action.title)}
          </td></tr>
          <tr><td style="padding:2px 36px;font-family:${FONT_BODY};font-size:15px;line-height:1.55;color:${SOFT};">
            <strong style="color:${INK};">Day 3:</strong> ${escapeHtml(plan[2].action.title)}
          </td></tr>
          <tr><td style="padding:2px 36px;font-family:${FONT_BODY};font-size:15px;line-height:1.55;color:${SOFT};">
            <strong style="color:${INK};">Day 4:</strong> ${escapeHtml(plan[3].action.title)}
          </td></tr>
          <tr><td style="padding:2px 36px;font-family:${FONT_BODY};font-size:15px;line-height:1.55;color:${SOFT};">
            <strong style="color:${INK};">Day 5:</strong> ${escapeHtml(plan[4].action.title)}
          </td></tr>
          <tr><td style="padding:2px 36px;font-family:${FONT_BODY};font-size:15px;line-height:1.55;color:${SOFT};">
            <strong style="color:${INK};">Day 6:</strong> ${escapeHtml(plan[5].action.title)}
          </td></tr>
          <tr><td style="padding:2px 36px 14px;font-family:${FONT_BODY};font-size:15px;line-height:1.55;color:${SOFT};">
            <strong style="color:${INK};">Day 7:</strong> Consolidation + your next step
          </td></tr>

          <!-- Closing -->
          <tr><td style="padding:18px 36px 4px;font-family:${FONT_BODY};font-size:15px;line-height:1.6;color:${SOFT};">
            Day 1 lands in your inbox tomorrow morning. Get ready to make progress and protect your legacy. I&rsquo;ll be with you every step of the way.
          </td></tr>

          <!-- CTA button -->
          <tr><td align="center" style="padding:22px 36px 8px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr><td align="center" style="background:${ORANGE};border-radius:100px;box-shadow:0 6px 20px rgba(249,115,22,0.35);">
                <a href="${BOOK_NIKI_URL}"
                   style="display:inline-block;padding:14px 28px;font-family:${FONT_DISPLAY};font-weight:700;font-size:14px;color:#ffffff;text-decoration:none;letter-spacing:0.02em;">
                  Book a 1:1 with your Project Manager &rarr;
                </a>
              </td></tr>
            </table>
          </td></tr>

          <tr><td style="padding:6px 36px 18px;font-family:${FONT_BODY};font-size:13px;line-height:1.55;color:${MUTED};text-align:center;">
            Questions about the plan? Just reply &mdash; I read every email.
          </td></tr>

          <!-- Signature -->
          <tr><td style="padding:22px 36px 24px;border-top:1px solid ${DIVIDER};">
            <div style="font-family:${FONT_BODY};font-size:14px;color:${MUTED};margin-bottom:14px;">
              Warm regards,
            </div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
              <tr>
                <td width="200" valign="top" align="center" style="width:200px;padding:0 16px 0 0;">
                  <img src="cid:${NIKI_PORTRAIT_CID}" alt="Niki D. Weiss"
                       style="display:block;max-width:190px;width:100%;height:auto;margin:0 auto;" />
                </td>
                <td valign="top" style="padding:0;">
                  <a href="tel:+12152628581" style="text-decoration:none;display:inline-block;">
                    <img src="cid:${NIKI_DETAILS_CID}" alt="Niki D. Weiss - Founder, Endevo Inc. | Creator, My Final Playbook App | Host, Digital Legacy Podcast | 215-262-8581"
                         style="display:block;max-width:340px;width:100%;height:auto;margin:0 0 12px;" />
                  </a>

                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                    <tr>
                      <td style="padding:0 3px 0 0;">
                        <a href="https://endevo.life" style="text-decoration:none;" title="Endevo">
                          <img src="cid:${ENDEVO_ICON_CID}" width="28" height="28" alt="Endevo"
                               style="display:block;width:28px;height:28px;border:0;border-radius:6px;" />
                        </a>
                      </td>
                      <td style="padding:0 3px;">
                        <a href="https://digitallegacypodcast.com" style="text-decoration:none;" title="Digital Legacy Podcast">
                          <img src="cid:${DLP_ICON_CID}" width="28" height="28" alt="Digital Legacy Podcast"
                               style="display:block;width:28px;height:28px;border:0;border-radius:6px;" />
                        </a>
                      </td>
                      <td style="padding:0 3px;">
                        <a href="https://finalplaybook.com" style="text-decoration:none;" title="Finalplaybook">
                          <img src="cid:${FP_ICON_CID}" width="28" height="28" alt="Finalplaybook"
                               style="display:block;width:28px;height:28px;border:0;border-radius:6px;" />
                        </a>
                      </td>
                      <td style="padding:0 3px;">
                        <a href="https://www.instagram.com/endevo_digitallegacy" style="text-decoration:none;" title="Instagram">
                          <img src="https://img.icons8.com/fluency/96/instagram-new.png" width="28" height="28" alt="Instagram" style="display:block;width:28px;height:28px;border:0;" />
                        </a>
                      </td>
                      <td style="padding:0 3px;">
                        <a href="https://www.facebook.com/endevo.digitallegacy" style="text-decoration:none;" title="Facebook">
                          <img src="https://img.icons8.com/fluency/96/facebook-new.png" width="28" height="28" alt="Facebook" style="display:block;width:28px;height:28px;border:0;" />
                        </a>
                      </td>
                      <td style="padding:0 3px;">
                        <a href="https://tiktok.com/@endevo_digitallegacy" style="text-decoration:none;" title="TikTok">
                          <img src="https://img.icons8.com/color/96/tiktok--v1.png" width="28" height="28" alt="TikTok" style="display:block;width:28px;height:28px;border:0;" />
                        </a>
                      </td>
                      <td style="padding:0 3px;">
                        <a href="https://www.linkedin.com/company/endevo-digitallegacy/" style="text-decoration:none;" title="LinkedIn">
                          <img src="https://img.icons8.com/fluency/96/linkedin.png" width="28" height="28" alt="LinkedIn" style="display:block;width:28px;height:28px;border:0;" />
                        </a>
                      </td>
                      <td style="padding:0 0 0 3px;">
                        <a href="https://www.youtube.com/@DigitalLegacyPodcast/shorts" style="text-decoration:none;" title="YouTube">
                          <img src="https://img.icons8.com/fluency/96/youtube-play.png" width="28" height="28" alt="YouTube" style="display:block;width:28px;height:28px;border:0;" />
                        </a>
                      </td>
                    </tr>
                  </table>

                  <div style="font-family:${FONT_BODY};font-size:13px;color:${ORANGE_DEEP};font-style:italic;margin:14px 0 0;">
                    &ldquo;Live Fully. Die Ready.&rdquo;
                  </div>
                </td>
              </tr>
            </table>
          </td></tr>

          <!-- Footer -->
          <tr><td style="background:${NAVY_GRAD};padding:14px 36px 14px;text-align:center;">
            <img src="cid:${LOGO_CID}"
                 width="110" alt="ENDevo" style="display:block;margin:0 auto 6px;height:auto;" />
            <div style="font-family:${FONT_BODY};font-size:11px;color:rgba(255,255,255,0.7);line-height:1.5;">
              <a href="${BRAND.privacyUrl}" style="color:rgba(255,255,255,0.8);text-decoration:underline;">Privacy Policy</a>
            </div>
          </td></tr>

        </table>
      </td></tr>
    </table>
  </body>
</html>
  `.trim();
}

function renderText(payload: ReportPayload): string {
  const fName = firstName(payload.name);
  const plan = payload.result.plan;
  const dScore = (d: string) =>
    payload.result.domainResults.find((x) => x.domain === d)?.score ?? 0;
  const dPct = (d: string) =>
    payload.result.domainResults.find((x) => x.domain === d)?.percent ?? 0;

  return [
    `Hi ${fName},`,
    ``,
    `You just did something most people refuse to do. You looked at your own death honestly. Twelve questions. Four domains. Five minutes.`,
    ``,
    `Here is what came back.`,
    ``,
    `Your Legacy Readiness Score: ${payload.result.percentReady}%`,
    ``,
    `Domain breakdown:`,
    `Digital: ${dPct("Digital")}% (${dScore("Digital")}/6)`,
    `Legal: ${dPct("Legal")}% (${dScore("Legal")}/6)`,
    `Financial: ${dPct("Financial")}% (${dScore("Financial")}/6)`,
    `Physical: ${dPct("Physical")}% (${dScore("Physical")}/6)`,
    ``,
    `Here is the deal for the next 7 days. One action a day. Each one takes 10 to 15 minutes. Built for your specific gaps, in the right order. By Day 7 you will have done more legacy work than the majority of people. Let's break through this taboo topic together.`,
    ``,
    `This is not a content series. This is a project management plan. As your ENDevo Project Manager, I will walk you through the daily action items starting Day 2.`,
    ``,
    `Your 7-day plan:`,
    `Day 1: ${plan[0].action.title}`,
    `Day 2: ${plan[1].action.title}`,
    `Day 3: ${plan[2].action.title}`,
    `Day 4: ${plan[3].action.title}`,
    `Day 5: ${plan[4].action.title}`,
    `Day 6: ${plan[5].action.title}`,
    `Day 7: Consolidation + your next step`,
    ``,
    `Day 1 lands in your inbox tomorrow morning. Get ready to make progress and protect your legacy. I'll be with you every step of the way.`,
    ``,
    `Book a 1:1 with your Project Manager: ${BOOK_NIKI_URL}`,
    ``,
    `Questions about the plan? Just reply — I read every email.`,
    ``,
    `Warm regards,`,
    ``,
    `NIKI D. WEISS`,
    `Founder, Endevo Inc.`,
    `Creator, My Final Playbook App`,
    `Host, Digital Legacy Podcast`,
    `Phone: 215-262-8581`,
    `"Live Fully. Die Ready."`,
    ``,
    `Endevo Inc.: https://endevo.life`,
    `Digital Legacy Podcast: https://digitallegacypodcast.com`,
    `Finalplaybook: https://finalplaybook.com`,
    ``,
    `--`,
    `Privacy Policy: ${BRAND.privacyUrl}`,
  ].join("\n");
}

export function renderReport(payload: ReportPayload): RenderedEmail {
  const subject = `Your Score: ${payload.result.percentReady}/100 - Your 7-day plan is ready`;
  return {
    subject,
    html: renderHtml(payload),
    text: renderText(payload),
  };
}
