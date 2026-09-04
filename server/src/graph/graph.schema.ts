import {
  neo4jDriver,
  neo4jDatabase,
} from "../config/neo4j.js";

const constraints = [
  `
  CREATE CONSTRAINT person_id_unique IF NOT EXISTS
  FOR (p:PERSON)
  REQUIRE p.id IS UNIQUE
  `,

  `
  CREATE CONSTRAINT phone_id_unique IF NOT EXISTS
  FOR (p:PHONE)
  REQUIRE p.id IS UNIQUE
  `,

  `
  CREATE CONSTRAINT device_id_unique IF NOT EXISTS
  FOR (d:DEVICE)
  REQUIRE d.id IS UNIQUE
  `,

  `
  CREATE CONSTRAINT account_id_unique IF NOT EXISTS
  FOR (a:ACCOUNT)
  REQUIRE a.id IS UNIQUE
  `,

  `
  CREATE CONSTRAINT location_id_unique IF NOT EXISTS
  FOR (l:LOCATION)
  REQUIRE l.id IS UNIQUE
  `,

  `
  CREATE CONSTRAINT case_id_unique IF NOT EXISTS
  FOR (c:CASE)
  REQUIRE c.id IS UNIQUE
  `,

  `
  CREATE CONSTRAINT event_id_unique IF NOT EXISTS
  FOR (e:EVENT)
  REQUIRE e.id IS UNIQUE
  `,
];

export const initializeGraphSchema = async () => {
  const session = neo4jDriver.session({
    database: neo4jDatabase,
  });

  try {
    for (const constraint of constraints) {
      await session.run(constraint);
    }

    console.log("Neo4j graph schema initialized successfully");
  } finally {
    await session.close();
  }
};