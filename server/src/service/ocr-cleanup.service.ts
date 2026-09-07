const FIELD_LABELS = [
  "name",
  "father's name",
  "father name",
  "mother's name",
  "address",
  "organization",
  "organisation",
  "district",
  "state",
  "city",
  "location",
  "incident location",
  "place of occurrence",
];

const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const fieldPattern = FIELD_LABELS.sort((a, b) => b.length - a.length)
  .map(escapeRegex)
  .join("|");

const fieldLabelRegex = new RegExp(`^(?:${fieldPattern})$`, "i");
const fieldLabelPrefixRegex = new RegExp(
  `^(?:${fieldPattern})(?:\\s*:\\s*|\\s+)`,
  "i",
);

export const isOCRFieldLabel = (value: string): boolean => {
  return fieldLabelRegex.test(value.trim().replace(/\s*:\s*$/, ""));
};

export const removeOCRFieldLabelPrefix = (value: string): string => {
  return value.replace(fieldLabelPrefixRegex, "").trim();
};

export const cleanOCRText = (text: string): string => {
  let cleaned = text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  /*
   * Normalize common OCR spacing around punctuation.
   */
  cleaned = cleaned
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s*:\s*/g, ": ")
    .replace(/\s+\./g, ".");

  return cleaned;
};
