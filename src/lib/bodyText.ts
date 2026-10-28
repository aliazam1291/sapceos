/**
 * Body copy markup, shared by the renderer (ui.tsx `Body`) and anything that
 * counts or summarises body copy. Paragraphs are plain strings; "## " and
 * "### " start subheads, and `[label](https://…)` or `[label](/path)` is a
 * link — only those two URL shapes match, anything else stays literal.
 * A path may not start "//": that is a protocol-relative link to another
 * host, not a path on this one.
 */
export const BODY_LINK = /\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/(?!\/)[^)\s]*)\)/g;

/** Body copy as plain words: link markup reduced to its label, subhead markers dropped. */
export function plainBody(parts: string[]) {
  return parts.map((p) => p.replace(BODY_LINK, "$1").replace(/^#{2,3} /, "")).join(" ");
}
