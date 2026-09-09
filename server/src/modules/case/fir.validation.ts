import { Types } from "mongoose";

import { BadRequestError } from "../../shared/error/globalError.js";
import {
  FIR_STATUSES,
  type FirCreateInput,
  type FirListFilter,
  type FirParty,
  type FirStatus,
  type FirUpdateInput,
  type InvestigatingOfficer,
} from "./fir.types.js";

const CREATE_FIELDS = new Set([
  "firNumber",
  "year",
  "registrationDate",
  "incidentDate",
  "district",
  "policeStation",
  "crimeCategory",
  "sections",
  "description",
  "status",
  "complainant",
  "victims",
  "accused",
  "investigatingOfficer",
  "court",
  "sourceDocument",
]);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const rejectUnknownFields = (
  input: Record<string, unknown>,
  allowed: Set<string>,
): void => {
  const unknown = Object.keys(input).filter((key) => !allowed.has(key));
  if (unknown.length) {
    throw new BadRequestError(`Unsupported FIR fields: ${unknown.join(", ")}`);
  }
};

const requiredString = (value: unknown, field: string, maxLength = 1000): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new BadRequestError(`${field} is required`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new BadRequestError(`${field} must be at most ${maxLength} characters`);
  }
  return trimmed;
};

const optionalString = (
  value: unknown,
  field: string,
  maxLength = 1000,
): string | undefined => {
  if (value === undefined) return undefined;
  return requiredString(value, field, maxLength);
};

const dateValue = (value: unknown, field: string): Date => {
  if (typeof value !== "string" && !(value instanceof Date)) {
    throw new BadRequestError(`${field} must be an ISO date`);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestError(`${field} must be a valid date`);
  }
  return parsed;
};

const optionalDate = (value: unknown, field: string): Date | undefined =>
  value === undefined ? undefined : dateValue(value, field);

const positiveYear = (value: unknown): number => {
  const year = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new BadRequestError("year must be an integer between 1900 and 2100");
  }
  return year;
};

const optionalYear = (value: unknown): number | undefined =>
  value === undefined ? undefined : positiveYear(value);

const statusValue = (value: unknown): FirStatus => {
  if (typeof value !== "string" || !FIR_STATUSES.includes(value as FirStatus)) {
    throw new BadRequestError(`status must be one of: ${FIR_STATUSES.join(", ")}`);
  }
  return value as FirStatus;
};

const optionalStatus = (value: unknown): FirStatus | undefined =>
  value === undefined ? undefined : statusValue(value);

const stringList = (value: unknown, field: string): string[] => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item.trim())) {
    throw new BadRequestError(`${field} must be an array of non-empty strings`);
  }
  return [...new Set(value.map((item) => item.trim()))];
};

const optionalStringList = (value: unknown, field: string): string[] | undefined =>
  value === undefined ? undefined : stringList(value, field);

const party = (
  value: unknown,
  field: string,
  officer = false,
): FirParty | InvestigatingOfficer => {
  if (!isPlainObject(value)) {
    throw new BadRequestError(`${field} must be an object`);
  }
  const allowed = new Set(["name", "phone", "address", "identifier", ...(officer ? ["badgeNumber"] : [])]);
  rejectUnknownFields(value, allowed);
  const result: FirParty | InvestigatingOfficer = { name: requiredString(value.name, `${field}.name`, 200) };
  const phone = optionalString(value.phone, `${field}.phone`, 32);
  const address = optionalString(value.address, `${field}.address`, 1000);
  const identifier = optionalString(value.identifier, `${field}.identifier`, 200);
  if (phone) result.phone = phone;
  if (address) result.address = address;
  if (identifier) result.identifier = identifier;
  if (officer) {
    const badgeNumber = optionalString(value.badgeNumber, `${field}.badgeNumber`, 100);
    if (badgeNumber) (result as InvestigatingOfficer).badgeNumber = badgeNumber;
  }
  return result;
};

const partyList = (value: unknown, field: string): FirParty[] => {
  if (!Array.isArray(value)) {
    throw new BadRequestError(`${field} must be an array`);
  }
  return value.map((item, index) => party(item, `${field}[${index}]`) as FirParty);
};

const optionalPartyList = (value: unknown, field: string): FirParty[] | undefined =>
  value === undefined ? undefined : partyList(value, field);

const sourceDocument = (value: unknown): string => {
  const id = requiredString(value, "sourceDocument", 100);
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestError("sourceDocument must be a valid MongoDB ObjectId");
  }
  return id;
};

const optionalSourceDocument = (value: unknown): string | undefined =>
  value === undefined ? undefined : sourceDocument(value);

const assertIncidentPrecedesRegistration = (
  incidentDate: Date | undefined,
  registrationDate: Date | undefined,
): void => {
  if (incidentDate && registrationDate && incidentDate > registrationDate) {
    throw new BadRequestError("incidentDate cannot be after registrationDate");
  }
};

export const parseFirCreateInput = (value: unknown): FirCreateInput => {
  if (!isPlainObject(value)) {
    throw new BadRequestError("FIR payload must be an object");
  }
  rejectUnknownFields(value, CREATE_FIELDS);

  const registrationDate = dateValue(value.registrationDate, "registrationDate");
  const incidentDate = optionalDate(value.incidentDate, "incidentDate");
  assertIncidentPrecedesRegistration(incidentDate, registrationDate);
  const investigatingOfficer =
    value.investigatingOfficer === undefined
      ? undefined
      : (party(value.investigatingOfficer, "investigatingOfficer", true) as InvestigatingOfficer);
  const court = optionalString(value.court, "court", 200);
  const source = optionalSourceDocument(value.sourceDocument);

  return {
    firNumber: requiredString(value.firNumber, "firNumber", 100).toUpperCase(),
    year: positiveYear(value.year),
    registrationDate,
    ...(incidentDate ? { incidentDate } : {}),
    district: requiredString(value.district, "district", 150),
    policeStation: requiredString(value.policeStation, "policeStation", 200),
    crimeCategory: requiredString(value.crimeCategory, "crimeCategory", 200),
    sections: value.sections === undefined ? [] : stringList(value.sections, "sections"),
    description: requiredString(value.description, "description", 25000),
    status: value.status === undefined ? "REGISTERED" : statusValue(value.status),
    complainant: party(value.complainant, "complainant") as FirParty,
    victims: value.victims === undefined ? [] : partyList(value.victims, "victims"),
    accused: value.accused === undefined ? [] : partyList(value.accused, "accused"),
    ...(investigatingOfficer ? { investigatingOfficer } : {}),
    ...(court ? { court } : {}),
    ...(source ? { sourceDocument: source } : {}),
  };
};

export const parseFirUpdateInput = (value: unknown): FirUpdateInput => {
  if (!isPlainObject(value)) {
    throw new BadRequestError("FIR payload must be an object");
  }
  rejectUnknownFields(value, CREATE_FIELDS);
  if (!Object.keys(value).length) {
    throw new BadRequestError("FIR update payload cannot be empty");
  }

  const registrationDate = optionalDate(value.registrationDate, "registrationDate");
  const incidentDate = value.incidentDate === null
    ? null
    : optionalDate(value.incidentDate, "incidentDate");
  assertIncidentPrecedesRegistration(
    incidentDate ?? undefined,
    registrationDate,
  );
  const result: FirUpdateInput = {};
  const firNumber = optionalString(value.firNumber, "firNumber", 100);
  const year = optionalYear(value.year);
  const district = optionalString(value.district, "district", 150);
  const policeStation = optionalString(value.policeStation, "policeStation", 200);
  const crimeCategory = optionalString(value.crimeCategory, "crimeCategory", 200);
  const sections = optionalStringList(value.sections, "sections");
  const description = optionalString(value.description, "description", 25000);
  const status = optionalStatus(value.status);
  const complainant = value.complainant === undefined ? undefined : party(value.complainant, "complainant") as FirParty;
  const victims = optionalPartyList(value.victims, "victims");
  const accused = optionalPartyList(value.accused, "accused");

  if (firNumber) result.firNumber = firNumber.toUpperCase();
  if (year !== undefined) result.year = year;
  if (registrationDate) result.registrationDate = registrationDate;
  if (incidentDate !== undefined) result.incidentDate = incidentDate;
  if (district) result.district = district;
  if (policeStation) result.policeStation = policeStation;
  if (crimeCategory) result.crimeCategory = crimeCategory;
  if (sections) result.sections = sections;
  if (description) result.description = description;
  if (status) result.status = status;
  if (complainant) result.complainant = complainant;
  if (victims) result.victims = victims;
  if (accused) result.accused = accused;

  if (value.investigatingOfficer !== undefined) {
    result.investigatingOfficer = value.investigatingOfficer === null
      ? null
      : party(value.investigatingOfficer, "investigatingOfficer", true) as InvestigatingOfficer;
  }
  if (value.court !== undefined) {
    result.court = value.court === null ? null : requiredString(value.court, "court", 200);
  }
  if (value.sourceDocument !== undefined) {
    result.sourceDocument = value.sourceDocument === null ? null : sourceDocument(value.sourceDocument);
  }

  return result;
};

const optionalQueryString = (value: unknown, field: string, maxLength = 200): string | undefined => {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) throw new BadRequestError(`${field} must be a single value`);
  return optionalString(value, field, maxLength);
};

const boundedQueryNumber = (
  value: unknown,
  field: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number => {
  if (value === undefined) return fallback;
  if (Array.isArray(value)) throw new BadRequestError(`${field} must be a single value`);
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new BadRequestError(`${field} must be an integer between ${minimum} and ${maximum}`);
  }
  return parsed;
};

const optionalQueryDate = (value: unknown, field: string): Date | undefined => {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) throw new BadRequestError(`${field} must be a single value`);
  return dateValue(value, field);
};

export const parseFirListFilter = (query: Record<string, unknown>): FirListFilter => {
  const registrationDateFrom = optionalQueryDate(query.registrationDateFrom, "registrationDateFrom");
  const registrationDateTo = optionalQueryDate(query.registrationDateTo, "registrationDateTo");
  const incidentDateFrom = optionalQueryDate(query.incidentDateFrom, "incidentDateFrom");
  const incidentDateTo = optionalQueryDate(query.incidentDateTo, "incidentDateTo");
  if (registrationDateFrom && registrationDateTo && registrationDateFrom > registrationDateTo) {
    throw new BadRequestError("registrationDateFrom cannot be after registrationDateTo");
  }
  if (incidentDateFrom && incidentDateTo && incidentDateFrom > incidentDateTo) {
    throw new BadRequestError("incidentDateFrom cannot be after incidentDateTo");
  }

  const status = query.status === undefined ? undefined : statusValue(query.status);
  const q = optionalQueryString(query.q, "q", 250);
  const firNumber = optionalQueryString(query.firNumber, "firNumber", 100);
  const district = optionalQueryString(query.district, "district", 150);
  const policeStation = optionalQueryString(query.policeStation, "policeStation", 200);
  const crimeCategory = optionalQueryString(query.crimeCategory, "crimeCategory", 200);
  return {
    ...(q ? { q } : {}),
    ...(firNumber ? { firNumber } : {}),
    ...(query.year === undefined ? {} : { year: boundedQueryNumber(query.year, "year", 0, 1900, 2100) }),
    ...(district ? { district } : {}),
    ...(policeStation ? { policeStation } : {}),
    ...(crimeCategory ? { crimeCategory } : {}),
    ...(status ? { status } : {}),
    ...(registrationDateFrom ? { registrationDateFrom } : {}),
    ...(registrationDateTo ? { registrationDateTo } : {}),
    ...(incidentDateFrom ? { incidentDateFrom } : {}),
    ...(incidentDateTo ? { incidentDateTo } : {}),
    page: boundedQueryNumber(query.page, "page", 1, 1, 100000),
    limit: boundedQueryNumber(query.limit, "limit", 25, 1, 100),
  };
};
