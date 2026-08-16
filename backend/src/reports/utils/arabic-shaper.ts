/**
 * Pure TypeScript Arabic Reshaper & Bidirectional Reorderer for PDFKit
 * Converts logical Unicode Arabic text into shaped presentation forms with correct RTL visual order.
 */

// Arabic Unicode Table (0x0621 to 0x064A + special chars)
const ARABIC_TABLE: Record<number, { isolated: number; final: number; initial: number; medial: number }> = {
  0x0621: { isolated: 0xfe80, final: 0xfe80, initial: 0xfe80, medial: 0xfe80 }, // Hamza
  0x0622: { isolated: 0xfe81, final: 0xfe82, initial: 0xfe81, medial: 0xfe82 }, // Alef with Madda
  0x0623: { isolated: 0xfe83, final: 0xfe84, initial: 0xfe83, medial: 0xfe84 }, // Alef with Hamza Above
  0x0624: { isolated: 0xfe85, final: 0xfe86, initial: 0xfe85, medial: 0xfe86 }, // Waw with Hamza
  0x0625: { isolated: 0xfe87, final: 0xfe88, initial: 0xfe87, medial: 0xfe88 }, // Alef with Hamza Below
  0x0626: { isolated: 0xfe89, final: 0xfe8a, initial: 0xfe8b, medial: 0xfe8c }, // Yeh with Hamza
  0x0627: { isolated: 0xfe8d, final: 0xfe8e, initial: 0xfe8d, medial: 0xfe8e }, // Alef
  0x0628: { isolated: 0xfe8f, final: 0xfe90, initial: 0xfe91, medial: 0xfe92 }, // Beh
  0x0629: { isolated: 0xfe93, final: 0xfe94, initial: 0xfe93, medial: 0xfe94 }, // Teh Marbuta
  0x062a: { isolated: 0xfe95, final: 0xfe96, initial: 0xfe97, medial: 0xfe98 }, // Teh
  0x062b: { isolated: 0xfe99, final: 0xfe9a, initial: 0xfe9b, medial: 0xfe9c }, // Theh
  0x062c: { isolated: 0xfe9d, final: 0xfe9e, initial: 0xfe9f, medial: 0xfea0 }, // Jeem
  0x062d: { isolated: 0xfea1, final: 0xfea2, initial: 0xfea3, medial: 0xfea4 }, // Hah
  0x062e: { isolated: 0xfea5, final: 0xfea6, initial: 0xfea7, medial: 0xfea8 }, // Khah
  0x062f: { isolated: 0xfea9, final: 0xfeaa, initial: 0xfea9, medial: 0xfeaa }, // Dal
  0x0630: { isolated: 0xfeab, final: 0xfeac, initial: 0xfeab, medial: 0xfeac }, // Thal
  0x0631: { isolated: 0xfead, final: 0xfeae, initial: 0xfead, medial: 0xfeae }, // Reh
  0x0632: { isolated: 0xfeaf, final: 0xfeb0, initial: 0xfeaf, medial: 0xfeb0 }, // Zain
  0x0633: { isolated: 0xfeb1, final: 0xfeb2, initial: 0xfeb3, medial: 0xfeb4 }, // Seen
  0x0634: { isolated: 0xfeb5, final: 0xfeb6, initial: 0xfeb7, medial: 0xfeb8 }, // Sheen
  0x0635: { isolated: 0xfeb9, final: 0xfeba, initial: 0xfebb, medial: 0xfebc }, // Sad
  0x0636: { isolated: 0xfebd, final: 0xfebe, initial: 0xfebf, medial: 0xfec0 }, // Dad
  0x0637: { isolated: 0xfec1, final: 0xfec2, initial: 0xfec3, medial: 0xfec4 }, // Tah
  0x0638: { isolated: 0xfec5, final: 0xfec6, initial: 0xfec7, medial: 0xfec8 }, // Zah
  0x0639: { isolated: 0xfec9, final: 0xfeca, initial: 0xfecb, medial: 0xfecc }, // Ain
  0x063a: { isolated: 0xfecd, final: 0xfece, initial: 0xfecf, medial: 0xfed0 }, // Ghain
  0x0641: { isolated: 0xfed1, final: 0xfed2, initial: 0xfed3, medial: 0xfed4 }, // Feh
  0x0642: { isolated: 0xfed5, final: 0xfed6, initial: 0xfed7, medial: 0xfed8 }, // Qaf
  0x0643: { isolated: 0xfed9, final: 0xfeda, initial: 0xfedb, medial: 0xfedc }, // Kaf
  0x0644: { isolated: 0xfedd, final: 0xfede, initial: 0xfedf, medial: 0xfee0 }, // Lam
  0x0645: { isolated: 0xfee1, final: 0xfee2, initial: 0xfee3, medial: 0xfee4 }, // Meem
  0x0646: { isolated: 0xfee5, final: 0xfee6, initial: 0xfee7, medial: 0xfee8 }, // Noon
  0x0647: { isolated: 0xfee9, final: 0xfeea, initial: 0xfeeb, medial: 0xfeec }, // Heh
  0x0648: { isolated: 0xfeed, final: 0xfeee, initial: 0xfeed, medial: 0xfeee }, // Waw
  0x0649: { isolated: 0xfeef, final: 0xfef0, initial: 0xfeef, medial: 0xfef0 }, // Alef Maksura
  0x064a: { isolated: 0xfef1, final: 0xfef2, initial: 0xfef3, medial: 0xfef4 }, // Yeh
};

// Non-connecting following characters
const RIGHT_JOIN_ONLY = new Set([
  0x0621, 0x0622, 0x0623, 0x0624, 0x0625, 0x0627, 0x062f, 0x0630, 0x0631, 0x0632, 0x0648, 0x0649, 0xfe80,
]);

// Tashkeel / Harakat range
function isTashkeel(code: number): boolean {
  return code >= 0x064b && code <= 0x065f;
}

function isArabic(code: number): boolean {
  return (code >= 0x0600 && code <= 0x06ff) || (code >= 0xfe70 && code <= 0xfeff);
}

/**
 * Shapes Arabic text with ligatures (Lam-Alef) and connects glyphs.
 */
export function shapeArabic(text: string): string {
  if (!text) return '';

  // Remove tashkeel for clean document rendering
  const chars: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (!isTashkeel(code)) {
      chars.push(code);
    }
  }

  const result: number[] = [];
  const len = chars.length;

  for (let i = 0; i < len; i++) {
    const current = chars[i];

    // Lam-Alef ligatures check
    if (current === 0x0644 && i + 1 < len) {
      const next = chars[i + 1];
      let lamAlefChar = 0;

      if (next === 0x0622) lamAlefChar = 0xfef5; // Lam + Madda
      else if (next === 0x0623) lamAlefChar = 0xfef7; // Lam + Hamza Above
      else if (next === 0x0625) lamAlefChar = 0xfef9; // Lam + Hamza Below
      else if (next === 0x0627) lamAlefChar = 0xfefb; // Lam + Alef

      if (lamAlefChar !== 0) {
        const prev = i > 0 ? chars[i - 1] : 0;
        const prevConnects = prev !== 0 && ARABIC_TABLE[prev] && !RIGHT_JOIN_ONLY.has(prev);
        result.push(prevConnects ? lamAlefChar + 1 : lamAlefChar);
        i++; // skip next alef
        continue;
      }
    }

    const mapping = ARABIC_TABLE[current];
    if (!mapping) {
      result.push(current);
      continue;
    }

    const prev = i > 0 ? chars[i - 1] : 0;
    const next = i + 1 < len ? chars[i + 1] : 0;

    const prevConnects = prev !== 0 && ARABIC_TABLE[prev] && !RIGHT_JOIN_ONLY.has(prev);
    const nextConnects = next !== 0 && ARABIC_TABLE[next] && current !== 0x0621;

    if (prevConnects && nextConnects && !RIGHT_JOIN_ONLY.has(current)) {
      result.push(mapping.medial);
    } else if (prevConnects) {
      result.push(mapping.final);
    } else if (nextConnects && !RIGHT_JOIN_ONLY.has(current)) {
      result.push(mapping.initial);
    } else {
      result.push(mapping.isolated);
    }
  }

  return String.fromCharCode(...result);
}

/**
 * Reverses shaped Arabic words for RTL rendering while keeping LTR numbers and English words.
 */
export function processArabicBidi(text: string): string {
  if (!text) return '';

  const shaped = shapeArabic(text);

  // Segment by Arabic chunks vs Latin/Number chunks
  const tokens: Array<{ isAr: boolean; text: string }> = [];
  let currentToken = '';
  let currentIsAr: boolean | null = null;

  for (let i = 0; i < shaped.length; i++) {
    const char = shaped[i];
    const code = char.charCodeAt(0);
    const charIsAr = isArabic(code);

    if (currentIsAr === null) {
      currentIsAr = charIsAr;
      currentToken += char;
    } else if (currentIsAr === charIsAr) {
      currentToken += char;
    } else {
      tokens.push({ isAr: currentIsAr, text: currentToken });
      currentIsAr = charIsAr;
      currentToken = char;
    }
  }

  if (currentToken.length > 0 && currentIsAr !== null) {
    tokens.push({ isAr: currentIsAr, text: currentToken });
  }

  // Process RTL reordering
  const processedTokens = tokens.map((t) => {
    if (t.isAr) {
      return t.text.split('').reverse().join('');
    }
    return t.text;
  });

  return processedTokens.reverse().join('');
}
