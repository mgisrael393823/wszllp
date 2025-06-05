# PR #67 Test Results

## Test Summary

### ✅ Passed Tests

1. **Build & Module System**
   - `npm run build` - ✅ Success (no module errors)
   - `npm run typecheck` - ✅ Success (no type errors)
   - No "require is not defined" or ES module errors

2. **Tyler Configuration**
   - ✅ Config file exists at `src/config/tyler-api.ts`
   - ✅ Contains correct attorney number "44113"
   - ✅ Contains all required constants (filing codes, jurisdiction, etc.)

3. **Document Validation** 
   - ✅ Complaint is required for all case types
   - ✅ Summons is required for all case types
   - ❌ Affidavit is incorrectly required for ALL case types
   - ❌ Should only be required for Joint Action cases

4. **Removed Optional Services**
   - ✅ `optional_services` removed from type definitions
   - ✅ No optional services in the payload generation

### ❌ Failed Tests

1. **Affidavit Validation Logic**
   - ❌ Affidavit is required for ALL case types
   - ❌ Should only be required for Joint Action cases (237037, 237042, 201996, 201995)
   - ❌ Possession cases (237036, 237041, 201991, 201992) should NOT require affidavit
   
   **Current Logic (INCORRECT):**
   ```typescript
   if (!formData.affidavitFile) {
     newErrors.affidavitFile = 'Please upload the affidavit';
     isValid = false;
   }
   ```
   
   **Should Be:**
   ```typescript
   const isJointAction = ['237037', '237042', '201996', '201995'].includes(formData.caseType);
   
   // Only require affidavit for Joint Action cases
   if (isJointAction && !formData.affidavitFile) {
     newErrors.affidavitFile = 'Please upload the affidavit';
     isValid = false;
   }
   ```

2. **Cross-Reference Logic**
   - ❌ Joint Actions ALWAYS use 44113, ignoring user input
   - ❌ User cannot override cross-references for Joint Actions
   
   **Current Logic (INCORRECT):**
   ```typescript
   // Always include cross reference for joint action cases
   if (jointActionTypes.includes(payload.case_type)) {
     crossRefNumber = TYLER_CONFIG.ATTORNEY_CROSS_REF;
     crossRefCode = TYLER_CONFIG.CROSS_REF_CODE;
   } else if (user_has_input) {
     // User input only for non-joint actions
   }
   ```
   
   **Should Be:**
   ```typescript
   // Check user input FIRST
   if (formData.crossReferenceNumber?.trim() && 
       formData.crossReferenceType?.trim() &&
       /^\d{3,20}$/.test(formData.crossReferenceNumber.trim())) {
     crossRefNumber = formData.crossReferenceNumber.trim();
     crossRefCode = formData.crossReferenceType.trim();
   }
   // THEN fallback to 44113 for joint actions
   else if (jointActionTypes.includes(payload.case_type)) {
     crossRefNumber = TYLER_CONFIG.ATTORNEY_CROSS_REF;
     crossRefCode = TYLER_CONFIG.CROSS_REF_CODE;
   }
   ```

### ⚠️ Not Tested (Requires UI)

1. **Form Submission Tests**
   - Joint Action flow with auto cross-reference
   - Possession flow without cross-reference
   - Case party field validation
   - API error handling

## Recommendation

**DO NOT MERGE** until these issues are fixed:
1. Affidavit validation should only apply to Joint Action cases
2. Cross-reference logic should allow user overrides
3. Remove hard-coded phone/email values

## Code Changes Needed

### 1. Fix Affidavit Validation (lines 834-837)

Replace:
```typescript
if (!formData.affidavitFile) {
  newErrors.affidavitFile = 'Please upload the affidavit';
  isValid = false;
}
```

With:
```typescript
const isJointAction = ['237037', '237042', '201996', '201995'].includes(formData.caseType);

// Only require affidavit for Joint Action cases
if (isJointAction && !formData.affidavitFile) {
  newErrors.affidavitFile = 'Please upload the affidavit for Joint Action cases';
  isValid = false;
}
```

### 2. Fix Cross-Reference Logic (lines 1138-1149)

Replace:
```typescript
// Always include cross reference for joint action cases
if (jointActionTypes.includes(payload.case_type)) {
  crossRefNumber = TYLER_CONFIG.ATTORNEY_CROSS_REF;
  crossRefCode = TYLER_CONFIG.CROSS_REF_CODE;
} else if (
  formData.crossReferenceNumber?.trim() &&
  formData.crossReferenceType?.trim() &&
  /^\d{3,20}$/.test(formData.crossReferenceNumber.trim())
) {
  crossRefNumber = formData.crossReferenceNumber.trim();
  crossRefCode = formData.crossReferenceType.trim();
}
```

With:
```typescript
// User input takes priority
if (formData.crossReferenceNumber?.trim() && 
    formData.crossReferenceType?.trim() &&
    /^\d{3,20}$/.test(formData.crossReferenceNumber.trim())) {
  crossRefNumber = formData.crossReferenceNumber.trim();
  crossRefCode = formData.crossReferenceType.trim();
}
// Fallback to 44113 for joint actions if no user input
else if (jointActionTypes.includes(payload.case_type)) {
  crossRefNumber = TYLER_CONFIG.ATTORNEY_CROSS_REF;
  crossRefCode = TYLER_CONFIG.CROSS_REF_CODE;
}
```

## Additional Observations

1. **Hard-coded Phone/Email**: The PR adds hard-coded phone numbers and emails to case parties (lines 1074-1075, 1090-1091). This should use form data instead.

2. **Single Summons**: The code only processes the first summons file (line 1031), but the form allows multiple summons uploads.

3. **Jurisdiction Override**: The PR always uses `TYLER_CONFIG.JURISDICTION` instead of respecting the form's jurisdiction selection.