import type { AssessmentResult, JesseWrapper } from "../../src/lib/engine";

const BAND_COLORS: Record<string, string> = {
  "AT RISK": "#c53030",
  "SOMEWHAT PREPARED": "#d69e2e",
  "PREPARED": "#2f855a",
};

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderEmailHtml(result: AssessmentResult, wrapper: JesseWrapper): string {
  const bandColor = BAND_COLORS[result.band] ?? "#1a1a1a";
  const domainRows = result.domainResults
    .map(
      (d) => `
        <tr>
          <td style="padding:6px 0;font-size:14px;"><strong>${d.rank}. ${escape(d.domain)}</strong></td>
          <td style="padding:6px 0;font-size:14px;text-align:right;color:#555;">${d.score}/6 · ${d.percent}%</td>
        </tr>`
    )
    .join("");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Your ENDevo 7-Day Plan</title>
</head>
<body style="margin:0;padding:0;background:#f7f5f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f1;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e4e0d8;border-radius:10px;overflow:hidden;">
        <tr>
          <td style="padding:18px 24px;border-bottom:1px solid #e4e0d8;" align="center">
            <div style="font-size:20px;font-weight:700;letter-spacing:0.02em;">ENDevo</div>
            <div style="font-size:12px;color:#555;margin-top:2px;">Digital Legacy Planning Made Easy</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 12px;">
            <div style="text-transform:uppercase;letter-spacing:0.12em;font-size:11px;color:#888;">Your Q12 result</div>
            <h1 style="margin:4px 0 8px;font-size:28px;line-height:1.2;">${escape(result.name)}, here is your 7-day plan.</h1>
            <div style="font-size:36px;font-weight:700;color:${bandColor};margin:12px 0 4px;">${result.percentReady}% Ready</div>
            <div style="font-size:14px;font-weight:600;color:${bandColor};">Band: ${escape(result.band)}</div>
          </td>
        </tr>

        <tr>
          <td style="padding:12px 32px 8px;">
            <p style="font-size:15px;line-height:1.55;margin:0;">${escape(wrapper.opening)}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 32px 8px;">
            <div style="font-size:13px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Your four domains</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${domainRows}
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 32px;">
            <div style="background:#f7f5f1;border-radius:8px;padding:16px 18px;font-size:14px;line-height:1.55;">
              <strong>Your full 7-day plan is attached as a PDF.</strong><br/>
              Open it when you are ready. Day 1 starts tomorrow.
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:0 32px 28px;font-size:13px;color:#888;line-height:1.5;">
            You are receiving this because you completed the ENDevo Q12 Gap Analysis. Reply to this email if you have questions.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function renderEmailText(result: AssessmentResult, wrapper: JesseWrapper): string {
  const domainLines = result.domainResults
    .map((d) => `  ${d.rank}. ${d.domain} — ${d.score}/6 (${d.percent}%)`)
    .join("\n");
  return `${result.name}, here is your 7-day plan.

${result.percentReady}% Ready — Band: ${result.band}

${wrapper.opening}

Your four domains:
${domainLines}

Your full 7-day plan is attached as a PDF. Day 1 starts tomorrow.

— ENDevo
`;
}
