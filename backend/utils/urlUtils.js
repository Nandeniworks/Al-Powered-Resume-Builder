/**
 * URL Utilities for ResumeCraft Backend
 * Handles robust normalization, validation, and clean display formatting for resume links.
 */

function normalizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function isValidUrl(url) {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (!trimmed) return true;

  const normalized = normalizeUrl(trimmed);
  try {
    const parsed = new URL(normalized);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    if (!parsed.hostname || (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost')) {
      return false;
    }
    if (/\s/.test(parsed.hostname)) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

function cleanDisplayUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
}

module.exports = {
  normalizeUrl,
  isValidUrl,
  cleanDisplayUrl,
};
