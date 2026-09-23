# Frontend repository guidance

Read the [shared operating guide](../AGENTS.md) and canonical [business context](../docs/BUSINESS_CONTEXT.md), [business rules](../docs/BUSINESS_RULES.md), [architecture](../docs/ARCHITECTURE.md) and [decision log](../docs/DECISIONS.md) before frontend work.

Shared documentation exists only in ../docs/. Do not recreate a local copy. If this repository is checked out alone and those files are unavailable, obtain the canonical context before work that depends on it; do not reconstruct policy from assumptions.

Task 1 foundation implementation is authorized as of 2026-09-19. Later storefront/domain behavior remains governed by the backlog and unresolved-decision gates.

Once authorized, follow the Next.js/React direction with a premium mobile-first catalogue, guest localStorage cart and a separate authenticated staff experience. The backend owns pricing, stock, plan limits, tax, serviceability and payment status; local state never reserves stock.

Render active/coming-soon markets and materials from backend configuration. One booking may contain several category boxes; do not create independent checkouts for them. Do not expose provider secrets or mark money paid from a client callback.

Use [TASKS.md](../docs/TASKS.md) for page scope and tests, [STATE_MACHINES.md](../docs/STATE_MACHINES.md) for server-driven status and [INTEGRATIONS.md](../docs/INTEGRATIONS.md) for planned provider boundaries. Do not ship unresolved policy wording or example settings as defaults.
