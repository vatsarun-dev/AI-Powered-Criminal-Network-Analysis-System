type EntityType = "PERSON" | "LOCATION" | "ORGANIZATION";

const normalizeWhitespace = (value: string): string => {
  return value.replace(/\s+/g, " ").trim();
};

const normalizeCase = (value: string): string => {
  return value.toLowerCase();
};

const removeNoise = (value: string): string => {
  return value.replace(/[|]+/g, " ").replace(/\s+/g, " ").trim();
};

export const normalizeEntityValue = (
  value: string,
  entityType: EntityType,
): string => {
  let normalized = value;

  normalized = removeNoise(normalized);
  normalized = normalizeWhitespace(normalized);
  normalized = normalizeCase(normalized);

  /*
   * PERSON:
   * "RAKESH KUMAR" -> "rakesh kumar"
   */
  if (entityType === "PERSON") {
    return normalized;
  }

  /*
   * LOCATION:
   * " Meerut " -> "meerut"
   */
  if (entityType === "LOCATION") {
    return normalized;
  }

  /*
   * ORGANIZATION:
   * "ABC   Bank" -> "abc bank"
   */
  if (entityType === "ORGANIZATION") {
    return normalized;
  }

  return normalized;
};
