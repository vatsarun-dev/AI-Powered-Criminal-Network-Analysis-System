import type { Request, Response } from "express";

import asyncHandler from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/ApiResponse.js";
import {
  hasResolutionSignal,
  resolvePerson as resolvePersonEntity,
  type EntityResolutionRequest,
} from "./entityResolution.service.js";

const readOptionalString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const readStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;

  const values = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return values.length ? [...new Set(values)] : undefined;
};

const readStrongIdentifiers = (
  value: unknown,
): Record<string, string> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const identifiers = Object.fromEntries(
    Object.entries(value).filter(
      ([key, identifier]) =>
        key.trim().length > 0 &&
        typeof identifier === "string" &&
        identifier.trim().length > 0,
    ),
  ) as Record<string, string>;

  return Object.keys(identifiers).length ? identifiers : undefined;
};

const readResolutionRequest = (body: unknown): EntityResolutionRequest => {
  const payload =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};
  const request: EntityResolutionRequest = {};
  const sourceEntityIds = readStringArray(payload.sourceEntityIds);
  const personId = readOptionalString(payload.personId);
  const name = readOptionalString(payload.name);
  const phone = readOptionalString(payload.phone);
  const deviceId = readOptionalString(payload.deviceId);
  const accountId = readOptionalString(payload.accountId);
  const locationId = readOptionalString(payload.locationId);
  const caseId = readOptionalString(payload.caseId);
  const strongIdentifiers = readStrongIdentifiers(payload.strongIdentifiers);

  if (sourceEntityIds) request.sourceEntityIds = sourceEntityIds;
  if (personId) request.personId = personId;
  if (name) request.name = name;
  if (phone) request.phone = phone;
  if (deviceId) request.deviceId = deviceId;
  if (accountId) request.accountId = accountId;
  if (locationId) request.locationId = locationId;
  if (caseId) request.caseId = caseId;
  if (strongIdentifiers) request.strongIdentifiers = strongIdentifiers;

  return request;
};

export const resolvePersonRequest = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const request = readResolutionRequest(req.body);

      if (!hasResolutionSignal(request)) {
        return res.status(400).json({
          message:
            "Provide personId, phone, name, deviceId, accountId, locationId, caseId, or strongIdentifiers.",
        });
      }

      const resolution = await resolvePersonEntity(request);

      return res.status(200).json(
        successResponse("Person resolved successfully", {
          ...resolution,
          // Retained for existing callers; consumers should use the explicit status.
          matched: resolution.status === "MATCHED",
        }),
      );
    } catch (error) {
      console.error("Entity resolution error:", error);

      return res.status(500).json({
        message: "Entity resolution failed",
      });
    }
  },
);

/** @deprecated Use resolvePersonRequest for the explicit Phase 2 endpoint name. */
export const resolvePerson = resolvePersonRequest;