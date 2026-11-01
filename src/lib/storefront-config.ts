/** Explicit delivery origins only; private uploads are never public by inference.
 * Refs: DECISIONS.md D-19, D-20, BD-15.
 */
export function catalogueMediaOrigins(
  value = process.env.CATALOGUE_MEDIA_ORIGINS ?? "",
): string[] {
  if (!value.trim()) return [];
  return [
    ...new Set(
      value.split(",").map((entry) => {
        const url = new URL(entry.trim());
        if (
          url.protocol !== "https:" ||
          url.username ||
          url.password ||
          url.search ||
          url.hash ||
          url.pathname !== "/"
        )
          throw new Error(
            "Catalogue media configuration requires plain HTTPS origins.",
          );
        return url.origin;
      }),
    ),
  ];
}
