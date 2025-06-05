# PR #67 Review Comment

## Testing Results Summary

I've tested PR #67 and found several issues that need to be addressed before merging:

### ✅ What Works:
- Build and TypeScript checks pass
- Tyler configuration is properly centralized
- Optional services correctly removed
- All 3 documents are marked as required

### ❌ Issues Found:

**1. Affidavit Validation is Too Restrictive**
- Currently requires affidavit for ALL case types
- Should only be required for Joint Action cases (237037, 237042, 201996, 201995)
- Possession cases don't need affidavits per court rules

**2. Cross-Reference Logic Prevents User Override**
- Joint Actions ALWAYS use "44113", ignoring user input
- Users should be able to override the default cross-reference
- Current logic checks Joint Action first, then user input (should be reversed)

**3. Hard-Coded Values**
- Phone numbers and emails are hard-coded instead of using form data
- Only processes first summons file (form allows multiple)

## Required Changes:

### 1. Fix Affidavit Validation:
```typescript
const isJointAction = ['237037', '237042', '201996', '201995'].includes(formData.caseType);

// Only require affidavit for Joint Action cases
if (isJointAction && !formData.affidavitFile) {
  newErrors.affidavitFile = 'Please upload the affidavit for Joint Action cases';
  isValid = false;
}
```

### 2. Fix Cross-Reference Priority:
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

### 3. Use Form Data for Contact Info:
```typescript
// Instead of hard-coding:
phone_number: formData.petitioner?.phoneNumber || '',
email: formData.petitioner?.email || ''
```

## Recommendation:
Please address these issues before merging. The centralized config is great, but the validation logic needs to be more flexible to handle different case types properly.