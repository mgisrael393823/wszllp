import Papa from 'papaparse';

/**
 * Parse CSV content into an array of records.
 * Delimiter is detected from the header line.
 */
export function parseCsv(content: string): Record<string, string>[] {
  const headerLine = content.split('\n')[0] || '';
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semiCount = (headerLine.match(/;/g) || []).length;
  const delimiter = semiCount > commaCount ? ';' : ',';

  const { data, errors } = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    delimiter,
  });

  if (errors.length) console.warn('CSV parse errors:', errors);

  return data.map(row =>
    Object.entries(row).reduce<Record<string, string>>((acc, [k, v]) => {
      const key = k.trim().replace(/^"|"$/g, '');
      acc[key] = v as unknown as string;
      return acc;
    }, {})
  );
}

export default { parseCsv };

