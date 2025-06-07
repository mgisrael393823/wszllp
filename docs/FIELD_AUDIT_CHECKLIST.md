# E-Filing Field Audit Checklist

## Core Fields (Always Required)

| Field | Tyler Example | Our Implementation | Status |
|-------|--------------|-------------------|---------|
| reference_id | ✓ | ✓ | ✅ Present |
| jurisdiction | ✓ | ✓ | ✅ Present |
| case_category | ✓ | ✓ | ✅ Present |
| case_type | ✓ | ✓ | ✅ Present |
| filing_type | ✓ | ✓ | ✅ Present |
| payment_account_id | ✓ | ✓ | ✅ Present |
| filing_attorney_id | ✓ | ✓ | ✅ Present |
| filing_party_id | ✓ | ✓ | ✅ Present |

## Conditional Fields

| Field | Tyler Example | Our Implementation | Status | Notes |
|-------|--------------|-------------------|---------|--------|
| amount_in_controversy | ✓ | ⚠️ Conditional | ⚠️ ISSUE | Only included if ENHANCED_EFILING_PHASE_A=true AND amount is provided |
| show_amount_in_controversy | ✓ | ⚠️ Conditional | ⚠️ ISSUE | Same conditions as above |
| cross_references | ✓ | ✓ Optional | ✅ OK | Now optional as requested |
| is_initial_filing | Not shown | ✓ | ✅ Extra | We add this for clarity |

## Party Fields

| Field | Tyler Example | Our Implementation | Status |
|-------|--------------|-------------------|---------|
| Party: id | ✓ | ✓ | ✅ Present |
| Party: type | ✓ | ✓ | ✅ Present |
| Party: business_name | ✓ | ✓ | ✅ Present |
| Party: first_name | ✓ | ✓ | ✅ Present |
| Party: last_name | ✓ | ✓ | ✅ Present |
| Party: is_business | ✓ | ✓ | ✅ Present |
| Party: address_line_1 | ✓ | ✓ | ✅ Present |
| Party: address_line_2 | ✓ | ✓ | ✅ Present |
| Party: city | ✓ | ✓ | ✅ Present |
| Party: state | ✓ | ✓ | ✅ Present |
| Party: zip_code | ✓ | ✓ | ✅ Present |
| Party: lead_attorney | ✓ | ✓ | ✅ Present |

## Filing Fields

| Field | Tyler Example | Our Implementation | Status |
|-------|--------------|-------------------|---------|
| Filing: code | ✓ | ✓ | ✅ Present |
| Filing: description | ✓ | ✓ | ✅ Present |
| Filing: file | ✓ | ✓ | ✅ Present |
| Filing: file_name | ✓ | ✓ | ✅ Present |
| Filing: doc_type | ✓ | ✓ | ✅ Present |
| Filing: optional_services | ✓ | ✓ | ✅ Present |

## Critical Issues Found

### 1. ⚠️ Amount in Controversy Fields
**Problem**: These fields are conditionally included based on:
- `ENHANCED_EFILING_PHASE_A` feature flag
- Having a value in `formData.amountInControversy`

**Tyler's Example**: Always includes these fields
**Impact**: If feature flag is off or field is empty, these won't be sent

### 2. ⚠️ Amount in Controversy UI
**Problem**: The UI only shows these fields for specific case types:
- '174140'
- '174141' 
- '174143'

**Tyler's Example**: Shows for case type '237037'
**Impact**: Users filing case type '237037' won't see these fields

## Recommendations

1. **Remove conditional inclusion** of amount_in_controversy fields:
   ```javascript
   // Current (problematic):
   ...(ENHANCED_EFILING_PHASE_A && formData.amountInControversy && {
     amount_in_controversy: formData.amountInControversy,
     show_amount_in_controversy: formData.showAmountInControversy ? 'true' : 'false'
   }),

   // Should be:
   amount_in_controversy: formData.amountInControversy || '',
   show_amount_in_controversy: formData.showAmountInControversy ? 'true' : 'false',
   ```

2. **Show amount fields for all case types** or at least include '237037'

3. **Ensure ENHANCED_EFILING_PHASE_A is enabled** in production