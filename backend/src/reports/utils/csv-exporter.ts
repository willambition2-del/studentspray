/**
 * UTF-8 Arabic CSV Exporter with Spreadsheet Formula Injection Protection
 */

const FORMULA_INJECTION_CHARS = ['=', '+', '-', '@', '\t', '\r'];

/**
 * Sanitizes a single cell value against formula injection and escapes quotes.
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const strVal = typeof value === 'string' ? value : typeof value === 'number' || typeof value === 'boolean' ? String(value) : '';
  let str = strVal.trim();

  // Protect against Spreadsheet Formula Injection
  if (str.length > 0 && FORMULA_INJECTION_CHARS.includes(str[0])) {
    str = `'${str}`;
  }

  // Escape double quotes by doubling them
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Converts array of rows into a UTF-8 CSV string with BOM for Excel compatibility.
 */
export function generateCsv(headers: string[], rows: Array<Array<unknown>>): string {
  const bom = '\uFEFF';
  const headerLine = headers.map(sanitizeCsvCell).join(',');
  const rowLines = rows.map((row) => row.map(sanitizeCsvCell).join(','));

  return `${bom}${headerLine}\n${rowLines.join('\n')}\n`;
}
