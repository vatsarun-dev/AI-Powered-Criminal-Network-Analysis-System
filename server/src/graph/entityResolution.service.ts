import * as fuzzball from "fuzzball";

import {
  neo4jDriver,
  neo4jDatabase,
} from "../config/neo4j.js";

export const findPersonByPhone = async (phone: string) => {
  const session = neo4jDriver.session({
    database: neo4jDatabase,
  });

  try {
    const query = `
      MATCH (p:PERSON)-[:USES]->(ph:PHONE)
      WHERE ph.number = $phone
      RETURN p
    `;

    const result = await session.run(query, {
      phone,
    });

    const record = result.records[0];
    if (!record) {
      return null;
    }

    return record.get("p").properties;
  } finally {
    await session.close();
  }
};
export const findPersonById = async (personId: string) => {
  const session = neo4jDriver.session({
    database: neo4jDatabase,
  });

  try {
    const query = `
      MATCH (p:PERSON {id: $personId})
      RETURN p
    `;

    const result = await session.run(query, {
      personId,
    });

    const record = result.records[0];
    if (!record) {
      return null;
    }

    return record.get("p").properties;
  } finally {
    await session.close();
  }
};
export const findPersonByName = async (name: string) => {
  const session = neo4jDriver.session({
    database: neo4jDatabase,
  });

  try {
    const query = `
      MATCH (p:PERSON)
      RETURN p
    `;

    const result = await session.run(query);

    let bestMatch: {
      person: Record<string, unknown>;
      score: number;
    } | null = null;

    for (const record of result.records) {
      const person = record.get("p").properties;

      if (!person.name) {
        continue;
      }

      const score = fuzzball.ratio(
        name.toLowerCase(),
        String(person.name).toLowerCase()
      );

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = {
          person,
          score,
        };
      }
    }

    if (!bestMatch) {
      return null;
    }

  if (bestMatch.score < 80) {
  return null;
}

return {
  person: bestMatch.person,
  score: bestMatch.score,
};
  } finally {
    await session.close();
  }
};
export const findSupportingSignal = async (
  personId: string,
  phone?: string,
  deviceId?: string,
  locationId?: string
) => {
  const session = neo4jDriver.session({
    database: neo4jDatabase,
  });

  try {
    const query = `
      MATCH (p:PERSON {id: $personId})

      OPTIONAL MATCH (p)-[:USES]->(ph:PHONE)
      OPTIONAL MATCH (p)-[:SEEN_WITH]->(device:DEVICE)
      OPTIONAL MATCH (p)-[:LOCATED_AT]->(location:LOCATION)

      RETURN
        ph.number AS phone,
        device.id AS deviceId,
        location.id AS locationId
    `;

    const result = await session.run(query, {
      personId,
    });

    if (result.records.length === 0) {
      return false;
    }

    const record = result.records[0];
    if (!record) {
      return false;
    }

    const existingPhone = record.get("phone");
    const existingDeviceId = record.get("deviceId");
    const existingLocationId = record.get("locationId");

    if (phone && existingPhone === phone) {
      return true;
    }

    if (deviceId && existingDeviceId === deviceId) {
      return true;
    }

    if (locationId && existingLocationId === locationId) {
      return true;
    }

    return false;
  } finally {
    await session.close();
  }
};