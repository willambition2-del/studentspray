export function normalizeUsername(value: string): string {
  return value.trim().normalize('NFKC').toLocaleLowerCase('en-US');
}

export function normalizeEmail(value: string): string {
  return value.trim().normalize('NFKC').toLocaleLowerCase('en-US');
}

export function normalizePhone(value: string): string {
  const trimmed = value.trim();
  const leadingPlus = trimmed.startsWith('+') ? '+' : '';
  return leadingPlus + trimmed.replace(/\D/g, '');
}

export function classifyAndNormalizeIdentifier(value: string): {
  field: 'usernameNormalized' | 'emailNormalized' | 'phoneNormalized';
  value: string;
} {
  const trimmed = value.trim();
  if (trimmed.includes('@')) return { field: 'emailNormalized', value: normalizeEmail(trimmed) };
  if (/^\+?[\d\s()-]{7,}$/.test(trimmed)) return { field: 'phoneNormalized', value: normalizePhone(trimmed) };
  return { field: 'usernameNormalized', value: normalizeUsername(trimmed) };
}
