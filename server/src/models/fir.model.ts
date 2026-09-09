import { model, Schema, Types } from "mongoose";

import { FIR_STATUSES, type FirStatus } from "../modules/case/fir.types.js";

const partySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 32 },
    address: { type: String, trim: true, maxlength: 1000 },
    identifier: { type: String, trim: true, maxlength: 200 },
    badgeNumber: { type: String, trim: true, maxlength: 100 },
  },
  { _id: false },
);

export type FirMongoDocument = {
  firNumber: string;
  year: number;
  registrationDate: Date;
  incidentDate?: Date;
  district: string;
  policeStation: string;
  crimeCategory: string;
  sections: string[];
  description: string;
  status: FirStatus;
  complainant: {
    name: string;
    phone?: string;
    address?: string;
    identifier?: string;
  };
  victims: Array<{
    name: string;
    phone?: string;
    address?: string;
    identifier?: string;
  }>;
  accused: Array<{
    name: string;
    phone?: string;
    address?: string;
    identifier?: string;
  }>;
  investigatingOfficer?: {
    name: string;
    phone?: string;
    address?: string;
    identifier?: string;
    badgeNumber?: string;
  };
  court?: string;
  sourceDocument?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const firSchema = new Schema<FirMongoDocument>(
  {
    firNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 100,
    },
    year: { type: Number, required: true, min: 1900, max: 2100 },
    registrationDate: { type: Date, required: true, index: true },
    incidentDate: { type: Date, index: true },
    district: { type: String, required: true, trim: true, maxlength: 150, index: true },
    policeStation: { type: String, required: true, trim: true, maxlength: 200, index: true },
    crimeCategory: { type: String, required: true, trim: true, maxlength: 200, index: true },
    sections: { type: [String], default: [] },
    description: { type: String, required: true, trim: true, maxlength: 25000 },
    status: { type: String, enum: FIR_STATUSES, default: "REGISTERED", index: true },
    complainant: { type: partySchema, required: true },
    victims: { type: [partySchema], default: [] },
    accused: { type: [partySchema], default: [] },
    investigatingOfficer: { type: partySchema },
    court: { type: String, trim: true, maxlength: 200 },
    sourceDocument: { type: Types.ObjectId, ref: "File", index: true },
  },
  { timestamps: true },
);

firSchema.index({ firNumber: 1, year: 1 }, { unique: true });
firSchema.index({ district: 1, policeStation: 1, registrationDate: -1 });

export const FirModel = model<FirMongoDocument>("Fir", firSchema);
