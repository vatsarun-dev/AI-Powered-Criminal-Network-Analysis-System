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

## Example Request

```bash
curl -i -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Arun\",\"email\":\"arun@example.com\",\"password\":\"Pass@1234\"}"
```
