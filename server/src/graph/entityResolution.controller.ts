import type { Request, Response } from "express";

import {
  findPersonByPhone,
  findPersonById,
  findPersonByName,
  findSupportingSignal,
} from "./entityResolution.service.js";

export const resolvePerson = async (
  req: Request,
  res: Response
) => {
  try {
    const { phone, personId, name } = req.body;

    if (!phone && !personId && !name) {
      return res.status(400).json({
        message: "Provide phone, personId, or name",
      });
    }

    // 1. Exact phone match
    if (phone) {
      const person = await findPersonByPhone(phone);

      if (person) {
        return res.status(200).json({
          matched: true,
          matchType: "exact_phone",
          confidence: 1.0,
          person,
        });
      }
    }

    // 2. Exact ID match
    if (personId) {
      const person = await findPersonById(personId);

      if (person) {
        return res.status(200).json({
          matched: true,
          matchType: "exact_id",
          confidence: 1.0,
          person,
        });
      }
    }

    // 3. Fuzzy name match + supporting signal
    if (name) {
      const result = await findPersonByName(name);

      if (result) {
        const confidence = result.score / 100;
        const { phone, deviceId, locationId } = req.body;

        const hasSupportingSignal = await findSupportingSignal(
          String(result.person.id),
          phone,
          deviceId,
          locationId
        );

        if (hasSupportingSignal) {
          return res.status(200).json({
            matched: true,
            matchType: "fuzzy_name_with_supporting_signal",
            confidence,
            score: result.score,
            person: result.person,
          });
        }

        return res.status(200).json({
          matched: false,
          matchType: "fuzzy_name_candidate",
          confidence,
          score: result.score,
          message:
            "Similar name found, but no supporting signal was provided",
          candidate: result.person,
        });
      }
    }

    return res.status(404).json({
      matched: false,
      message: "No matching person found",
    });
  } catch (error) {
    console.error("Entity resolution error:", error);

    return res.status(500).json({
      message: "Entity resolution failed",
    });
  }
};