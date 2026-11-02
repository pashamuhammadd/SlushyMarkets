/**
 * Renders schema.org structured data as a JSON-LD script tag.
 * "<" is escaped so a string in the payload can never close the script element.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
