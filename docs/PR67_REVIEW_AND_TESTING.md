# PR #67 Review and Testing Checklist

## Review Summary

### ✅ Positive Changes
1. **Centralized Configuration**: Created `src/config/tyler-api.ts` with all Tyler constants
2. **Removed optional_services**: Correctly removed from type definitions
3. **Required All 3 Documents**: Made summons and affidavit required (was optional)
4. **Better Error Handling**: Added `SubmissionError` class and `mapMessageCode`
5. **Uses Config Throughout**: All hardcoded values replaced with `TYLER_CONFIG.*`

### ⚠️ Conflicts with Recent Fixes

**Cross-Reference Logic Conflict**:
- **Our Current Logic**: User input takes priority, fallback to 44113 for Joint Actions
- **PR #67 Logic**: Joint Actions ALWAYS use 44113, ignoring user input
- **Impact**: Users cannot override cross-references for Joint Actions

The PR needs to be updated to preserve user input priority:
```typescript
// Correct logic (preserve user input priority)
if (formData.crossReferenceNumber?.trim() && 
    formData.crossReferenceType?.trim()) {
  const userNumber = formData.crossReferenceNumber.trim();
  if (/^\d{3,20}$/.test(userNumber)) {
    crossRefNumber = userNumber;
    crossRefCode = formData.crossReferenceType.trim();
  }
}

// Fallback only if no user input
if (!crossRefNumber && jointActionTypes.includes(payload.case_type)) {
  crossRefNumber = TYLER_CONFIG.ATTORNEY_CROSS_REF; // "44113"
  crossRefCode = TYLER_CONFIG.CROSS_REF_CODE; // "190860"
}
```

## Testing Checklist

### 1. Joint Action Flow Test
**Setup**: 
- Case Type: "Residential Joint Action – Non-Jury" (237037)
- Upload: Complaint, Summons, Affidavit PDFs

**Verify in DevTools → Network**:
- [ ] Payload includes `cross_references: [{"number":"44113","code":"190860"}]`
- [ ] All 3 filings present with codes: 174403, 189495, 189259
- [ ] Each file starts with `"base64://"`
- [ ] No `optional_services` field present

### 2. Joint Action with User Cross-Reference
**Setup**:
- Same as above but enter custom cross-reference (e.g., "12345" with type "190861")

**Verify**:
- [ ] Cross-reference uses USER INPUT, not 44113
- [ ] `cross_references: [{"number":"12345","code":"190861"}]`

### 3. Possession Flow Test
**Setup**:
- Case Type: "Residential Possession – Non-Jury" (237036)
- Upload all 3 documents

**Verify**:
- [ ] NO `cross_references` field in payload
- [ ] Filing code is 174402 (not 174403)
- [ ] No `optional_services` field

### 4. Case Party Validation
**Test Missing Fields**:
- [ ] Leave phone_number blank → Form should prevent submission
- [ ] Leave email blank → Form should prevent submission
- [ ] Leave address fields blank → Form should prevent submission
- [ ] Verify all parties have required fields in payload

### 5. Document Validation
**Test Required Documents**:
- [ ] Submit without complaint → Error: "Please upload the eviction complaint"
- [ ] Submit without summons → Error: "Please upload a summons"
- [ ] Submit without affidavit → Error: "Please upload the affidavit"

### 6. Build & Module System Check
```bash
# Run these commands
npm run build      # Should complete without errors
npm run lint       # No "require is not defined" errors
npm run test       # All tests pass
npm run typecheck  # No type errors
```

### 7. Error Handling Test
**Simulate API Error**:
- [ ] Submit with invalid attorney ID
- [ ] Verify user-friendly error message appears
- [ ] Check console for detailed error logging

## Recommended Actions

1. **Fix Cross-Reference Logic**: Update PR to preserve user input priority
2. **Test All Scenarios**: Complete the checklist above before merging
3. **Add Unit Tests**: Create tests for the cross-reference logic
4. **Update Documentation**: Document the Tyler config structure

## Final Payload Structure to Verify

```json
{
  "data": {
    "reference_id": "DRAFT-xxxxx",
    "jurisdiction": "cook:cvd1",
    "case_category": "7",
    "case_type": "237037",
    "state": "il",
    "filing_type": "EFile",
    "filing_attorney_id": "81d6ab59-3c7b-4e2c-8ed6-da4148d6353c",
    "filing_party_id": "Party_xxxxx",
    "payment_account_id": "a04b9fd2-ab8f-473c-a080-78857520336b",
    "case_parties": [...],
    "cross_references": [{"number": "44113", "code": "190860"}],
    "filings": [
      {
        "code": "174403",
        "description": "Complaint / Petition - Eviction - Residential - Joint Action",
        "file": "base64://...",
        "file_name": "complaint.pdf",
        "doc_type": "189705"
      },
      {
        "code": "189495",
        "description": "Summons - Issued And Returnable",
        "file": "base64://...",
        "file_name": "summons.pdf",
        "doc_type": "189705"
      },
      {
        "code": "189259",
        "description": "Affidavit Filed",
        "file": "base64://...",
        "file_name": "affidavit.pdf",
        "doc_type": "189705"
      }
    ]
  }
}
```