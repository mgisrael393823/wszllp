# E-Filing Deployment Notes

## Recent Changes (PR #68 - Merged)

### Summary
Enhanced e-filing integration with Tyler API has been successfully merged to main branch.

### Key Changes
1. **Tyler Configuration** - Centralized in `/src/config/tyler-api.ts`
2. **Validation Fixes** - Affidavit only required for Joint Action cases
3. **Cross-Reference Logic** - User input takes priority, "44113" as fallback
4. **Contact Info** - Removed hard-coded phone/email values
5. **Multiple Summons** - Now supports processing all uploaded summons files

### Testing Checklist
Before using in production, verify:
- [ ] Joint Action cases (237037, 237042, 201996, 201995) show "44113" in cross-reference
- [ ] Users can override the cross-reference number
- [ ] Possession cases (237036, 237041, 201991, 201992) don't require affidavit
- [ ] Multiple summons files can be uploaded and are all processed
- [ ] No validation errors for missing affidavit on Possession cases

### Configuration Reference
```typescript
TYLER_CONFIG = {
  ATTORNEY_CROSS_REF: "44113",        // Default for Joint Actions
  CROSS_REF_CODE: "190860",           // Case Number type
  JURISDICTION: "cook:cvd1",          // Cook County
  // ... other config values
}
```

### Troubleshooting
If you encounter issues:
1. Check that Tyler config is properly imported
2. Verify case type codes match expected values
3. Ensure cross-reference validation allows 3-20 digit numbers
4. Check browser console for detailed error messages

### Rollback Plan
If issues arise, the previous version can be restored:
```bash
git revert fab17fc4
```

### Monitoring
Watch for:
- Tyler API rejection rates
- Cross-reference validation errors
- Document upload failures
- User feedback on affidavit requirements