import {
  PDFDocument, StandardFonts, rgb,
  pushGraphicsState, popGraphicsState,
  moveTo, lineTo, closePath, appendBezierCurve, clip, endPath,
  fill as fillOp, setFillingColor,
  type PDFFont, type PDFImage, type PDFPage,
} from "pdf-lib";
import fs from "fs";
import path from "path";
import type { AssessmentResult, DayAssignment, Domain, JesseWrapper } from "./engine.js";

// ── Brand palette ────────────────────────────────────────────────────────────
const NAVY = rgbTriple(15, 23, 42);
const ORANGE = rgbTriple(249, 115, 22);
const ORANGE_DEEP = rgbTriple(234, 88, 12);
const INK = rgbTriple(15, 23, 42);
const SOFT = rgbTriple(51, 65, 85);
const MUTED = rgbTriple(71, 85, 105);
const LABEL = rgbTriple(100, 116, 139);
const DIVIDER = rgbTriple(226, 232, 240);
const BAR_TRACK = rgbTriple(237, 240, 244);
const PEACH_BG = rgbTriple(254, 242, 230);
const WHITE = rgbTriple(255, 255, 255);

const DOMAIN_COLORS: Record<Domain, [number, number, number]> = {
  Digital: rgbTriple(59, 130, 246),
  Legal: rgbTriple(45, 212, 191),
  Financial: rgbTriple(249, 115, 22),
  Physical: rgbTriple(34, 197, 94),
};

const BAND_COLORS: Record<string, [number, number, number]> = {
  "AT RISK": rgbTriple(184, 52, 27),
  "SOMEWHAT PREPARED": rgbTriple(217, 74, 40),
  PREPARED: rgbTriple(201, 168, 76),
};

function rgbTriple(r: number, g: number, b: number): [number, number, number] {
  return [r / 255, g / 255, b / 255];
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function sanitize(s: string): string {
  return s
    .replace(/→/g, "->")
    .replace(/←/g, "<-")
    .replace(/—/g, "--")
    .replace(/–/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/•/g, "*")
    .replace(/ /g, " ");
}

function loadPng(filename: string): Buffer {
  return fs.readFileSync(path.join(process.cwd(), "public", filename));
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const clean = sanitize(text);
  const lines: string[] = [];
  for (const rawLine of clean.split("\n")) {
    const words = rawLine.split(/\s+/).filter(Boolean);
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
    if (words.length === 0) lines.push("");
  }
  return lines;
}

interface DrawTextOpts {
  x: number;
  y: number;
  maxWidth: number;
  font: PDFFont;
  size: number;
  color?: [number, number, number];
  lineHeight?: number;
}

function drawWrapped(page: PDFPage, text: string, opts: DrawTextOpts): number {
  const { x, y, maxWidth, font, size, color = INK, lineHeight = 1.4 } = opts;
  const lines = wrapText(text, font, size, maxWidth);
  let cursorY = y;
  for (const line of lines) {
    page.drawText(line, { x, y: cursorY, size, font, color: rgb(color[0], color[1], color[2]) });
    cursorY -= size * lineHeight;
  }
  return cursorY;
}

function drawSingleLine(page: PDFPage, text: string, opts: {
  x: number;
  y: number;
  font: PDFFont;
  size: number;
  color?: [number, number, number];
}) {
  const { x, y, font, size, color = INK } = opts;
  page.drawText(sanitize(text), { x, y, size, font, color: rgb(color[0], color[1], color[2]) });
}

function fillRect(page: PDFPage, x: number, y: number, w: number, h: number, c: [number, number, number]) {
  page.drawRectangle({ x, y, width: w, height: h, color: rgb(c[0], c[1], c[2]) });
}

function strokeRect(page: PDFPage, x: number, y: number, w: number, h: number, c: [number, number, number], thickness = 1) {
  page.drawRectangle({ x, y, width: w, height: h, borderColor: rgb(c[0], c[1], c[2]), borderWidth: thickness });
}

function drawCircleFilled(page: PDFPage, cx: number, cy: number, r: number, c: [number, number, number]) {
  page.drawCircle({ x: cx, y: cy, size: r, color: rgb(c[0], c[1], c[2]) });
}

function drawCircleStroked(page: PDFPage, cx: number, cy: number, r: number, c: [number, number, number], thickness = 1) {
  page.drawCircle({ x: cx, y: cy, size: r, borderColor: rgb(c[0], c[1], c[2]), borderWidth: thickness });
}

/**
 * Draw a filled pie slice in native PDF coords (y-up). Angles in degrees, math
 * convention (0° = east, 90° = north). Pass startDeg > endDeg to sweep clockwise
 * (e.g. startDeg=90 endDeg=0 draws top-right quadrant).
 *
 * Uses raw pdf-lib operators so no drawSvgPath y-flip ambiguity.
 */
function drawPieSlice(
  page: PDFPage,
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
  color: [number, number, number]
): void {
  const sweep = Math.abs(endDeg - startDeg);
  const segs = Math.max(16, Math.ceil(sweep / 2));

  const ops = [
    pushGraphicsState(),
    setFillingColor(rgb(color[0], color[1], color[2])),
    moveTo(cx, cy),
  ];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const deg = startDeg + t * (endDeg - startDeg);
    const rad = (deg * Math.PI) / 180;
    ops.push(lineTo(cx + r * Math.cos(rad), cy + r * Math.sin(rad)));
  }
  ops.push(closePath(), fillOp(), popGraphicsState());
  page.pushOperators(...ops);
}

/**
 * Draw an image clipped to a circle. Uses pdf-lib's raw graphics operators
 * to set a circular clipping path, draw the image inside, then pop state.
 */
function drawClippedImageCircle(
  page: PDFPage,
  img: PDFImage,
  cx: number,
  cy: number,
  r: number
): void {
  const k = 0.5522847498; // bezier control for circle quadrants
  page.pushOperators(
    pushGraphicsState(),
    moveTo(cx + r, cy),
    appendBezierCurve(cx + r, cy + r * k, cx + r * k, cy + r, cx, cy + r),
    appendBezierCurve(cx - r * k, cy + r, cx - r, cy + r * k, cx - r, cy),
    appendBezierCurve(cx - r, cy - r * k, cx - r * k, cy - r, cx, cy - r),
    appendBezierCurve(cx + r * k, cy - r, cx + r, cy - r * k, cx + r, cy),
    closePath(),
    clip(),
    endPath()
  );
  page.drawImage(img, {
    x: cx - r,
    y: cy - r,
    width: 2 * r,
    height: 2 * r,
  });
  page.pushOperators(popGraphicsState());
}

function formatDate(d: Date): string {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// ── Navy header/footer (shared across pages) ─────────────────────────────────
function drawCoverHeader(page: PDFPage, result: AssessmentResult, logo: PDFImage, fonts: Fonts) {
  const { bold, regular } = fonts;
  // Navy bar
  fillRect(page, 0, 732, 612, 60, NAVY);
  // Logo left
  const logoH = 36;
  const logoRatio = logo.width / logo.height;
  page.drawImage(logo, { x: 48, y: 748, width: logoH * logoRatio, height: logoH });
  // Title right
  drawSingleLine(page, "Legacy Readiness Assessment", {
    x: 360, y: 762, font: bold, size: 14, color: WHITE,
  });
  drawSingleLine(page, `${result.name} · ${formatDate(new Date())}`, {
    x: 360, y: 745, font: regular, size: 10, color: [1, 1, 1],
  });
  // Orange divider
  fillRect(page, 0, 728, 612, 4, ORANGE);
}

function drawDayPageHeader(page: PDFPage, result: AssessmentResult, bandLabel: string, logo: PDFImage, fonts: Fonts) {
  const { bold, regular } = fonts;
  // Navy bar
  fillRect(page, 0, 722, 612, 70, NAVY);
  // Title left
  drawSingleLine(page, "Your 7-Day Legacy Plan", {
    x: 48, y: 762, font: bold, size: 18, color: WHITE,
  });
  drawSingleLine(page, `Prepared for ${result.name} · ${bandLabel}`, {
    x: 48, y: 742, font: regular, size: 11, color: [1, 1, 1],
  });
  // Logo right
  const logoH = 30;
  const logoRatio = logo.width / logo.height;
  const logoW = logoH * logoRatio;
  page.drawImage(logo, { x: 612 - 48 - logoW, y: 747, width: logoW, height: logoH });
}

function drawFooter(page: PDFPage, logo: PDFImage, fonts: Fonts, coverVariant = false) {
  const { regular, bold } = fonts;
  if (coverVariant) {
    // Cover footer: disclaimer text only, no navy bar
    drawSingleLine(page, "This report is for educational purposes only. Not legal or financial advice. Jesse by ENDevo - https://endevo.life", {
      x: 48, y: 30, font: regular, size: 8, color: LABEL,
    });
    return;
  }
  // Day-page footer: navy bar with URL + small logo
  fillRect(page, 0, 0, 612, 50, NAVY);
  drawSingleLine(page, "https://endevo.life", {
    x: 48, y: 28, font: bold, size: 11, color: ORANGE,
  });
  drawSingleLine(page, "ENDevo - Plan. Protect. Peace.", {
    x: 48, y: 12, font: regular, size: 9, color: [1, 1, 1],
  });
  const logoH = 22;
  const logoRatio = logo.width / logo.height;
  const logoW = logoH * logoRatio;
  page.drawImage(logo, { x: 612 - 48 - logoW, y: 14, width: logoW, height: logoH });
}

// ── Cover page ───────────────────────────────────────────────────────────────
interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
}

function drawCoverPage(page: PDFPage, result: AssessmentResult, bandLabel: string, tagline: string, logo: PDFImage, jesse: PDFImage, fonts: Fonts) {
  const { regular, bold } = fonts;
  const bandColor = BAND_COLORS[result.band] ?? INK;

  drawCoverHeader(page, result, logo, fonts);

  // ═══ SCORE HERO (left column) — huge percentage ═══
  const heroTopY = 660;
  const pctStr = `${result.percentReady}%`;
  const pctSize = 96;
  drawSingleLine(page, pctStr, {
    x: 48, y: heroTopY - pctSize, font: bold, size: pctSize, color: INK,
  });

  // Subtitle under percentage
  drawSingleLine(page, "AVERAGE READINESS", {
    x: 50, y: heroTopY - pctSize - 18, font: bold, size: 10, color: LABEL,
  });

  // ── Band pill
  const pillX = 48;
  const pillY = heroTopY - pctSize - 52;
  const pillText = bandLabel;
  const pillSize = 11;
  const pillTextWidth = bold.widthOfTextAtSize(pillText, pillSize);
  const pillW = pillTextWidth + 28;
  const pillH = 24;
  page.drawRectangle({
    x: pillX, y: pillY, width: pillW, height: pillH,
    color: rgb(bandColor[0], bandColor[1], bandColor[2]),
  });
  drawSingleLine(page, pillText, {
    x: pillX + 14, y: pillY + 8, font: bold, size: pillSize, color: WHITE,
  });

  // ── Tagline
  drawWrapped(page, tagline, {
    x: 48, y: pillY - 18, maxWidth: 330, font: regular, size: 11.5, color: SOFT, lineHeight: 1.5,
  });

  // ═══ JESSE AVATAR (top right, clipped to circle) ═══
  const jCx = 520;
  const jCy = 615;
  const jR = 55;
  drawClippedImageCircle(page, jesse, jCx, jCy, jR);
  // Orange ring on top of the clipped image
  drawCircleStroked(page, jCx, jCy, jR + 1.5, ORANGE, 3);

  // ═══ DOMAIN BREAKDOWN (bars + donut) ═══
  const breakdownY = 450;
  drawSingleLine(page, "YOUR SCORE BREAKDOWN", {
    x: 48, y: breakdownY, font: bold, size: 10, color: LABEL,
  });
  fillRect(page, 48, breakdownY - 6, 516, 0.5, DIVIDER);

  // ── Left: 4 domain % rows (label + bar + %)
  const domains: Domain[] = ["Digital", "Legal", "Financial", "Physical"];
  const rowStartY = breakdownY - 28;
  const rowSpacing = 36;
  const labelX = 48;
  const barX = 48;
  const barW = 260;
  const barH = 8;
  const percentLabelX = barX + barW + 10;

  domains.forEach((domainName, i) => {
    const dr = result.domainResults.find((d) => d.domain === domainName);
    if (!dr) return;
    const y = rowStartY - i * rowSpacing;
    drawSingleLine(page, domainName, {
      x: labelX, y: y + 14, font: bold, size: 11, color: INK,
    });
    // Bar track
    fillRect(page, barX, y, barW, barH, BAR_TRACK);
    // Filled portion
    const fillW = (dr.percent / 100) * barW;
    if (fillW > 0) fillRect(page, barX, y, fillW, barH, DOMAIN_COLORS[domainName]);
    // % label
    drawSingleLine(page, `${dr.percent}%`, {
      x: percentLabelX, y: y - 1, font: bold, size: 11, color: DOMAIN_COLORS[domainName],
    });
  });

  // ── Right: DONUT pie chart
  const donutCx = 470;
  const donutCy = breakdownY - 85;
  const donutR = 60;
  const donutHoleR = 36;

  // Compute slice angles based on domain score contribution
  const totalForPie = result.totalScore > 0 ? result.totalScore : 1;
  if (result.totalScore > 0) {
    let startDeg = 90;
    for (const domainName of domains) {
      const dr = result.domainResults.find((d) => d.domain === domainName);
      if (!dr || dr.score === 0) continue;
      const sweep = (dr.score / totalForPie) * 360;
      const endDeg = startDeg - sweep;
      drawPieSlice(page, donutCx, donutCy, donutR, endDeg, startDeg, DOMAIN_COLORS[domainName]);
      startDeg = endDeg;
    }
  } else {
    // No score yet — draw light gray ring
    drawCircleFilled(page, donutCx, donutCy, donutR, BAR_TRACK);
  }

  // Donut hole (white center)
  drawCircleFilled(page, donutCx, donutCy, donutHoleR, WHITE);

  // Percentage in center of donut
  const centerPct = `${result.percentReady}%`;
  const centerSize = 20;
  const centerW = bold.widthOfTextAtSize(centerPct, centerSize);
  drawSingleLine(page, centerPct, {
    x: donutCx - centerW / 2, y: donutCy - 5, font: bold, size: centerSize, color: INK,
  });
  drawSingleLine(page, "avg", {
    x: donutCx - 8, y: donutCy - 18, font: regular, size: 8, color: MUTED,
  });

  // Legend below donut
  const legendY = donutCy - donutR - 18;
  const legendColSpacing = 66;
  domains.forEach((domainName, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const lx = donutCx - donutR + col * legendColSpacing;
    const ly = legendY - row * 14;
    drawCircleFilled(page, lx + 4, ly + 3, 3.5, DOMAIN_COLORS[domainName]);
    drawSingleLine(page, domainName, {
      x: lx + 12, y: ly, font: regular, size: 9, color: SOFT,
    });
  });

  // ── 7-day journey indicator
  const journeyY = 220;
  drawSingleLine(page, "YOUR 7-DAY JOURNEY", {
    x: 48, y: journeyY, font: bold, size: 10, color: LABEL,
  });
  // thin divider under header
  fillRect(page, 48, journeyY - 6, 516, 0.5, DIVIDER);

  const circleY = journeyY - 40;
  const circleR = 14;
  const circleStartX = 70;
  const circleSpacing = (516 - 40) / 6;
  for (let i = 0; i < 7; i++) {
    const cx = circleStartX + i * circleSpacing;
    if (i === 0) {
      drawCircleFilled(page, cx, circleY, circleR, ORANGE);
      drawSingleLine(page, "1", {
        x: cx - 3, y: circleY - 4, font: bold, size: 11, color: WHITE,
      });
      drawSingleLine(page, "Today", {
        x: cx - 12, y: circleY - circleR - 14, font: bold, size: 9, color: ORANGE,
      });
    } else {
      drawCircleStroked(page, cx, circleY, circleR, rgbTriple(200, 210, 220), 1);
      drawSingleLine(page, String(i + 1), {
        x: cx - 3, y: circleY - 4, font: regular, size: 11, color: MUTED,
      });
      drawSingleLine(page, `Day ${i + 1}`, {
        x: cx - 14, y: circleY - circleR - 14, font: regular, size: 9, color: MUTED,
      });
    }
  }

  drawFooter(page, logo, fonts, true);
}

// ── Day block (for day plan pages) ───────────────────────────────────────────
function drawDayBlock(
  page: PDFPage,
  blockTop: number,
  dayNum: number,
  left: { eyebrow: string; title: string },
  right: { checkboxLabel: string; description: string; jesseNote: string },
  fonts: Fonts
): number {
  const { regular, bold } = fonts;
  const leftX = 48;
  const leftW = 160;
  const rightX = 230;
  const rightW = 336;

  // Left column: "DAY 0N" eyebrow
  const eyebrow = left.eyebrow;
  drawSingleLine(page, eyebrow, {
    x: leftX, y: blockTop, font: bold, size: 10, color: ORANGE_DEEP,
  });
  // Left title
  let leftTextY = blockTop - 22;
  const leftLines = wrapText(left.title, bold, 20, leftW);
  for (const line of leftLines) {
    page.drawText(line, {
      x: leftX, y: leftTextY, size: 20, font: bold,
      color: rgb(INK[0], INK[1], INK[2]),
    });
    leftTextY -= 24;
  }

  // Right column: checkbox + action title + description
  const checkY = blockTop - 2;
  strokeRect(page, rightX, checkY - 14, 16, 16, LABEL, 1.2);
  // Action title (next to checkbox)
  const titleX = rightX + 26;
  let titleY = checkY - 2;
  const titleLines = wrapText(right.checkboxLabel, bold, 12, rightW - 26);
  for (const line of titleLines) {
    page.drawText(line, {
      x: titleX, y: titleY, size: 12, font: bold,
      color: rgb(INK[0], INK[1], INK[2]),
    });
    titleY -= 16;
  }
  // Description under title
  let descY = titleY - 2;
  descY = drawWrapped(page, right.description, {
    x: titleX,
    y: descY,
    maxWidth: rightW - 26,
    font: regular,
    size: 10,
    color: MUTED,
    lineHeight: 1.4,
  });

  // Compute block bottom considering left vs right height
  const leftBottom = leftTextY;
  const rightBottom = descY;
  const contentBottom = Math.min(leftBottom, rightBottom) - 10;

  // Jesse peach note
  const noteY = contentBottom - 4;
  const noteLines = wrapText(right.jesseNote, regular, 9.5, 480);
  const noteH = Math.max(28, noteLines.length * 13 + 14);
  fillRect(page, leftX, noteY - noteH, 516, noteH, PEACH_BG);
  // Orange left border
  fillRect(page, leftX, noteY - noteH, 3, noteH, ORANGE);
  // Note text
  let noteTextY = noteY - 14;
  for (const line of noteLines) {
    page.drawText(line, {
      x: leftX + 14, y: noteTextY, size: 9.5, font: regular,
      color: rgb(ORANGE_DEEP[0], ORANGE_DEEP[1], ORANGE_DEEP[2]),
    });
    noteTextY -= 13;
  }

  const blockBottom = noteY - noteH - 16;
  // Divider to next block
  fillRect(page, leftX, blockBottom + 2, 516, 0.5, DIVIDER);
  return blockBottom;
  void dayNum;
}

// ── Day pages ────────────────────────────────────────────────────────────────
function domainEyebrow(dayNum: number): string {
  return `DAY ${String(dayNum).padStart(2, "0")}`;
}

function leftTitleForDay(d: DayAssignment): string {
  if (d.domain === "ALL") return "Consolidate & Commit";
  return `${d.domain} Readiness`;
}

function descriptionForDay(d: DayAssignment): string {
  return `${d.action.socialProof}\n\nHow: ${d.action.howTo}`;
}

function drawDaysPage(
  page: PDFPage,
  result: AssessmentResult,
  bandLabel: string,
  days: DayAssignment[],
  dayNotes: string[],
  logo: PDFImage,
  fonts: Fonts
) {
  drawDayPageHeader(page, result, bandLabel, logo, fonts);
  let cursor = 700;
  days.forEach((d, i) => {
    const noteIdx = d.day - 1;
    cursor = drawDayBlock(
      page,
      cursor,
      d.day,
      {
        eyebrow: domainEyebrow(d.day),
        title: leftTitleForDay(d),
      },
      {
        checkboxLabel: d.action.title,
        description: descriptionForDay(d),
        jesseNote: dayNotes[noteIdx] ?? "",
      },
      fonts
    );
    void i;
  });
  drawFooter(page, logo, fonts);
}

function drawDay7AndNotesPage(
  page: PDFPage,
  result: AssessmentResult,
  bandLabel: string,
  day7: DayAssignment,
  closingNote: string,
  logo: PDFImage,
  fonts: Fonts
) {
  drawDayPageHeader(page, result, bandLabel, logo, fonts);
  const cursor = drawDayBlock(
    page,
    700,
    day7.day,
    {
      eyebrow: "DAY 07",
      title: "Consolidate & Commit",
    },
    {
      checkboxLabel: day7.action.title,
      description: descriptionForDay(day7),
      jesseNote: closingNote,
    },
    fonts
  );
  // My notes section
  const notesTop = cursor - 20;
  drawSingleLine(page, "MY NOTES", {
    x: 48, y: notesTop, font: fonts.bold, size: 10, color: LABEL,
  });
  fillRect(page, 48, notesTop - 6, 516, 0.5, DIVIDER);
  // Empty box for handwriting
  const boxTop = notesTop - 16;
  const boxH = Math.min(200, boxTop - 80);
  strokeRect(page, 48, boxTop - boxH, 516, boxH, DIVIDER, 1);
  drawSingleLine(page, "Use this space to capture your thoughts, priorities, or reminders as you work through your plan.", {
    x: 48, y: boxTop - boxH - 14, font: fonts.regular, size: 9, color: MUTED,
  });

  drawFooter(page, logo, fonts);
}

// ── Main entry ───────────────────────────────────────────────────────────────
export async function buildPlannerPdf(
  result: AssessmentResult,
  wrapper: JesseWrapper
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fonts: Fonts = { regular, bold };

  const logoBuf = loadPng("logo_v2_with_white_text.png");
  const jesseBuf = loadPng("jesse.png");
  const logo = await doc.embedPng(logoBuf);
  const jesse = await doc.embedPng(jesseBuf);

  // Tagline per band (concise, reusable for cover)
  const taglineByBand: Record<string, string> = {
    "AT RISK": "You're not alone — most people are here. This week we start closing the biggest gaps.",
    "SOMEWHAT PREPARED": "You've started. This week we close the biggest remaining gaps, one domain at a time.",
    PREPARED: "You're in the top band. This week we sharpen the edges most people at your level still miss.",
  };
  const tagline = taglineByBand[result.band] ?? wrapper.opening.slice(0, 160);

  // Cover
  const cover = doc.addPage([612, 792]);
  drawCoverPage(cover, result, result.band, tagline, logo, jesse, fonts);

  // Days 1-3
  const dayNotes = [
    wrapper.day1Note,
    wrapper.day2Note,
    wrapper.day3Note,
    wrapper.day4Note,
    wrapper.day5Note,
    wrapper.day6Note,
    wrapper.day7Closing,
  ];

  const page2 = doc.addPage([612, 792]);
  drawDaysPage(page2, result, result.band, result.plan.slice(0, 3), dayNotes, logo, fonts);

  const page3 = doc.addPage([612, 792]);
  drawDaysPage(page3, result, result.band, result.plan.slice(3, 6), dayNotes, logo, fonts);

  // Day 7 + My Notes
  const page4 = doc.addPage([612, 792]);
  drawDay7AndNotesPage(page4, result, result.band, result.plan[6], wrapper.day7Closing, logo, fonts);

  return doc.save();
}
