# ARKA TARA frontend

Next.js/React application for the mobile-first ARKA TARA customer and staff experiences.

## Foundation versions

- Node.js 24 LTS
- Next.js 16
- React 19
- TypeScript 6
- npm with a committed lockfile

## Local setup

1. Use the Node version in .nvmrc.
2. Copy .env.example to .env.local.
3. Install exact dependencies with npm ci.
4. Start the development server with npm run dev.

NEXT_PUBLIC_API_BASE_URL must point to the versioned backend boundary ending in /api/v1/.

The backend must be running separately to use API calls. The current landing page is a foundation placeholder and does not fetch catalogue or availability data.

## Environment separation

- Local: use an ignored `.env.local` with the local backend URL from `.env.example`.
- Staging and production: supply the respective API URL in the build environment, with separate backend services and data. Use HTTPS for these environments. Never reuse production credentials or data in development or tests.
- `NEXT_PUBLIC_*` values are public and included in browser assets during `npm run build`. Configure them before building; changing only the runtime variable does not update an existing client build. Build a separate artifact per environment and rebuild when the API URL changes.
- Keep provider credentials and all other secrets on the backend. Do not add them to public environment variables or committed configuration. Hosting and deployment services remain unselected.

The API helper rejects an unversioned base, embedded credentials, query strings and fragments. Requests must resolve within the configured origin and API path. `requestJson` sends an `Accept: application/json` header and distinguishes HTTP errors, network failures, invalid responses and cancellations using `ApiError`. It preserves the backend's structured `error.details`, while the actual HTTP status remains authoritative. Render only deliberately selected validation details; do not print raw error payloads or server exception messages.

The helper does not retry or follow redirects. A successful `204` or `HEAD` request returns `undefined`; otherwise it parses JSON. Type parameters describe expected data and do not replace runtime validation for domain contracts. Callers provide serialized request bodies and their content type when needed. Credentials are omitted by default; future staff flows must deliberately implement their authenticated session and CSRF requirements.

`src/app/error.tsx` provides a recoverable page fallback with a safe message. It does not turn API or payment errors into a successful business outcome.

## Quality checks

- npm run lint
- npm run format:check
- npm run typecheck
- npm run test:run
- npm run build

The initial page is a lightweight launch placeholder. Storefront catalogue, Trial Cart, checkout, agent portal, payments and messaging belong to later authorized tasks.

## Review and delivery workflow

Create focused feature or fix branches from `development`, open a pull request into `development`, and require the CI checks before merging. Promote reviewed changes from `development` to `main` for release. CI runs for pull requests and pushes to `main` or `development`; a feature-branch push alone does not start the workflow.

CI installs from `package-lock.json` with `npm ci` and uses the Node version in `.nvmrc`. Run the quality checks above locally before review. For a production-mode smoke check, build with the intended environment's public API URL, run `npm start`, and verify the page and API connectivity against that environment. A passing frontend build does not validate backend migrations or database access.

Deployment ownership and hosting are still pending selection. Once selected, releases must preserve the commit, environment and build identity, run an appropriate smoke check, and retain the previous compatible artifact for recovery. A frontend rollback must remain compatible with the deployed `/api/v1/` backend; coordinate incompatible changes before release.

The single canonical project documentation is [../docs/](../docs/), with [../AGENTS.md](../AGENTS.md) as its operating guide. Approved BD-14 tracks it in a separate documentation-only root repository; see the [workspace README](../README.md) for the clone layout. Documentation remote setup/publication is separate, and this application clone alone does not include the shared context. Do not duplicate the documents here.
