import fs from "fs";
import path from "path";
import {
  LOGO_CID,
  FP_ICON_CID,
  ENDEVO_ICON_CID,
  DLP_ICON_CID,
  NIKI_PORTRAIT_CID,
  NIKI_DETAILS_CID,
} from "./emailTemplate.js";

export interface InlineImage {
  cid: string;
  filename: string;
  contentType: string;
  buffer: Buffer;
}

function loadPng(filename: string): Buffer {
  const p = path.join(process.cwd(), "public", filename);
  return fs.readFileSync(p);
}

let cache: InlineImage[] | null = null;

export function getInlineImages(): InlineImage[] {
  if (cache) return cache;
  cache = [
    {
      cid: LOGO_CID,
      filename: "logo_v2_with_white_text.png",
      contentType: "image/png",
      buffer: loadPng("logo_v2_with_white_text.png"),
    },
    {
      cid: FP_ICON_CID,
      filename: "jesse.png",
      contentType: "image/png",
      buffer: loadPng("jesse.png"),
    },
    {
      cid: ENDEVO_ICON_CID,
      filename: "favicon.png",
      contentType: "image/png",
      buffer: loadPng("favicon.png"),
    },
    {
      cid: DLP_ICON_CID,
      filename: "digital-legacy-podcast_square.png",
      contentType: "image/png",
      buffer: loadPng("digital-legacy-podcast_square.png"),
    },
    {
      cid: NIKI_PORTRAIT_CID,
      filename: "niki-weiss-signature-with-picture.png",
      contentType: "image/png",
      buffer: loadPng("niki-weiss-signature-with-picture.png"),
    },
    {
      cid: NIKI_DETAILS_CID,
      filename: "niki-weiss-signature-details.png",
      contentType: "image/png",
      buffer: loadPng("niki-weiss-signature-details.png"),
    },
  ];
  return cache;
}
