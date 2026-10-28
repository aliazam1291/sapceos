/*
 * Did this visit come from a search or answer engine? (2026-10-24)
 *
 * Read from document.referrer, which modern browsers trim to the origin for
 * a cross-site navigation — the host is all there is to go on, and all this
 * needs. A search referrer means the reader asked a question and should get
 * the page that answers it, not an opening sequence (BootScreen).
 */
const SEARCH_HOSTS = [
  // google.com, google.co.in, google.com.au, google.de — and not google.evil.example.
  /(^|\.)google\.(com|co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2})$/,
  /(^|\.)bing\.com$/,
  /(^|\.)duckduckgo\.com$/,
  /(^|\.)search\.yahoo\.com$/,
  /(^|\.)yandex\.(ru|com|com\.tr|by|kz|ua)$/,
  /(^|\.)baidu\.com$/,
  /(^|\.)ecosia\.org$/,
  /(^|\.)search\.brave\.com$/,
  /(^|\.)perplexity\.ai$/,
  /(^|\.)chatgpt\.com$/,
  /(^|\.)copilot\.microsoft\.com$/,
];

export function isSearchReferrer(referrer: string) {
  if (!referrer) return false;
  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return false;
  }
  return SEARCH_HOSTS.some((re) => re.test(host));
}
