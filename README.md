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

## Quality checks

- npm run lint
- npm run format:check
- npm run typecheck
- npm run test:run
- npm run build

The initial page is a lightweight launch placeholder. Storefront catalogue, Trial Cart, checkout, agent portal, payments and messaging belong to later authorized tasks.
