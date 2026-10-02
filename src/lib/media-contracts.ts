import { ApiError } from "./api";

export type ProductMediaRole = "MAIN" | "ADDITIONAL" | "VIDEO" | "THUMBNAIL";
export type ProductMediaContentType = "image/png" | "image/jpeg" | "video/mp4";

/**
 * Media identity is independent of hosting. This private onboarding contract
 * grants no public URL or publication/booking permission.
 * Refs: BUSINESS_RULES.md R-11; DECISIONS.md D-14, BD-15.
 */
export interface ProductMediaMetadata {
  schema_version: 1;
  id: string;
  product_id: string;
  source_media_id: string | null;
  role: ProductMediaRole;
  status: "DRAFT" | "RETIRED";
  sort_order: number;
  alt_text: string;
  content_type: ProductMediaContentType;
  byte_size: number;
  sha256: string;
  delivery: { state: "PRIVATE" };
}

function invalid(): never {
  throw new ApiError("Invalid product media metadata.", "invalid_response");
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid();
  return value as Record<string, unknown>;
}

function identifier(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(value)
  )
    invalid();
  return value;
}

export function parseProductMediaMetadata(
  value: unknown,
): ProductMediaMetadata {
  const media = record(value);
  const keys = [
    "schema_version",
    "id",
    "product_id",
    "source_media_id",
    "role",
    "status",
    "sort_order",
    "alt_text",
    "content_type",
    "byte_size",
    "sha256",
    "delivery",
  ];
  if (
    Object.keys(media).length !== keys.length ||
    keys.some((key) => !(key in media))
  )
    invalid();
  const delivery = record(media.delivery);
  if (Object.keys(delivery).length !== 1 || delivery.state !== "PRIVATE")
    invalid();
  if (
    media.schema_version !== 1 ||
    typeof media.status !== "string" ||
    !["DRAFT", "RETIRED"].includes(media.status)
  )
    invalid();
  if (
    typeof media.role !== "string" ||
    !["MAIN", "ADDITIONAL", "VIDEO", "THUMBNAIL"].includes(media.role)
  )
    invalid();
  if (
    typeof media.content_type !== "string" ||
    !["image/png", "image/jpeg", "video/mp4"].includes(media.content_type)
  )
    invalid();
  if ((media.role === "VIDEO") !== (media.content_type === "video/mp4"))
    invalid();
  if (typeof media.alt_text !== "string" || !media.alt_text.trim()) invalid();
  if (!Number.isSafeInteger(media.sort_order) || Number(media.sort_order) < 0)
    invalid();
  if (!Number.isSafeInteger(media.byte_size) || Number(media.byte_size) <= 0)
    invalid();
  if (typeof media.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(media.sha256))
    invalid();
  const source =
    media.source_media_id === null ? null : identifier(media.source_media_id);
  if ((media.role === "THUMBNAIL") !== (source !== null)) invalid();
  const id = identifier(media.id);
  if (id === source) invalid();
  return {
    schema_version: 1,
    id,
    product_id: identifier(media.product_id),
    source_media_id: source,
    role: media.role as ProductMediaRole,
    status: media.status as "DRAFT" | "RETIRED",
    sort_order: media.sort_order as number,
    alt_text: media.alt_text,
    content_type: media.content_type as ProductMediaContentType,
    byte_size: media.byte_size as number,
    sha256: media.sha256,
    delivery: { state: "PRIVATE" },
  };
}
