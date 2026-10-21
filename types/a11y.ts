export type A11yColors = {
  text: string;
  background: string;
  accent: string;
  onAccent: string;
};

export type A11yTypography = {
  family: string;
  size: number;
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  weight: number;
  /** Width of the text column in px. */
  measure: number;
};

export type TouchTarget = {
  id: string;
  label: string;
  width: number;
  height: number;
};

export type VisionMode = "none" | "protanopia" | "deuteranopia" | "tritanopia" | "grayscale" | "low-vision";

export type A11yTab = "contrast" | "vision" | "readability" | "targets" | "motion";
