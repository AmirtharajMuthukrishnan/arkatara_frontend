# Frontend repository guidance

Read the [shared operating guide](../AGENTS.md) and canonical [business context](../docs/BUSINESS_CONTEXT.md), [business rules](../docs/BUSINESS_RULES.md), [architecture](../docs/ARCHITECTURE.md) and [decision log](../docs/DECISIONS.md) before frontend work.

Shared documentation exists only in ../docs/. Do not recreate a local copy. If this repository is checked out alone and those files are unavailable, obtain the canonical context before work that depends on it; do not reconstruct policy from assumptions.

Tasks 1–3 remain complete for their delivered authorized scope, with recorded CI/review/live gates intact. The owner's 2026-09-26 continuation authorizes Task 4's storefront after the lightweight search-architecture review (D-20). Existing policy/publication gates remain binding; reference activation alone never grants booking permission.

Apply the shared [standing search requirement](../AGENTS.md#standing-search-discoverability) and [task ownership map](../docs/TASKS.md#standing-search-discoverability-requirement). Important public content must be server-rendered with stable canonical identity, factual metadata/schema, semantic links and mobile performance. Private routes need authorization plus non-indexing controls. Do not create thin city pages, fabricate product facts or move Task 10 launch work into every feature.

Follow the shared [business reference convention](../AGENTS.md#business-reference-comments). Reference canonical rule/decision IDs at important server-authority, availability and financial-display boundaries; maintain the [central implementation map](../docs/TASKS.md#implementation-reference-map). Keep developer references out of customer-visible copy.

Apply the owner's [frontend design gate](../AGENTS.md#frontend-design-gate) ([D-21](../docs/DECISIONS.md#d-21--frontend-visual-design-awaits-owner-input)). Until approved design references are supplied, implement only design-independent technical foundations and necessary minimal unstyled or clearly temporary functional placeholders. Do not invent polished screens or treat existing Task 4 styling as approved branding. The catalogue, guest cart and staff-interface requirements remain in their original tasks with presentation acceptance pending.

The backend owns pricing, stock, plan limits, tax, serviceability and payment status; local state never reserves stock.

Render active/coming-soon markets and materials from backend configuration. One booking may contain several category boxes; do not create independent checkouts for them. Do not expose provider secrets or mark money paid from a client callback.

Use [TASKS.md](../docs/TASKS.md) for page scope and tests, [STATE_MACHINES.md](../docs/STATE_MACHINES.md) for server-driven status and [INTEGRATIONS.md](../docs/INTEGRATIONS.md) for planned provider boundaries. Do not ship unresolved policy wording or example settings as defaults.
