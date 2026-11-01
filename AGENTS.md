# Frontend repository guidance

Read the [shared operating guide](../AGENTS.md) and canonical [business context](../docs/BUSINESS_CONTEXT.md), [business rules](../docs/BUSINESS_RULES.md), [architecture](../docs/ARCHITECTURE.md) and [decision log](../docs/DECISIONS.md) before frontend work.

Shared documentation exists only in ../docs/. Do not recreate a local copy. If this repository is checked out alone and those files are unavailable, obtain the canonical context before work that depends on it; do not reconstruct policy from assumptions.

Follow the shared [implementation and independent review workflow](../AGENTS.md#implementation-and-independent-review) and [D-28 finding/handoff requirements](../docs/DECISIONS.md#d-28--codex-implementation-and-independent-claude-review). Codex owns implementation and validated corrections; Claude reviews independently. Review feedback cannot redefine canonical requirements, authorize new frontend work in current Task 4 or bypass the owner's design gate.

Tasks 1–3 remain complete for their delivered scope. [D-26](../docs/DECISIONS.md#d-26--task-4-cross-app-model-completion) makes current Task 4 backend model completion, with no new frontend work. Original storefront 4.1–4.7 now execute under Task 5, retaining IDs/source/evidence. Existing policy/publication gates remain; reference activation alone never grants booking permission.

Apply the shared [standing search requirement](../AGENTS.md#standing-search-discoverability) and [task ownership map](../docs/TASKS.md#standing-search-discoverability-requirement). Important public content must be server-rendered with stable canonical identity, factual metadata/schema, semantic links and mobile performance. Private routes need authorization plus non-indexing controls. Do not create thin city pages, fabricate product facts or move Task 10 launch work into every feature.

Follow the shared [business reference convention](../AGENTS.md#business-reference-comments). Reference canonical rule/decision IDs at important server-authority, availability and financial-display boundaries; maintain the [central implementation map](../docs/TASKS.md#implementation-reference-map). Keep developer references out of customer-visible copy.

Apply the owner's [frontend design gate](../AGENTS.md#frontend-design-gate) ([D-21](../docs/DECISIONS.md#d-21--frontend-visual-design-awaits-owner-input)). Until approved references are supplied, implement only authorized design-independent foundations and necessary temporary placeholders. Do not treat original Task 4 styling as approved branding. D-26 transfers that storefront scope to Task 5; all final presentation acceptance remains pending.

Use D-23–D-25 for separate staff/customer authentication, staff host/API boundaries, permanent guest checkout and booking phone verification before upfront payment. Customer features remain disabled initially; no phone-matched or claimed guest order history. Frontend flags, route prefixes and client payment results never replace backend authority.

The backend owns pricing, stock, plan limits, tax, serviceability and payment status; local state never reserves stock.

D-27/R-39/R-40 require persistent guest booking tracking via a browser cookie and individual booking grants, with stock held only when payment starts after OTP. These persistence models now exist, but Task 6 must implement the cookie/CSRF/access, idempotency and booking UI/API contracts. Do not place raw access tokens in localStorage, infer confirmation from a gateway callback or add phone-based booking history.

Render active/coming-soon markets and materials from backend configuration. One booking may contain several category boxes; do not create independent checkouts for them. Do not expose provider secrets or mark money paid from a client callback.

Use [TASKS.md](../docs/TASKS.md) for page scope and tests, [STATE_MACHINES.md](../docs/STATE_MACHINES.md) for server-driven status and [INTEGRATIONS.md](../docs/INTEGRATIONS.md) for planned provider boundaries. Do not ship unresolved policy wording or example settings as defaults.
