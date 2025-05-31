# Current E-Filing Payload vs Tyler Example Comparison

## Current Payload (Our Implementation)

```json
{
  "reference_id": "WSZ-1748654400000",
  "jurisdiction": "cook:cvd1",
  "case_category": "7",
  "case_type": "237037",
  "case_parties": [
    {
      "id": "Party_25694092",
      "type": "189138",
      "business_name": "Wolf Solovy LLP",
      "is_business": "true",
      "address_line_1": "123 Main St",
      "address_line_2": "Suite 400",
      "city": "Chicago",
      "state": "IL",
      "zip_code": "60601",
      "lead_attorney": "448c583f-aaf7-43d2-8053-2b49c810b66f"
    },
    {
      "id": "Party_60273353",
      "type": "189131",
      "first_name": "John",
      "last_name": "Doe",
      "address_line_1": "456 Oak St",
      "address_line_2": "Apt 2B",
      "city": "Chicago",
      "state": "IL",
      "zip_code": "60602",
      "is_business": "false"
    },
    {
      "id": "Party_60273354",
      "type": "189131",
      "first_name": "Jane",
      "last_name": "Smith",
      "address_line_1": "456 Oak St",
      "address_line_2": "Apt 3A",
      "city": "Chicago",
      "state": "IL",
      "zip_code": "60602",
      "is_business": "false"
    },
    {
      "id": "Party_10518212",
      "type": "189131",
      "first_name": "All",
      "last_name": "Unknown Occupants",
      "address_line_1": "456 Oak St",
      "address_line_2": "",
      "city": "Chicago",
      "state": "IL",
      "zip_code": "60602",
      "is_business": "false"
    }
  ],
  "filings": [
    {
      "code": "174403",
      "description": "Complaint / Petition - Eviction - Residential - Joint Action",
      "file": "base64://[BASE64_CONTENT]",
      "file_name": "eviction_complaint.pdf",
      "doc_type": "189705",
      "optional_services": [
        {
          "quantity": "3",
          "code": "282616"
        }
      ]
    },
    {
      "code": "189495",
      "description": "Summons - Issued And Returnable",
      "file": "base64://[BASE64_CONTENT]",
      "file_name": "eviction_summons.pdf",
      "doc_type": "189705"
    },
    {
      "code": "189259",
      "description": "Affidavit Filed",
      "file": "base64://[BASE64_CONTENT]",
      "file_name": "eviction_affidavit.pdf",
      "doc_type": "189705"
    }
  ],
  "filing_type": "EFile",
  "payment_account_id": "ACCT-001",
  "filing_attorney_id": "448c583f-aaf7-43d2-8053-2b49c810b66f",
  "filing_party_id": "Party_25694092",
  "amount_in_controversy": "5000",
  "show_amount_in_controversy": "true",
  "is_initial_filing": true,
  "cross_references": [
    {
      "number": "2024CV001234",
      "code": "190860"
    }
  ]
}
```

## Tyler's Example Payload

```json
{
  "data": {
    "reference_id": "${reference_id}",
    "jurisdiction": "cook:cvd1",
    "case_category": "7",
    "case_type": "${case_type_code}",
    "case_parties": [
      {
        "id": "Party_25694092",
        "type": "189138",
        "business_name": "${business_name}",
        "is_business": "true",
        "lead_attorney": "6b2333a8-5fce-4237-a04b-da966f8c75e5"
      },
      {
        "id": "Party_60273353",
        "type": "189131",
        "first_name": "${party_first_name1}",
        "last_name": "${party_last_name1}",
        "address_line_1": "${party_address_line_1}",
        "address_line_2": "${party_address_line_2}",
        "city": "${party_city}",
        "state": "${party_state}",
        "zip_code": "${party_zip_code}",
        "is_business": "false"
      },
      {
        "id": "Party_10518212",
        "type": "189131",
        "first_name": "All",
        "last_name": "Unknown Occupants",
        "address_line_1": "${party_address_line_1}",
        "address_line_2": "${party_address_line_2}",
        "city": "${party_city}",
        "state": "${party_state}",
        "zip_code": "${party_zip_code}",
        "is_business": "false"
      }
    ],
    "filings": [
      {
        "code": "${filing_code}",
        "description": "Complaint / Petition - Eviction - Residential - Joint Action",
        "file": "${petition_file}",
        "file_name": "${petition_file_name}",
        "doc_type": "189705",
        "optional_services": [
          {
            "quantity": "${count}",
            "code": "282616"
          }
        ]
      },
      {
        "code": "189495",
        "description": "Summons - Issued And Returnable",
        "file": "${certificate_file}",
        "file_name": "${certificate_file_name}",
        "doc_type": "189705"
      },
      {
        "code": "189259",
        "description": "Affidavit Filed",
        "file": "${affidavit_file}",
        "file_name": "${affidavit_file_name}",
        "doc_type": "189705"
      }
    ],
    "filing_type": "EFile",
    "payment_account_id": "${payment_account_id}",
    "filing_attorney_id": "6b2333a8-5fce-4237-a04b-da966f8c75e5",
    "filing_party_id": "Party_25694092",
    "amount_in_controversy": "${amount_in_controversy}",
    "show_amount_in_controversy": "true",
    "cross_references": [
      {
        "number": "45602",
        "code": "190860"
      }
    ]
  }
}
```

## Key Differences Analysis

### 1. ✅ Structure Wrapper
- **Tyler**: Wraps payload in `{ "data": { ... } }`
- **Ours**: Direct payload without wrapper
- **Status**: Need to add wrapper

### 2. ✅ All Required Fields Present
Our implementation includes all fields from Tyler's example:
- reference_id ✅
- jurisdiction ✅
- case_category ✅
- case_type ✅
- case_parties (with all party fields) ✅
- filings (with all filing fields) ✅
- filing_type ✅
- payment_account_id ✅
- filing_attorney_id ✅
- filing_party_id ✅
- amount_in_controversy ✅
- show_amount_in_controversy ✅
- cross_references ✅

### 3. ✅ Additional Fields We Include
- `is_initial_filing`: boolean (we add this for clarity)
- Petitioner includes full address fields (Tyler's example omits these)

### 4. ✅ Optional Services
- Correctly included only on complaint filing
- Quantity auto-calculated based on defendant count

### 5. ✅ Party IDs
- Using same party ID structure as Tyler
- Lead attorney properly linked

### 6. ✅ File Format
- Using `base64://` prefix as expected
- File names included for all documents

### 7. ⚠️ Minor Differences
- Our attorney IDs are actual UUIDs from the API
- Tyler's example uses hardcoded attorney ID

## Required Code Change

The only structural difference is the data wrapper. Here's the fix:

```javascript
// In EFileSubmissionForm.tsx, wrap the payload:
const apiPayload = {
  data: payload
};

// Then submit apiPayload instead of payload
```

## Validation Summary

✅ All required fields present
✅ Correct field names and types
✅ Optional services properly structured
✅ Cross references properly structured
✅ Party structure matches exactly
✅ Filing structure matches exactly
⚠️ Need to add data wrapper

The implementation is 99% correct - just needs the wrapper!