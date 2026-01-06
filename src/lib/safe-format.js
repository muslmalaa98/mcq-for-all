export function escapeHtml(input) {
  const s = String(input ?? "");
  return s.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default: return ch;
    }
  });
}

/**
 * Safe scientific mini-markup:
 *  H~2~O  => H<sub>2</sub>O
 *  x^2^   => x<sup>2</sup>
 * Security: escape first, then only inject <sub>/<sup> tags.
 */
export function formatScientific(raw) {
  const escaped = escapeHtml(raw);

  // sup first then sub (or vice versa) — both are safe after escape
  return escaped
    .replace(/\^([^^]+)\^/g, "<sup>$1</sup>")
    .replace(/~([^~]+)~/g, "<sub>$1</sub>");
}
