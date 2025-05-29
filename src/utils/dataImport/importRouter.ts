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
      // Unknown types are not routed
      break;
  }

  return {
    success: true,
    entities,
    errors: [],
    warnings: [],
    stats: {
      totalFiles: 1,
      processedFiles: 1,
      processedRows: records.length,
    },
  };
}

export default { routeImport };

