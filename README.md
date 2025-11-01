# Fitted Monorepo

Initial scaffolding for the Fitted platform. This workspace currently includes:

- `@fitted/api`: Fastify REST API with a health endpoint and environment validation.
- `@fitted/admin`: Remix-based admin dashboard scaffold.

## Getting Started

```bash
npm install
```

### API

```bash
cp apps/api/.env.example apps/api/.env
npm run dev:api
```

Swagger and additional routes will be layered on as the domain model evolves.

### Admin

```bash
npm run dev:admin
```

The admin app runs with Remix and will host merchant/tradie tooling.

## Tooling

- TypeScript project references via `tsconfig.base.json`
- ESLint + Prettier (`npm run lint`)
- Vitest placeholder (`npm run test`)

Future tasks include wiring CI, adding shared domain packages, and integrating API/admin communication flows.
