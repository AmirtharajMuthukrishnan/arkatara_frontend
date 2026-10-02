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

The backend must be running separately. The landing, collection and product pages read the published catalogue on the server; an empty catalogue and a temporary API failure have different messages.

## Environment separation

- Local: use an ignored `.env.local` with the local backend URL from `.env.example`.
- Staging and production: supply the respective API URL in the build environment, with separate backend services and data. Use HTTPS for these environments. Never reuse production credentials or data in development or tests.
- `NEXT_PUBLIC_*` values are public and included in browser assets during `npm run build`. Configure them before building; changing only the runtime variable does not update an existing client build. Build a separate artifact per environment and rebuild when the API URL changes.
- Keep provider credentials and all other secrets on the backend. Do not add them to public environment variables or committed configuration. Hosting and deployment services remain unselected.

The API helper rejects an unversioned base, embedded credentials, query strings and fragments. Requests must resolve within the configured origin and API path. `requestJson` sends an `Accept: application/json` header and distinguishes HTTP errors, network failures, invalid responses and cancellations using `ApiError`. It preserves the backend's structured `error.details`, while the actual HTTP status remains authoritative. Render only deliberately selected validation details; do not print raw error payloads or server exception messages.

The helper does not retry or follow redirects. A successful `204` or `HEAD` request returns `undefined`; otherwise it parses JSON. Type parameters describe expected data and do not replace runtime validation for domain contracts. Callers provide serialized request bodies and their content type when needed. Credentials are omitted by default; future staff flows must deliberately implement their authenticated session and CSRF requirements.

Task 2 adds runtime-validated contracts and `getReferenceData` / `checkServiceability` in `src/lib/catalog-contracts.ts`. Exact price/weight inputs remain decimal strings and DRAFT pricing does not imply a sale price. Coverage is distinct from booking availability. Shared API semantics and remaining policy gates are documented only in [ARCHITECTURE.md](../docs/ARCHITECTURE.md) and [DATA_MODEL.md](../docs/DATA_MODEL.md).

Task 3 adds `parseProductMediaMetadata` in `src/lib/media-contracts.ts`, validating the backend's versioned private-media shape, roles, identities and content metadata. It rejects public delivery or storage-key fields; it does not fetch or publish product media. See the canonical [media boundary](../docs/INTEGRATIONS.md#object-storage--task-3).

## Storefront and search configuration

**Presentation status:** The owner has not yet supplied approved UI, visual direction, branding or screen-level designs. Existing Task 4 styling and page composition are unapproved provisional work. Follow the canonical [D-21 design gate](../docs/DECISIONS.md#d-21--frontend-visual-design-awaits-owner-input): continue necessary technical foundations, using only minimal unstyled or clearly temporary functional placeholders where unavoidable. Frontend requirements remain in their original tasks; final presentation and visual acceptance are pending. This documentation clarification does not remove or replace existing application code.

Task 4 adds `/`, `/collections`, `/collections/[slug]`, `/products/[slug]` and `/how-it-works`. Only explicitly published backend content supplies catalogue pages. City/material filters preserve the selected browsing context; stock at a city hub does not promise serviceability or an accepted booking. Prices and media remain absent until their reviewed publication workflows are available. The trial CTA is deliberately disabled; cart and booking belong to Tasks 5–6.

Page metadata and factual structured data use the intended public origin `https://arkatara.in`. `SITE_INDEXING_ENABLED` defaults to `false`; enable it only for a reviewed production release. Preview/staging pages must remain non-indexable. Filter/tracking variants are non-indexable and use the base collection canonical; unfiltered collection pagination retains its own canonical page number. Genuine missing/withdrawn pages render a 404. Temporary failures on catalogue-dependent routes use the server error boundary; the homepage keeps its useful static content and a catalogue-unavailable message. Invalid filters have a separate selection-recovery message.

`CATALOGUE_MEDIA_ORIGINS` is an optional comma-separated list of reviewed HTTPS origins, with no paths, credentials, queries or fragments. It defaults to empty. The public image contract validates origins, dimensions and alt text; Next Image uses the same allowlist. Rebuild after changing the list. This is a future delivery boundary, not permission to expose private Task 3 attachments; the current API returns no public media. No provider has been selected.

The canonical [Task 4 record](../docs/TASKS.md#4-customer-storefront-and-scalable-ui) lists delivered scope and remaining business/review gates. Robots/sitemaps, deployed redirects/domain checks, Search Console/Bing ownership and measured production performance are owned by Task 10.

`src/app/error.tsx` provides a recoverable page fallback with a safe message. It does not turn API or payment errors into a successful business outcome.

## Quality checks

- npm run lint
- npm run format:check
- npm run typecheck
- npm run test:run
- npm run build

Trial Cart, checkout, agent portal, payments and messaging remain later tasks. A successful storefront build does not authorize live booking or indexation.

## Review and delivery workflow

Create focused feature or fix branches from `development`, open a pull request into `development`, and require the CI checks before merging. Promote reviewed changes from `development` to `main` for release. CI runs for pull requests and pushes to `main` or `development`; a feature-branch push alone does not start the workflow.

CI installs from `package-lock.json` with `npm ci` and uses the Node version in `.nvmrc`. Run the quality checks above locally before review. For a production-mode smoke check, build with the intended environment's public API URL, run `npm start`, and verify the page and API connectivity against that environment. A passing frontend build does not validate backend migrations or database access.

Deployment ownership and hosting are still pending selection. Once selected, releases must preserve the commit, environment and build identity, run an appropriate smoke check, and retain the previous compatible artifact for recovery. A frontend rollback must remain compatible with the deployed `/api/v1/` backend; coordinate incompatible changes before release.

The single canonical project documentation is [../docs/](../docs/), with [../AGENTS.md](../AGENTS.md) as its operating guide. Approved BD-14 tracks it in a separate documentation-only root repository; see the [workspace README](../README.md) for the clone layout. The documentation remote is published, and this application clone alone does not include the shared context. Do not duplicate the documents here.
