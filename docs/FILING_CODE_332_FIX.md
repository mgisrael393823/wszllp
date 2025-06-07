# Filing Code 332 Error Fix

## Problem
The Tyler API was returning: "Unknown filing component codes '332' are not allowed"

## Investigation
- Code "332" was not found in any source files
- All filing codes in the code appeared to be valid
- The issue was that filing codes were hardcoded instead of using the centralized Tyler config

## Solution

### 1. Updated all filing codes to use TYLER_CONFIG
```typescript
// Before (hardcoded):
filingCode = '174403';

// After (from config):
filingCode = TYLER_CONFIG.FILING_CODES.COMPLAINT.RESIDENTIAL_JOINT;
```

### 2. All filing codes now use centralized configuration:
- Complaint codes: Use appropriate TYLER_CONFIG.FILING_CODES.COMPLAINT.*
- Summons: TYLER_CONFIG.FILING_CODES.SUMMONS
- Affidavit: TYLER_CONFIG.FILING_CODES.AFFIDAVIT
- Doc type: TYLER_CONFIG.DOC_TYPE

### 3. Added debug logging
```typescript
console.log('Filing codes being sent:');
payload.filings.forEach((filing: any, index: number) => {
  console.log(`Filing ${index + 1}: code="${filing.code}", description="${filing.description}"`);
});
```

## Valid Tyler Filing Codes
- **174403** - Complaint / Petition - Eviction - Residential - Joint Action
- **174400** - Complaint / Petition - Eviction - Commercial - Joint Action  
- **174402** - Complaint / Petition - Eviction - Residential - Possession
- **174399** - Complaint / Petition - Eviction - Commercial - Possession
- **189495** - Summons - Issued And Returnable
- **189259** - Affidavit Filed
- **189705** - Document Type (for all documents)

## Debugging Tips
If you still see "332" errors:

1. **Check Browser DevTools**
   - Network tab → Find the POST to /v4/il/efile
   - Look at Request Payload → filings array
   - Check if any filing has code: "332"

2. **Clear Old Data**
   - Clear localStorage (may have old drafts)
   - Clear browser cache
   - Log out and log back in

3. **Check Console Logs**
   - Look for "Filing codes being sent:"
   - Verify all codes match the valid list above

4. **Verify Payload**
   - The filings array should only contain valid codes
   - No filing should have code "332"

## Prevention
- All filing codes now come from centralized Tyler config
- No more hardcoded filing codes in the submission logic
- Easier to maintain and update if Tyler changes codes