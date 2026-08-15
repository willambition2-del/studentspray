/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Normalizes Arabic text by removing Tashkeel (diacritics), standardizing
 * Alefs, Hamzas, Ya/Alef Maqsura, Ta Marbouta, Tatweel, and extra spaces.
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';

  let normalized = text.toString().trim();

  // 1. Remove Tashkeel (diacritics)
  normalized = normalized.replace(/[\u064B-\u0652\u0670]/g, '');

  // 2. Remove Tatweel (ـ)
  normalized = normalized.replace(/\u0640/g, '');

  // 3. Normalize Alef variations (أ, إ, آ, ٱ -> ا)
  normalized = normalized.replace(/[أإآٱ]/g, 'ا');

  // 4. Normalize Ya and Alef Maqsura (ى -> ي)
  normalized = normalized.replace(/ى/g, 'ي');

  // 5. Normalize Ta Marbouta to Ha (ة -> ه) for flexible matches, but keep original for exact scoring
  normalized = normalized.replace(/ة/g, 'ه');

  // 6. Normalize Hamzas (ؤ, ئ -> ء)
  normalized = normalized.replace(/[ؤئ]/g, 'ء');

  // 7. Lowercase English text if present
  normalized = normalized.toLowerCase();

  // 8. Collapse whitespace
  normalized = normalized.replace(/\s+/g, ' ');

  return normalized;
}

/**
 * Strip common Arabic prefixes like "الـ", "و", "بـ", "كـ", "لـ" for root fuzzy comparison
 */
export function stripArabicPrefixes(term: string): string {
  let cleaned = normalizeArabicText(term);
  if (cleaned.startsWith('ال') && cleaned.length > 4) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
}

/**
 * Calculates Levenshtein Distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const matrix: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) matrix[i][0] = i;
  for (let j = 0; j <= n; j++) matrix[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,       // deletion
        matrix[i][j - 1] + 1,       // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[m][n];
}

/**
 * Returns a fuzzy similarity score between 0 and 100 based on exactness, prefix match, substring, and edit distance.
 */
export function calculateMatchScore(query: string, target: string): number {
  if (!query || !target) return 0;

  const rawQuery = query.trim();
  const rawTarget = target.trim();

  // 1. Absolute exact match
  if (rawQuery === rawTarget) return 100;

  const normQuery = normalizeArabicText(rawQuery);
  const normTarget = normalizeArabicText(rawTarget);

  if (normQuery === normTarget) return 98;

  // 2. Target starts with query or query starts with target
  if (normTarget.startsWith(normQuery)) return 92;
  if (normQuery.startsWith(normTarget)) return 88;

  // 3. Target contains normalized query
  if (normTarget.includes(normQuery)) return 85;

  // 4. Tokenized word overlap
  const queryTokens = normQuery.split(' ').filter(Boolean);
  const targetTokens = normTarget.split(' ').filter(Boolean);

  let matchedTokens = 0;
  for (const qToken of queryTokens) {
    if (qToken.length < 2) continue;
    
    // Direct token inclusion
    const directMatch = targetTokens.some(tToken => tToken.includes(qToken) || qToken.includes(tToken));
    if (directMatch) {
      matchedTokens++;
      continue;
    }

    // Prefix stripped match (e.g. "الكوفي" vs "كوفي")
    const strippedQ = stripArabicPrefixes(qToken);
    const strippedMatch = targetTokens.some(tToken => stripArabicPrefixes(tToken) === strippedQ);
    if (strippedMatch) {
      matchedTokens += 0.85;
      continue;
    }

    // Fuzzy token match using Levenshtein for minor typos
    for (const tToken of targetTokens) {
      if (Math.abs(qToken.length - tToken.length) <= 2 && qToken.length >= 3) {
        const dist = levenshteinDistance(qToken, tToken);
        if (dist <= 2) {
          matchedTokens += 0.7;
          break;
        }
      }
    }
  }

  if (queryTokens.length > 0 && matchedTokens > 0) {
    const tokenScore = (matchedTokens / queryTokens.length) * 80;
    return Math.min(Math.round(tokenScore), 85);
  }

  // 5. Full string Levenshtein distance fallback
  if (normQuery.length >= 3 && normTarget.length >= 3) {
    const dist = levenshteinDistance(normQuery, normTarget);
    const maxLen = Math.max(normQuery.length, normTarget.length);
    const similarityRatio = 1 - dist / maxLen;
    if (similarityRatio > 0.6) {
      return Math.round(similarityRatio * 65);
    }
  }

  return 0;
}

/**
 * Finds the closest matching correction suggestion ("هل تقصد؟") from a list of known entity names
 */
export function findCorrectionSuggestion(query: string, dictionary: string[]): string | null {
  const normQuery = normalizeArabicText(query);
  if (!normQuery || normQuery.length < 3) return null;

  let bestCandidate: string | null = null;
  let bestScore = 0;

  for (const item of dictionary) {
    const score = calculateMatchScore(query, item);
    // If score is between 50 and 85 (fuzzy/partial match but not perfect match)
    if (score >= 50 && score < 95 && score > bestScore) {
      bestScore = score;
      bestCandidate = item;
    }
  }

  return bestCandidate;
}
