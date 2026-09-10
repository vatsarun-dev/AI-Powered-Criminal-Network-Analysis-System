# Backend Template

Reusable TypeScript backend template extracted from the reference `server/` project. It keeps the same practical shape: Express app setup, module routes/controllers/services, Mongoose repository layer, JWT auth with HTTP-only cookies, `express-validator`, Zod env validation, Pino/Morgan logging, and centralized errors.

## Architecture

```text
src/server.ts
  -> src/app/app.ts
    -> security middleware
    -> /api/health routes
    -> /api/auth routes
      -> validation middleware
      -> auth middleware
      -> controllers
      -> services
      -> repositories
      -> Mongoose models
    -> not found middleware
    -> error middleware
```

## Folder Structure

```text
src/
  app/                  Express app composition
  config/               env, database, logger
  constant/             cookie and app constants
  middlewares/          auth, validation, security, errors
  models/               Mongoose schemas/models
  modules/              feature modules
    auth/
    health/
  repository/           database access layer
  shared/error/         ApiError and common error classes
  types/                auth and Express request typings
  utils/                async handler, tokens, password, response helpers
```

## Install

```bash
npm install
```

## Configure Env

Create `.env` from `.env.example`.

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=mongodb://127.0.0.1:27017/backend_template
CLIENT_URL=http://localhost:5173
ACCESS_TOKEN_SECRET=replace-with-long-access-secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=replace-with-long-refresh-secret
REFRESH_TOKEN_EXPIRES_IN=15d
COOKIE_SECURE=false
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## Run

```bash
npm run dev
npm run typecheck
npm run build
npm start
```

## Health Check

```http
GET /api/health
```

Response:

```json
{
  "success": true,
  "message": "API is running",
  "data": {
    "uptime": 12.34
  }
}
```

## Authentication

The template includes a minimal reusable auth module backed by a generic `User` model.

```text
POST /api/auth/register
POST /api/auth/login
  -> sets access_token and refresh_token HTTP-only cookies

GET /api/auth/me
  -> requires access_token

POST /api/auth/refresh
  -> verifies refresh_token
  -> sets a new access_token cookie

POST /api/auth/logout
  -> clears stored refresh token and cookies
```

Access tokens and refresh tokens use different secrets. Refresh tokens are stored on the user document so logout and token invalidation are possible.

## Creating A Module

Create a folder under `src/modules/<module-name>/`:

```text
<module>.routes.ts
<module>.controller.ts
<module>.service.ts
<module>.validation.ts
```

Then mount the route in `src/app/app.ts`:

```ts
app.use("/api/example", exampleRoutes);
```

Keep controllers responsible for HTTP request/response work, services responsible for business logic, and repositories responsible for database access.

## Validation

Validation uses `express-validator`, matching the reference project. Add validation chains in a module validation file and end the array with `validateRequest`.

## Error Handling

Throw errors from `src/shared/error/globalError.ts` inside controllers/services. `error.middleware.ts` formats them as:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

## Database

MongoDB is configured through `DATABASE_URL`. Mongoose connects during `src/server.ts` startup before Express starts listening.

## Entity Resolution (Phase 2)

`POST /api/graph/resolve` is a read-only resolution endpoint. It accepts any
combination of `personId`, `name`, `phone`, `deviceId`, `accountId`,
`locationId`, `caseId`, and `strongIdentifiers`, plus optional
`sourceEntityIds` from the original Mongo evidence records.

It returns `MATCHED`, `POSSIBLE_MATCH`, or `NO_MATCH` with a confidence,
matched signals, explanation, candidate source entity IDs, and candidate
summaries. A similar or phonetically equivalent name alone always returns
`POSSIBLE_MATCH`; it never merges records.

```json
{
  "sourceEntityIds": ["synthetic-fir-page-2-person"],
  "name": "Rakesh Kumaar",
  "phone": "98765-43210",
  "locationId": "synthetic-location-1"
}
```

## Relationship Extraction (Phase 3)

FIR-page ingestion now runs relationship extraction after entities are
persisted and synchronized as graph nodes. It only emits a relationship where
both typed endpoints and an explicit relationship trigger occur in the same
evidence segment; entity co-occurrence does not create an edge.

Supported evidence-backed types are `ACCUSED_IN`, `VICTIM_IN`,
`CLASSIFIED_AS`, `REGISTERED_AT`, `HEARD_IN`, `OCCURRED_AT`, `USES`, `OWNS`,
`ASSOCIATED_WITH`, `SEEN_WITH`, and `TRANSFERRED_TO`.

Each extraction is stored in MongoDB as `RelationshipEvidence` and mirrored to
Neo4j using its `evidenceId`. The provenance fields are `sourceDocumentId`,
`pageNumber`, `sourceEntityIds`, `confidence`, `extractedEvidence`, optional
`timestamp`, and `modelVersion`. Distinct evidence records create distinct
Neo4j edges, so later documents cannot overwrite prior evidence.

## Neo4j Criminal Knowledge Graph (Phase 4)

The processed FIR pipeline now projects every persisted entity into Neo4j and
mirrors its evidence-backed relationships. Structured entities use stable,
type-prefixed IDs (for example `phone:+919876543210` and `case:case-123`) with
`MERGE`; the graph therefore updates the same phone, account, device, location,
case, station, court, or crime-category node without creating duplicates.
People deliberately retain their evidence entity ID as their graph ID, so a
name alone never joins two people outside the entity-resolution decision.

Projected nodes retain `source_entity_ids`, `source_document_ids`, and
`source_values`. Relationship edges retain the original `evidenceId`, endpoint
entity IDs, `sourceDocumentId`, `pageNumber`, `confidence`, optional
`timestamp`, and `modelVersion`.

Frontend graph APIs:

- `GET /api/graph/nodes/:id`
- `GET /api/graph/nodes/:id/neighbors`
- `GET /api/graph/relationships?nodeId=&labels=&relationshipTypes=&sourceDocumentId=&limit=`
- `GET /api/graph/filtered` with the same filter parameters
- `GET /api/graph/cases/:id/network?depth=1..3`
- `GET /api/graph/persons/:id/network?depth=1..3`
- `GET /api/graph/shortest-path?from=&to=`

Comma-separated `labels` and `relationshipTypes` are validated against the
graph constants. The schema initializer adds only `IF NOT EXISTS` constraints;
it never clears existing Neo4j data.

## FIR Management (Phase 5)

Detailed FIR records use MongoDB as the source of truth and are available to
authenticated administrators under `/api/cases/firs`. The original Neo4j-only
`/api/cases` endpoints remain unchanged for existing clients.

- `POST /api/cases/firs` — create an FIR
- `GET /api/cases/firs` — list, search, and filter FIRs
- `GET /api/cases/firs/:id` — retrieve one FIR
- `PATCH /api/cases/firs/:id` — update an FIR
- `DELETE /api/cases/firs/:id` — delete only the management record
- `GET /api/cases/firs/:id/evidence?pageNumber=` — document, OCR, entities,
  and evidence-backed relationships
- `GET /api/cases/firs/:id/network?depth=1..3` — Neo4j case/evidence network

List filters are `q`, `firNumber`, `year`, `district`, `policeStation`,
`crimeCategory`, `status`, `registrationDateFrom`, `registrationDateTo`,
`incidentDateFrom`, `incidentDateTo`, `page`, and `limit`. `sourceDocument`,
when supplied, must be an existing uploaded FIR file. Deleting an FIR never
deletes its original document, extracted evidence, or graph provenance.

## Crime Analytics (Phase 6)

Analytics are calculated from live MongoDB FIR records and the existing Neo4j
graph—no statistics are stored or hardcoded. All Phase 6 endpoints require an
authenticated administrator:

- `GET /api/analytics/crime-categories`
- `GET /api/analytics/districts`
- `GET /api/analytics/demographics/gender?role=ALL|COMPLAINANT|VICTIM|ACCUSED`
- `GET /api/analytics/demographics/religion?role=ALL|COMPLAINANT|VICTIM|ACCUSED`
- `GET /api/analytics/graph/degree?limit=1..100`
- `GET /api/analytics/graph/betweenness?limit=1..100`
- `GET /api/analytics/graph/communities`
- `GET /api/analytics/graph/shortest-path?from=&to=`

The FIR filters `q`, `firNumber`, `year`, `district`, `policeStation`,
`crimeCategory`, `status`, `registrationDateFrom`, `registrationDateTo`,
`incidentDateFrom`, and `incidentDateTo` can be applied to the MongoDB
aggregate endpoints. Gender and religion reports contain descriptive aggregate
party-mention counts only, including missing-value totals. They must not be
used for individual criminal-risk prediction, profiling, or decisions about a
person.

## Interactive Crime Map (Phase 7)

The protected map API reads live MongoDB FIR records and never fabricates a
location. Optional `districtCoordinates` and `policeStationCoordinates` are
validated FIR fields (`latitude` and `longitude`); only records with stored,
numeric coordinates appear as map points. FIRs without coordinates remain in
the aggregate counts as `unlocatedCases`.

- `GET /api/map/overview`
- `GET /api/map/districts/:id`
- `GET /api/map/police-stations/:id`

The overview supports the FIR filters `q`, `firNumber`, `year`, `district`,
`policeStation`, `crimeCategory`, `status`, `registrationDateFrom`,
`registrationDateTo`, `incidentDateFrom`, and `incidentDateTo`, plus
`groupBy=DISTRICT|POLICE_STATION`, `densityInterval=MONTH|YEAR`, and
`dateField=INCIDENT_DATE|REGISTRATION_DATE`. It returns live concentration,
filter options, and historical density. Location details add category/status
breakdowns and recent matching FIRs.

The client page at `/map` is responsive and interactive. Historical density
is descriptive planning support only: it is not individual predictive policing
and does not use religion or gender for map risk scoring.

## Example Request

```bash
curl -i -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Arun\",\"email\":\"arun@example.com\",\"password\":\"Pass@1234\"}"
```
