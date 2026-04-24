import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { AssessmentResult, JesseWrapper } from "../../src/lib/engine";

const BAND_COLORS: Record<string, [number, number, number]> = {
  "AT RISK": [197 / 255, 48 / 255, 48 / 255],
  "SOMEWHAT PREPARED": [214 / 255, 158 / 255, 46 / 255],
  "PREPARED": [47 / 255, 133 / 255, 90 / 255],
};

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawWrapped(
  page: PDFPage,
  text: string,
  opts: { x: number; y: number; maxWidth: number; font: PDFFont; size: number; color?: [number, number, number]; lineHeight?: number }
): number {
  const { x, y, maxWidth, font, size, color = [0.1, 0.1, 0.1], lineHeight = 1.35 } = opts;
  const lines = wrapText(text, font, size, maxWidth);
  let cursorY = y;
  for (const line of lines) {
    page.drawText(line, { x, y: cursorY, size, font, color: rgb(...color) });
    cursorY -= size * lineHeight;
  }
  return cursorY;
}

export async function buildPlannerPdf(
  result: AssessmentResult,
  wrapper: JesseWrapper
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const bandColor = BAND_COLORS[result.band] ?? [0.1, 0.1, 0.1];

  // ---------- Cover page ----------
  const cover = doc.addPage([612, 792]);
  cover.drawRectangle({ x: 0, y: 732, width: 612, height: 60, color: rgb(...bandColor) });
  cover.drawText("ENDevo Q12", { x: 48, y: 758, size: 18, font: bold, color: rgb(1, 1, 1) });
  cover.drawText("Your 7-Day Plan", { x: 48, y: 740, size: 12, font: regular, color: rgb(1, 1, 1) });

  cover.drawText(`${result.name}'s Gap Analysis`, {
    x: 48,
    y: 680,
    size: 28,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });

  cover.drawText(`${result.percentReady}% Ready`, {
    x: 48,
    y: 636,
    size: 44,
    font: bold,
    color: rgb(...bandColor),
  });

  cover.drawText(`Band: ${result.band}`, {
    x: 48,
    y: 608,
    size: 14,
    font: bold,
    color: rgb(...bandColor),
  });

  // Domain breakdown
  cover.drawText("Your four domains", {
    x: 48,
    y: 560,
    size: 14,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });

  let dy = 536;
  for (const d of result.domainResults) {
    cover.drawText(`${d.rank}. ${d.domain}`, {
      x: 48,
      y: dy,
      size: 12,
      font: bold,
      color: rgb(0.1, 0.1, 0.1),
    });
    cover.drawText(`${d.score}/6  (${d.percent}%)`, {
      x: 200,
      y: dy,
      size: 12,
      font: regular,
      color: rgb(0.33, 0.33, 0.33),
    });
    const barWidth = (d.score / 6) * 220;
    cover.drawRectangle({ x: 320, y: dy - 2, width: 220, height: 10, color: rgb(0.9, 0.88, 0.84) });
    cover.drawRectangle({ x: 320, y: dy - 2, width: barWidth, height: 10, color: rgb(...bandColor) });
    dy -= 26;
  }

  // Opening letter from Jesse
  cover.drawText("A note from Jesse", {
    x: 48,
    y: dy - 16,
    size: 14,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });
  drawWrapped(cover, wrapper.opening, {
    x: 48,
    y: dy - 36,
    maxWidth: 516,
    font: regular,
    size: 11,
    lineHeight: 1.45,
  });

  // ---------- Day pages ----------
  const dayNotes = [
    wrapper.day1Note,
    wrapper.day2Note,
    wrapper.day3Note,
    wrapper.day4Note,
    wrapper.day5Note,
    wrapper.day6Note,
    wrapper.day7Closing,
  ];

  for (let i = 0; i < result.plan.length; i++) {
    const assignment = result.plan[i];
    const page = doc.addPage([612, 792]);
    const isLast = i === result.plan.length - 1;

    page.drawRectangle({ x: 0, y: 732, width: 612, height: 60, color: rgb(...bandColor) });
    page.drawText(`Day ${assignment.day}`, { x: 48, y: 758, size: 22, font: bold, color: rgb(1, 1, 1) });
    page.drawText(
      assignment.domain === "ALL" ? "All domains" : assignment.domain,
      { x: 48, y: 740, size: 12, font: regular, color: rgb(1, 1, 1) }
    );
    page.drawText(`${assignment.action.time}`, {
      x: 540,
      y: 758,
      size: 12,
      font: bold,
      color: rgb(1, 1, 1),
    });

    let y = 680;
    y = drawWrapped(page, assignment.action.title, {
      x: 48,
      y,
      maxWidth: 516,
      font: bold,
      size: 20,
      lineHeight: 1.25,
    });
    y -= 14;

    page.drawText("Why this matters", {
      x: 48,
      y,
      size: 11,
      font: bold,
      color: rgb(...bandColor),
    });
    y -= 18;
    y = drawWrapped(page, assignment.action.socialProof, {
      x: 48,
      y,
      maxWidth: 516,
      font: regular,
      size: 11,
      lineHeight: 1.45,
    });
    y -= 14;

    page.drawText("How to do it", {
      x: 48,
      y,
      size: 11,
      font: bold,
      color: rgb(...bandColor),
    });
    y -= 18;
    y = drawWrapped(page, assignment.action.howTo, {
      x: 48,
      y,
      maxWidth: 516,
      font: regular,
      size: 11,
      lineHeight: 1.45,
    });
    y -= 24;

    page.drawLine({
      start: { x: 48, y },
      end: { x: 564, y },
      thickness: 0.5,
      color: rgb(0.85, 0.82, 0.78),
    });
    y -= 18;

    page.drawText(isLast ? "Closing note from Jesse" : "Jesse's note", {
      x: 48,
      y,
      size: 11,
      font: bold,
      color: rgb(0.33, 0.33, 0.33),
    });
    y -= 16;
    drawWrapped(page, dayNotes[i], {
      x: 48,
      y,
      maxWidth: 516,
      font: regular,
      size: 11,
      lineHeight: 1.45,
    });

    page.drawText(`ENDevo Q12 — ${result.name}`, {
      x: 48,
      y: 40,
      size: 9,
      font: regular,
      color: rgb(0.5, 0.5, 0.5),
    });
    page.drawText(`Day ${assignment.day} of 7`, {
      x: 512,
      y: 40,
      size: 9,
      font: regular,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  return doc.save();
}
