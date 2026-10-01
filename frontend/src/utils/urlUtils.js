/**
 * URL Utilities for ResumeCraft
 * Handles robust normalization, validation, and display formatting for resume links.
 */

/**
 * Normalizes a URL:
 * - Empty/whitespace string returns ''
 * - If already starts with http:// or https:// (case-insensitive), returns trimmed string
 * - If domain without protocol (e.g. github.com/Nandeniworks), prepends https://
 * - Prevents multiple https:// prepending
 */
export function normalizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

/**
 * Validates a URL:
 * - Empty values are allowed (since URL fields in resumes are optional)
 * - Checks that the normalized URL has a valid protocol and hostname with a dot or localhost
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (!trimmed) return true;

  const normalized = normalizeUrl(trimmed);
  try {
    const parsed = new URL(normalized);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    // Must have a valid hostname containing a dot (e.g. domain.com) or be localhost
    if (!parsed.hostname || (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost')) {
      return false;
    }
    // Hostname should not contain whitespace
    if (/\s/.test(parsed.hostname)) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Clean URL for display:
 * Strips protocol and trailing slash for a clean, professional aesthetic in previews and PDFs.
 */
export function cleanDisplayUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
}
