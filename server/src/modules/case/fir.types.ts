export const FIR_STATUSES = [
  "DRAFT",
  "REGISTERED",
  "UNDER_INVESTIGATION",
  "CHARGESHEET_FILED",
  "CLOSED",
] as const;

export type FirStatus = (typeof FIR_STATUSES)[number];

export type FirParty = {
  name: string;
  phone?: string;
  address?: string;
  identifier?: string;
  /** Optional recorded administrative metadata; used only for aggregate reports. */
  gender?: string;
  /** Optional recorded administrative metadata; used only for aggregate reports. */
  religion?: string;
};

export type InvestigatingOfficer = FirParty & {
  badgeNumber?: string;
};

/** Coordinates captured from a verified FIR, station, or district source. */
export type GeographicCoordinates = {
  latitude: number;
  longitude: number;
};

export type FirCreateInput = {
  firNumber: string;
  year: number;
  registrationDate: Date;
  incidentDate?: Date;
  district: string;
  districtCoordinates?: GeographicCoordinates;
  policeStation: string;
  policeStationCoordinates?: GeographicCoordinates;
  crimeCategory: string;
  sections: string[];
  description: string;
  status: FirStatus;
  complainant: FirParty;
  victims: FirParty[];
  accused: FirParty[];
  investigatingOfficer?: InvestigatingOfficer;
  court?: string;
  sourceDocument?: string;
};

export type FirUpdateInput = Partial<
  Omit<
    FirCreateInput,
    "incidentDate" | "investigatingOfficer" | "court" | "sourceDocument"
  >
> & {
  incidentDate?: Date | null;
  investigatingOfficer?: InvestigatingOfficer | null;
  court?: string | null;
  sourceDocument?: string | null;
};

export type FirResponse = Omit<
  FirCreateInput,
  "registrationDate" | "incidentDate"
> & {
  id: string;
  registrationDate: string;
  incidentDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type FirListFilter = {
  q?: string;
  firNumber?: string;
  year?: number;
  district?: string;
  policeStation?: string;
  crimeCategory?: string;
  status?: FirStatus;
  registrationDateFrom?: Date;
  registrationDateTo?: Date;
  incidentDateFrom?: Date;
  incidentDateTo?: Date;
  page: number;
  limit: number;
};

export type PaginatedFirResponse = {
  items: FirResponse[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
