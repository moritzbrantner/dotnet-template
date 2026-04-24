# dotnet-template

Full-stack starter built from the product surface of `@moritzbrantner/frontend-ui`:

- React + Vite frontend with persona-aware navigation, profile, settings, team, and admin views
- ASP.NET Core Web API with matching starter contracts and sample persona data
- development proxy from the frontend to the API at `/api/*`

## Run

Install the root dev runner once:

```bash
npm install
```

Start the full stack in development mode from the repo root:

```bash
npm run dev
```

Open `http://localhost:5173`.

If you want to run each side separately:

API:

```bash
dotnet run --project src/DotnetTemplate.Api
```

Frontend:

```bash
cd apps/frontend
npm install
npm run dev
```

## API Endpoints

- `GET /api/health`
- `GET /api/personas`
- `GET /api/dev-state?persona=user`
- `GET /api/session?persona=admin`
- `GET /api/navigation?persona=member`
- `GET /api/settings?persona=user`
- `GET /api/followers?persona=admin`

The frontend primarily consumes `GET /api/dev-state`, while the smaller endpoints mirror the same backend slices for easier integration testing or expansion.
