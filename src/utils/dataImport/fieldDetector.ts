export const EMAIL_PATTERNS = ['email', 'e-mail', 'email address', 'email_address', 'emailaddress', 'mail', 'e mail', 'contact email'];
export const PHONE_PATTERNS = ['phone', 'telephone', 'mobile', 'cell', 'contact number', 'phone_number', 'phone number', 'tel'];
export const ADDRESS_PATTERNS = ['address', 'street', 'location', 'street address', 'mailing address', 'physical address'];
export const NAME_PATTERNS = ['name', 'full name', 'contact name', 'person', 'individual'];

export function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function scoreFieldMatch(columnName: string, pattern: string): number {
  const col = normalizeColumnName(columnName);
  const pat = normalizeColumnName(pattern);
  if (!col || !pat) return 0;
  if (col === pat) return 100;
  if (col.includes(pat)) return 90;
  if (pat.includes(col)) return 80;
  return 0;
}

export function detectFieldType(columnName: string, sampleValues: string[]): 'email' | 'phone' | 'address' | 'name' | 'city' | 'state' | 'zipCode' | 'unknown' {
  const name = normalizeColumnName(columnName);

  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const phoneRegex = /\d{3}[^\d]?\d{3}[^\d]?\d{4}/;

  for (const p of EMAIL_PATTERNS) {
    if (scoreFieldMatch(name, p) >= 80) return 'email';
  }
  for (const p of PHONE_PATTERNS) {
    if (scoreFieldMatch(name, p) >= 80) return 'phone';
  }
  for (const p of ADDRESS_PATTERNS) {
    if (scoreFieldMatch(name, p) >= 80) return 'address';
  }
  for (const p of NAME_PATTERNS) {
    if (scoreFieldMatch(name, p) >= 80) return 'name';
  }

  if (name === 'city') return 'city';
  if (name === 'state') return 'state';
  if (name.includes('zip')) return 'zipCode';

  if (sampleValues.some(v => emailRegex.test(v))) return 'email';
  if (sampleValues.some(v => phoneRegex.test(v))) return 'phone';
  if (sampleValues.some(v => /\d{5}(-\d{4})?/.test(v))) return 'zipCode';

  return 'unknown';
}

export function validateEmailField(values: string[]): { isValid: boolean; invalidCount: number; validEmails: string[] } {
  const validEmails: string[] = [];
  let invalidCount = 0;
  const regex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  values.forEach(v => {
    if (regex.test(v)) {
      validEmails.push(v);
    } else if (v) {
      invalidCount++;
    }
  });
  return { isValid: invalidCount === 0, invalidCount, validEmails };
}

export function generateFieldMappingSuggestions(headers: string[], sampleData: any[]): Record<string, string> {
  const suggestions: Record<string, string> = {};
  headers.forEach(header => {
    const values = sampleData.map(row => String(row[header] ?? ''));
    const type = detectFieldType(header, values);
    if (type !== 'unknown') {
      suggestions[header] = type;
    }
  });
  return suggestions;
}
