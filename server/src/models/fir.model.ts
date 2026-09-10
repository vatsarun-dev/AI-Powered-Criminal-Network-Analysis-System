import { model, Schema, Types } from "mongoose";

import { FIR_STATUSES, type FirStatus } from "../modules/case/fir.types.js";

const partySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 32 },
    address: { type: String, trim: true, maxlength: 1000 },
    identifier: { type: String, trim: true, maxlength: 200 },
    gender: { type: String, trim: true, maxlength: 50 },
    religion: { type: String, trim: true, maxlength: 100 },
    badgeNumber: { type: String, trim: true, maxlength: 100 },
  },
  { _id: false },
);

const coordinateSchema = new Schema(
  {
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
  },
  { _id: false },
);

export type FirMongoDocument = {
  firNumber: string;
  year: number;
  registrationDate: Date;
  incidentDate?: Date;
  district: string;
  districtCoordinates?: { latitude: number; longitude: number };
  policeStation: string;
  policeStationCoordinates?: { latitude: number; longitude: number };
  crimeCategory: string;
  sections: string[];
  description: string;
  status: FirStatus;
  complainant: {
    name: string;
    phone?: string;
    address?: string;
    identifier?: string;
    gender?: string;
    religion?: string;
  };
  victims: Array<{
    name: string;
    phone?: string;
    address?: string;
    identifier?: string;
    gender?: string;
    religion?: string;
  }>;
  accused: Array<{
    name: string;
    phone?: string;
    address?: string;
    identifier?: string;
    gender?: string;
    religion?: string;
  }>;
  investigatingOfficer?: {
    name: string;
    phone?: string;
    address?: string;
    identifier?: string;
    gender?: string;
    religion?: string;
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
    districtCoordinates: { type: coordinateSchema },
    policeStation: { type: String, required: true, trim: true, maxlength: 200, index: true },
    policeStationCoordinates: { type: coordinateSchema },
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
