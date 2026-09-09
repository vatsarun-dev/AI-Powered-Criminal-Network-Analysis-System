import type { EntityType } from "../types/entity.js";

const normalizeWhitespace = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

/** Removes harmless OCR separators without attempting to correct names. */
const cleanEvidenceForMatching = (value: string): string =>
  normalizeWhitespace(value.normalize("NFKC").replace(/[|]+/g, " "));

const normalizeText = (value: string): string =>
  cleanEvidenceForMatching(value).toLocaleLowerCase("en-IN");

const normalizePhone = (value: string): string => {
  let digits = cleanEvidenceForMatching(value).replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : "";
};

const normalizeVehicle = (value: string): string => {
  const compact = cleanEvidenceForMatching(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  return /^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{1,4}$/.test(compact) ? compact : "";
};

const normalizeIdentifier = (value: string): string =>
  cleanEvidenceForMatching(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

const normalizeFirOrCase = (value: string, prefix: "fir" | "case"): string => {
  const cleaned = cleanEvidenceForMatching(value);
  const match = cleaned.match(/(?:fir|case)?\s*(?:no\.?|number)?\s*[-:#]?\s*(\d{1,6})\s*\/\s*((?:19|20)\d{2})/i);

  if (match) {
    return `${prefix}-${match[1]}/${match[2]}`;
  }

  if (prefix === "case") {
    const caseNumber = cleaned.match(/\bcase\s*(?:no\.?|number)?\s*[-:#]?\s*(\d{1,6})\b/i);
    return caseNumber ? `case-${caseNumber[1]}` : "";
  }

  return "";
};

const normalizeLocation = (value: string): string =>
  normalizeText(value)
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s*\.\s*$/g, "");

const normalizePoliceStation = (value: string): string =>
  normalizeText(value)
    .replace(/\bp\.?\s*s\.?\b/g, "police station")
    .replace(/\bpolice\s+stn\.?\b/g, "police station");

export const normalizeEntityValue = (
  value: string,
  entityType: EntityType,
): string => {
  if (!value || !value.trim()) {
    return "";
  }

  switch (entityType) {
    case "PHONE":
      return normalizePhone(value);
    case "DEVICE":
    case "ACCOUNT":
      return normalizeIdentifier(value);
    case "VEHICLE":
      return normalizeVehicle(value);
    case "FIR":
      return normalizeFirOrCase(value, "fir");
    case "CASE":
      return normalizeFirOrCase(value, "case");
    case "LOCATION":
      return normalizeLocation(value);
    case "POLICE_STATION":
      return normalizePoliceStation(value);
    case "PERSON":
    case "ORGANIZATION":
    case "COURT":
    case "CRIME_CATEGORY":
      return normalizeText(value);
  }
};
