export enum FileType {
  FIR = "FIR",
  CDR = "CDR",
  IPDR = "IPDR",
}

export type File = {
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  type: string;
  caseId: string;
  location?: string;
  storagePath: string;
  status: string;
};