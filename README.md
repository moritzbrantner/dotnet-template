# dotnet-template

Full-stack starter built from the product surface of `@moritzbrantner/frontend-ui`:

- React + Vite frontend rendered with Material UI
- ASP.NET Core Web API with matching starter contracts and a Postgres-backed notes resource
- development proxy from the frontend to the API at `/api/*`

## Run

Install the root dev runner once:

```bash
npm install
```

Start the full stack in development mode from the repo root:

```bash
npm run dev:db
npm run dev
```

Open `http://localhost:5173`.

`npm run dev:db` starts Postgres on `localhost:55432` to avoid the common default-port conflict. If you already have Postgres running on `localhost:5432`, override `ConnectionStrings__Postgres` when starting the API.

If you want to run each side separately:

API:

```bash
dotnet run --project src/DotnetTemplate.Api
```

The API expects Postgres on `localhost:55432` by default, using:

- database: `dotnet_template`
- username: `postgres`
- password: `postgres`

Frontend:

```bash
cd apps/frontend
npm install
npm run dev
```

## Database

Restore the local EF tool and apply migrations:

```bash
dotnet tool restore
npm run db:migrate
```

The API also runs migrations during startup. If Postgres is unavailable, startup continues and `/api/health` reports `database.connected = false`.

## Tests

Run the complete test suite:

```bash
npm test
```

Run each side separately:

```bash
dotnet test DotnetTemplate.slnx
npm --prefix apps/frontend run test:run
```

Frontend unit tests, Playwright specs, and Storybook stories are colocated under `apps/frontend/src`:

- Vitest: `*.test.ts` and `*.test.tsx`
- Playwright: `*.e2e.ts`
- Storybook: `*.stories.tsx`

Run the browser tests and Storybook separately:

```bash
npm run test:web:e2e
npm run storybook
```

## Docker

Build the image from the repo root:

```bash
docker build -t dotnet-template .
```

Run the app container against an existing Postgres instance by passing `ConnectionStrings__Postgres`:

```bash
docker run --rm -p 8080:8080 \
  -e "ConnectionStrings__Postgres=Host=host.docker.internal;Port=55432;Database=dotnet_template;Username=postgres;Password=postgres" \
  dotnet-template
```

## Docker Compose

Build and run the full stack with Compose, including Postgres:

```bash
docker compose up --build
```

Then open `http://localhost:8080`.

## API Endpoints

- `GET /api/health`
- `GET /api/personas`
- `GET /api/dev-state?persona=user`
- `GET /api/session?persona=admin`
- `GET /api/navigation?persona=member`
- `GET /api/settings?persona=user`
- `GET /api/followers?persona=admin`
- `GET /api/notes`
- `GET /api/notes/{id}`
- `POST /api/notes`
- `PUT /api/notes/{id}`
- `DELETE /api/notes/{id}`

The frontend primarily consumes `GET /api/dev-state` plus the persisted notes endpoints. Schema changes are managed through EF Core migrations under `src/DotnetTemplate.Api/Migrations`.
