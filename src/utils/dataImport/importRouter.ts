import { validateEmailField, detectFieldType } from './fieldDetector';

export function routeImport(
  dataType: string,
  records: Record<string, string>[]
): any {
  const entities = {
    cases: [] as Record<string, string>[],
    hearings: [] as Record<string, string>[],
    documents: [] as Record<string, string>[],
    invoices: [] as Record<string, string>[],
    paymentPlans: [] as Record<string, string>[],
    contacts: [] as Record<string, string>[],
    serviceLogs: [] as Record<string, string>[],
  };

  console.log('routeImport type:', dataType, 'records:', records.length);

  const warnings: string[] = [];

  if (dataType === 'contact') {
    const emails = records.map(r => String(r.email || ''));
    const validation = validateEmailField(emails);
    if (!validation.isValid) {
      warnings.push(`${validation.invalidCount} contact emails failed validation`);
    }
  }

  switch (dataType) {
    case 'case':
    case 'complaint':
    case 'all_evictions_files':
      entities.cases = records;
      break;
    case 'hearing':
      entities.hearings = records;
      break;
    case 'document':
      entities.documents = records;
      break;
    case 'invoice':
      entities.invoices = records;
      break;
    case 'contact':
      entities.contacts = records;
      break;
    default:
      break;
  }

  if (
    dataType === 'unknown' &&
    records.length > 0 &&
    Object.values(entities).every(arr => arr.length === 0)
  ) {
    const firstHeader = Object.keys(records[0])[0];
    const guessed = detectFieldType(firstHeader, [String(records[0][firstHeader])]);
    if (guessed === 'email' || guessed === 'phone' || guessed === 'address' || guessed === 'name') {
      entities.contacts = records;
      warnings.push('Falling back to contact import based on data inspection');
    }
  }

  return {
    success: true,
    entities,
    errors: [],
    warnings,
    stats: {
      totalFiles: 1,
      processedFiles: 1,
      processedRows: records.length,
    },
  };
}

export default { routeImport };

