# WSZLLP Data Migration Plan

## Data Source Analysis

The client's data is currently stored in a multi-sheet Excel file ("EVICTIONS 2025 NEW.xlsx") containing the following key data categories:

1. **Case Information** (Complaint sheet, ALL EVICTIONS FILES)
2. **Client/Property Management** (PM INFO sheet)
3. **Court Hearings** (ZOOM sheet, Court 25)
4. **Document Tracking** (various document sheets)
5. **Service of Process** (SPS 25, SHERIFF sheets)
6. **Billing Information** (Outstanding Invoices, Payment Plan)

## Data Mapping: Excel to WSZLLP Platform

### 1. Case Entity Mapping

**Source:** Primarily from the "Complaint" sheet with data also in "ALL EVICTIONS FILES"

| Excel Column | Platform Field | Notes |
|--------------|---------------|-------|
| File # | caseId | Unique identifier for cases |
| Case # | courtCaseNumber | Official court case number |
| Plaintiff 1 | plaintiff | Property management company name |
| Defendant 1 | defendant | Primary tenant name |
| Property Address, City, State, Zip | address | Full property address |
| From Date | intakeDate | Case start date |
| To Date | (varies) | End date or notice period |
| Past Due Balance | (financial data) | Amount owed |
| Notice Total | (financial data) | Total with fees |
| Court Costs | (financial data) | Court fees |
| Owner | (additional metadata) | Property owner |

### 2. Property Management / Client Mapping

**Source:** "PM INFO" sheet

| Excel Column | Platform Field | Notes |
|--------------|---------------|-------|
| Company | name | Client company name |
| Business Street, Street 2, City, State, Postal Code | address | Office address |
| Company Main Phone | phone | Contact phone |
| E-mail Address | email | Contact email |

### 3. Hearing Entity Mapping

**Source:** "ZOOM" sheet, "Court 25" sheet

| Excel Column | Platform Field | Notes |
|--------------|---------------|-------|
| Courtroom | courtName | Location of hearing |
| Judge | (judge metadata) | Presiding judge |
| Meeting ID, Password | (zoom metadata) | Virtual hearing details |
| (Date fields from Court 25) | hearingDate | Court date and time |

### 4. Document Entity Mapping

**Source:** Various document sheets (Complaint, Summons, etc.)

| Excel Column | Platform Field | Notes |
|--------------|---------------|-------|
| File # | caseId | Reference to parent case |
| Document Type | type | Type of legal document |
| File Date | createdAt | Date document created |
| Various status fields | status | Document status |

### 5. Service Tracking Mapping

**Source:** "SPS 25", "SHERIFF" sheets

| Excel Column | Platform Field | Notes |
|--------------|---------------|-------|
| File # | caseId | Reference to parent case |
| Service Date | serviceDate | Date of service attempt |
| Outcome fields | result | Success/failure of service |
| Service method | method | Sheriff or private process server |

### 6. Invoice Mapping

**Source:** "Outstanding Invoices", "Payment Plan" sheets

| Excel Column | Platform Field | Notes |
|--------------|---------------|-------|
| File # | caseId | Reference to parent case |
| Inv # | invoiceId | Unique invoice identifier |
| Amount | amount | Invoice total |
| Costs | (cost breakdown) | Court costs |
| Atty Fee | (fee breakdown) | Attorney fees |
| Billing Notes | (metadata) | Additional information |

## Data Migration Strategy

### Phase 1: Schema Preparation

1. **Create Import Modules**:
   - Develop a dedicated data import tool in `/src/utils/dataImport.ts`
   - Create data mapping functions for each entity type

2. **Add Database Schema Extensions**:
   - Ensure the React app's data model accommodates all necessary fields
   - Add any missing fields identified in the Excel file

### Phase 2: Parser Development

Create parsers for each major entity type:

```typescript
// Example parser structure
import * as XLSX from 'xlsx';
import { Case, Client, Hearing, Document, Invoice } from '../types/schema';

export function parseCases(workbook: XLSX.WorkBook): Case[] {
  const sheet = workbook.Sheets['Complaint'];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  return data.map(row => ({
    caseId: row['File #'] || generateId(),
    plaintiff: row['Plaintiff 1'],
    defendant: row['Defendant 1'],
    address: `${row['Property Address']}, ${row['City']}, ${row['State']} ${row['Zip']}`,
    status: determineStatus(row),
    intakeDate: formatDate(row['From Date']),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

// Similar parsers for other entities
```

### Phase 3: Implementation Tasks

1. **Build Data Import UI**:
   - Create a secure admin-only import interface
   - Allow spreadsheet upload and validation
   - Show preview of data to be imported

2. **Implement Data Transformation**:
   - Normalize data (consistent naming, formatting)
   - Handle special cases and edge conditions
   - Maintain entity relationships

3. **Create Data Validation**:
   - Validate required fields
   - Check data integrity and relationships
   - Flag potential issues for manual review

4. **Develop Import Process**:
   - Build batch-processing capability
   - Add logging for tracking import progress
   - Create rollback mechanism for failed imports

### Phase 4: Testing and Deployment

1. **Sandbox Testing**:
   - Test with subset of real data
   - Verify all relationships maintained
   - Check for data integrity issues

2. **Validation Reporting**:
   - Create reports showing data validation results
   - Identify any problematic records
   - Provide interface for correcting issues

3. **Production Migration**:
   - Schedule off-hours full import
   - Back up existing data
   - Monitor system performance during import
   - Verify imported data

## Technical Implementation Notes

1. **File Parsing Library**: Use `xlsx` or `exceljs` for reading Excel data

2. **Data Validation**: Implement Zod schemas for validation during import

3. **Relationship Handling**: Preserve parent-child relationships between entities

4. **Performance Considerations**:
   - Process in batches of ~100 records
   - Add progress indicators
   - Consider worker threads for large imports

## Next Steps

1. Implement the basic parser module
2. Create a simple import UI
3. Develop validation logic
4. Build batch import processor
5. Test with sample data sets
6. Refine and prepare for full migration