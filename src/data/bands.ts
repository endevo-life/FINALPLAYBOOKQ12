import type { Band } from "../lib/engine";

export interface BandDef {
  key: Band;
  label: string;
  color: string;
  tone: string;
}

export const BAND_DEFS: Record<Band, BandDef> = {
  "AT RISK": {
    key: "AT RISK",
    label: "AT RISK",
    color: "#B8341B",
    tone: "You're not alone — most people are here. Your 7-day plan opens with your weakest domain so the first win comes fast.",
  },
  "SOMEWHAT PREPARED": {
    key: "SOMEWHAT PREPARED",
    label: "SOMEWHAT PREPARED",
    color: "#D94A28",
    tone: "You've started. Your 7-day plan closes the biggest remaining gaps, one domain at a time.",
  },
  PREPARED: {
    key: "PREPARED",
    label: "PREPARED",
    color: "#C9A84C",
    tone: "You're in the top Band. Your 7-day plan sharpens the edges most people at your level still miss.",
  },
};
