# E-Filing Integration Refactor Request

## Objective
Refactor our e-filing integration to match Tyler API requirements exactly, eliminating all errors and redundant logic.

## Background
We've been experiencing "Invalid DocumentOptionalService code" errors because our payload structure doesn't match Tyler's exact requirements. We need a comprehensive refactor to ensure reliable e-filing submissions.

## Current Issues
1. **Invalid optional_services**: Code "282616" is rejected by Tyler API for filing code "174403"
2. **Inconsistent cross_references**: Sometimes missing or using wrong attorney number
3. **Module system conflicts**: Mix of CommonJS and ES modules causing import errors
4. **Hardcoded values scattered**: Attorney IDs, payment accounts spread across multiple files
5. **Poor error handling**: API errors not properly caught or logged

## Requirements

### 1. Code Inspection
Review these key files:
- `src/components/efile/EFileSubmissionForm.tsx`
- `src/utils/efile/*.ts`
- `scripts/transform-mock-to-tyler-payload.js`
- `api/tyler/*.js`

### 2. Payload Structure Requirements
The payload MUST match this exact structure:

```json
{
  "data": {
    "reference_id": "DRAFT386392",
    "jurisdiction": "cook:cvd1",
    "case_category": "7",
    "case_type": "237037",
    "case_parties": [
      {
        "id": "Party_653222202",
        "type": "189138",
        "is_business": "false",
        "first_name": "michael",
        "last_name": "israel",
        "address_line_1": "943 N Kingsbury St",
        "city": "Chicago",
        "state": "IL",
        "zip_code": "60610",
        "phone_number": "8479242888",
        "email": "misrael00@gmail.com",
        "lead_attorney": "81d6ab59-3c7b-4e2c-8ed6-da4148d6353c"
      },
      {
        "id": "Party_295395702",
        "type": "189131",
        "is_business": "false",
        "first_name": "michael",
        "last_name": "israel",
        "address_line_1": "943 N Kingsbury St",
        "city": "Chicago",
        "state": "IL",
        "zip_code": "60610",
        "phone_number": "8479242888",
        "email": "misrael00@gmail.com"
      }
    ],
    "cross_references": [
      { "number": "44113", "code": "190860" }
    ],
    "filings": [
      {
        "code": "174403",
        "description": "Complaint / Petition - Eviction - Residential - Joint Action",
        "file": "base64://<BASE64_ENCODED_COMPLAINT_PDF>",
        "file_name": "Eviction_Complaint.pdf",
        "doc_type": "189705"
      },
      {
        "code": "189495",
        "description": "Summons - Issued And Returnable",
        "file": "base64://<BASE64_ENCODED_SUMMONS_PDF>",
        "file_name": "Summons.pdf",
        "doc_type": "189705"
      },
      {
        "code": "189259",
        "description": "Affidavit Filed",
        "file": "base64://<BASE64_ENCODED_AFFIDAVIT_PDF>",
        "file_name": "Affidavit.pdf",
        "doc_type": "189705"
      }
    ],
    "filing_type": "EFile",
    "state": "il",
    "filing_attorney_id": "81d6ab59-3c7b-4e2c-8ed6-da4148d6353c",
    "filing_party_id": "Party_653222202",
    "payment_account_id": "a04b9fd2-ab8f-473c-a080-78857520336b",
    "amount_in_controversy": "1500",
    "show_amount_in_controversy": "true"
  }
}
```

### 3. Specific Refactor Tasks

#### a. Remove/Fix Invalid Code
- **REMOVE** all `optional_services` blocks - Tyler rejects code "282616"
- **REMOVE** random placeholder generation for cross_references
- **REMOVE** S3 URL references - all files must be base64 encoded
- **FIX** filing codes to match case types exactly:
  - Residential Joint Action (237037, 237042) → "174403"
  - Commercial Joint Action (201996, 201995) → "174400"
  - Residential Possession (237036, 237041) → "174402"
  - Commercial Possession (201991, 201992) → "174399"

#### b. Enforce Required Fields
- **ALWAYS** include exactly 3 filings (Complaint, Summons, Affidavit)
- **ALWAYS** include cross_references for Joint Action cases: `[{ "number": "44113", "code": "190860" }]`
- **VALIDATE** all case_parties have required fields: id, type, is_business, first_name, last_name, address_line_1, city, state, zip_code, phone_number, email
- **REQUIRE** plaintiff party to have `lead_attorney` field

#### c. Configuration Improvements
Create a centralized config file (`src/config/tyler-api.ts`):
```typescript
export const TYLER_CONFIG = {
  ATTORNEY_CROSS_REF: "44113",
  CROSS_REF_CODE: "190860",
  DEFAULT_ATTORNEY_ID: "81d6ab59-3c7b-4e2c-8ed6-da4148d6353c",
  DEFAULT_PAYMENT_ACCOUNT: "a04b9fd2-ab8f-473c-a080-78857520336b",
  JURISDICTION: "cook:cvd1",
  STATE: "il",
  CASE_CATEGORY: "7",
  DOC_TYPE: "189705",
  FILING_CODES: {
    COMPLAINT: {
      RESIDENTIAL_JOINT: "174403",
      COMMERCIAL_JOINT: "174400",
      RESIDENTIAL_POSSESSION: "174402",
      COMMERCIAL_POSSESSION: "174399"
    },
    SUMMONS: "189495",
    AFFIDAVIT: "189259"
  }
};
```

#### d. Error Handling
- Catch and log specific Tyler API errors
- Show user-friendly messages for common errors:
  - Invalid attorney ID
  - Missing payment account
  - Invalid case type
  - File upload failures
- Log full error responses for debugging

#### e. Module System
- Standardize on ES modules throughout
- Update all scripts to use `import` instead of `require`
- Ensure `package.json` has `"type": "module"`

### 4. Testing Requirements
- Create test payload that exactly matches the sample above
- Verify payload passes Tyler API validation
- Test all case type variations
- Ensure cross_references are correctly included/excluded

### 5. Deliverables
1. Refactored `EFileSubmissionForm.tsx` with simplified payload building
2. Centralized Tyler API configuration file
3. Updated transform script with proper ES modules
4. Comprehensive error handling throughout
5. Test results showing successful submission

## Success Criteria
- No more "Invalid DocumentOptionalService code" errors
- All e-filing submissions succeed with proper payload structure
- Configuration is centralized and easy to update
- Error messages clearly indicate what went wrong
- Code is consistent and maintainable

## Additional Context
Recent commits addressing this issue:
- `78b89622`: Fixed cross-reference to use attorney number 44113
- `20c83f48`: Removed optional_services to fix Tyler API error
- `6bd09e07`: Created transformation script for mock payloads

Please perform a comprehensive refactor that addresses all these issues and produces reliable e-filing submissions.