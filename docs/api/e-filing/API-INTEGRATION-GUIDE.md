# Illinois E-Filing API Integration Guide

This document provides a structured guide for integrating with the Illinois e-filing system based on the provided API documentation.

## Authentication

**Endpoint:** `https://api.uslegalpro.com/v4/il/user/authenticate`  
**Method:** POST  
**Header:** `clienttoken=RANSTAG`

### Request

```json
{
    "data": {
        "username": "your_tyler_email@example.com",
        "password": "your_tyler_password"
    }
}
```

### Response

```json
{
    "message_code": 0,
    "item": {
        "auth_token": "67e125cc-e0de-4c54-a02e-f4b6643e5d4a/RANSTAG/8b762083-eb79-4ba0-a509-9001a16ffe3e"
    }
}
```

## E-Filing Submission

**Endpoint:** `https://api.uslegalpro.com/v4/il/efile`  
**Method:** POST  
**Header:** `authtoken=[auth_token from authentication]`

### Request Structure

The e-filing request is a JSON payload with the following key components:

1. **Case Metadata**:
   - `reference_id`: Your internal reference ID
   - `jurisdiction`: Court jurisdiction (e.g., "cook:cvd1")
   - `case_category`: Category code (e.g., "7")
   - `case_type`: Type of case

2. **Case Parties**:
   - Each party has an ID, type, and personal information
   - For businesses: Include `business_name` and set `is_business` to "true"
   - For individuals: Include first/last name and address information

3. **Filings**:
   - Each filing has a `code`, `description`, `file` (base64 encoded), `file_name`, and `doc_type`
   - For evictions, include:
     - Complaint/Petition
     - Summons
     - Affidavit

4. **Payment Information**:
   - `payment_account_id`: ID from your Tyler payment account
   - `filing_attorney_id`: ID of the attorney filing
 - `filing_party_id`: ID of the filing party (typically petitioner)

## Request Payload
```
  "county": string,            // e.g. "cook" (Phase A)
  "jurisdictionCode": string,  // e.g. "cook:cvd1" (Phase B – Chicago District 1)
```

## Phase B Enhancement
When ENHANCED_EFILING_PHASE_B is enabled, use Tyler jurisdiction codes:
- cook:cvd1 = Cook County – Municipal Civil – District 1 (Chicago)
- fetch full list via GET /il/jurisdictions

### Sample Filing Request

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
                "lead_attorney": "${lead_attorney}"
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
            }
            // Additional parties...
        ],
        "filings": [
            {
                "code": "${filing_code}",
                "description": "Complaint / Petition - Eviction - Residential - Joint Action",
                "file": "base64://file",
                "file_name": "${petition_file_name}",
                "doc_type": "189705",
                "optional_services": [{
                    "quantity": "${count}",
                    "code": "282616"
                }]
            },
            {
                "code": "189495",
                "description": "Summons - Issued And Returnable",
                "file": "base64://file",
                "file_name": "${certificate_file_name}",
                "doc_type": "189705"
            },
            {
                "code": "189259",
                "description": "Affidavit Filed",
                "file": "base64://file",
                "file_name": "${affidavit_file_name}",
                "doc_type": "189705"
            }
        ],
        "filing_type": "EFile",
        "payment_account_id": "${payment_account_id}",
        "filing_attorney_id": "${filing_attorney_id}",
        "filing_party_id": "Party_25694092",
        "amount_in_controversy": "${amount_in_controversy}",
        "show_amount_in_controversy": "${enable_amount_in_controversy}",
        "cross_references": [
            {
                "number": "45602",
                "code": "190860"
            }
        ]
    }
}
```

### Response

```json
{
    "message_code": 0,
    "item": {
        "filings": [
            {
                "code": "174403",
                "id": "b91126d1-e561-4388-89ec-8e558d1b8fd8",
                "status": "submitting"
            }
        ],
        "id": "302358",
        "case_tracking_id": "tyler_cook:cvd1~206af2f0-2d52-48e6-95cc-b7e194f7a38e"
    }
}
```

## Check Filing Status

**Endpoint:** `https://api.uslegalpro.com/v4/il/envelope/{envelope_id}?fields=client_matter_number,jurisdiction,case_number,case_tracking_id,case_category,case_type,filings(file,status,stamped_document,reviewer_comment,status_reason)`  
**Method:** GET  
**Header:** `authtoken=[auth_token from authentication]`

### Parameters
- `envelope_id`: The ID returned from the e-filing submission (e.g., "302358")
- `fields`: Comma-separated list of fields to retrieve

### Response

```json
{
    "message_code": 0,
    "item": {
        "jurisdiction": "cook:cvd1",
        "case_category": "174140",
        "case_type": "184140",
        "case_number": "IL-Case-1",
        "case_tracking_id": "206af2f0-2d52-48e6-95cc-b7e194f7a38e",
        "client_matter_number": "",
        "filings": [
            {
                "file": "file.pdf",
                "status": "submitted",
                "stamped_document": "",
                "reviewer_comment": "",
                "status_reason": ""
            }
        ]
    }
}
```

## Reference APIs

### Get Payment Accounts

**Endpoint:** `https://api.uslegalpro.com/v4/il/payment_accounts`  
**Method:** GET  
**Header:** `authtoken=[auth_token from authentication]`

### Response

```json
{
    "message_code": 0,
    "items": [
        {
            "id": "a04b9fd2-ab8f-473c-a080-78857520336b",
            "name": "CC",
            "type_code": "CC",
            "card_type": "MASTERCARD",
            "firm_id": "5f41beaa-13d4-4328-b87b-5d7d852f9491",
            "is_active": "true",
            "last4_digit": "5454",
            "expire_month": "12",
            "expire_year": "2035",
            "is_expired": "false",
            "account_type_code_id": "-135"
        }
    ],
    "count": 1
}
```

### Get Firm Attorneys

**Endpoint:** `https://api.uslegalpro.com/v4/il/firm/attorneys`  
**Method:** GET  
**Header:** `authtoken=[auth_token from authentication]`

### Response

```json
{
    "message_code": 0,
    "items": [
        {
            "id": "448c583f-aaf7-43d2-8053-2b49c810b66f",
            "firm_id": "5f41beaa-13d4-4328-b87b-5d7d852f9491",
            "bar_number": "1111111",
            "first_name": "Sam",
            "middle_name": "",
            "last_name": "Smith",
            "display_name": "Sam  Smith - 1111111"
        }
    ],
    "count": 1
}
```

## Integration Implementation Notes

1. **Authentication Flow**:
   - Store the client token securely
   - Authenticate at the beginning of a session to obtain an auth token
   - Include the auth token in subsequent API calls

2. **Document Preparation**:
   - Documents must be base64 encoded for submission
   - Required documents for eviction filings include:
     - Complaint/Petition
     - Summons
     - Affidavit

3. **Party Information**:
   - The provided example includes multiple defendants (up to 4 named defendants plus "All Unknown Occupants")
   - The petitioner (landlord) is typically a business entity
   - Each party has a unique ID format: "Party_XXXXXXXX"

4. **Variables Replacement**:
   - The sample JSON contains many placeholders in the format `${variable_name}`
   - These must be replaced with actual values from your system before submission

5. **Status Checking**:
   - Use the envelope ID from the submission response to check filing status
   - Status values include: "submitting", "submitted", etc.

## Security Considerations

1. **Credential Management**:
   - Do not hard-code credentials in the application
   - Use secure credential storage
   - Consider implementing credential rotation

2. **Data Validation**:
   - Validate all input data before submission
   - Implement proper error handling for API responses

3. **Access Control**:
   - Implement appropriate access controls for e-filing functionality
   - Log all e-filing activities for audit purposes

## Implementation Checklist

- [ ] Set up secure credential storage
- [ ] Implement authentication flow
- [ ] Create data mapping between WSZLLP case data and API payload format
- [ ] Develop document preparation and base64 encoding
- [ ] Implement e-filing submission process
- [ ] Develop status checking and notification system
- [ ] Create error handling and recovery mechanisms
- [ ] Test with sample filings in the staging environment
- [ ] Implement audit logging for all filing activities