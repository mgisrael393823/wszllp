# Enhanced E-Filing Implementation Plan

## Current Issues
**Missing Critical API Parameters** identified by audit against Tyler API docs:
- `payment_account_id` - hardcoded as "demo" 
- `case_parties` array - completely missing petitioner/defendant data
- `amount_in_controversy` - missing for required case types
- `filing_type` - missing "EFile" parameter

## 3-Phase MVP Strategy

### **Phase A: Blocker Fix (Days 1-4)**
*Get production-ready with essential missing fields*

**Tasks:**
- [ ] Payment account selection API + graceful fallback
- [ ] Basic party capture (petitioner + 1 defendant)
- [ ] Client-side validation + error states
- [ ] Accessibility compliance (labels, ARIA, focus)
- [ ] Backend API updates for new payload

**Success:** Real e-filing with valid payment account + party data

### **Phase B: Full Feature Parity (Days 5-8)**  
*Complete Tyler API compatibility*

**Tasks:**
- [ ] Amount in controversy + case-type validation
- [ ] Multi-party support (add/remove defendants)
- [ ] React Hook Form integration
- [ ] Enhanced validation (zip codes, addresses)

**Success:** Complex cases with multiple parties + financial data

### **Phase C: Polish (Days 9-12)**
*Document intelligence + UX improvements*

**Tasks:**
- [ ] Document type detection/mapping
- [ ] File preview + bulk operations  
- [ ] Performance optimization

## Implementation Details

### Payment Accounts Hook
```typescript
const usePaymentAccounts = () => {
  // Fetch from /api/tyler/payment-accounts
  // Fallback to demo account on failure
  // Show dismissible warning for API failures
};
```

### Form Schema (React Hook Form + Zod)
```typescript
const schema = z.object({
  paymentAccountId: z.string().refine(val => val !== 'demo'),
  petitioner: z.object({
    type: z.enum(['business', 'individual']),
    businessName: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  }),
  defendants: z.array(z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    addressLine1: z.string().min(1),
    city: z.string().min(1),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
  })).min(1),
  amountInControversy: z.string().optional(),
});
```

### Backend Updates
```typescript
// api/cases.js - new payload signature
{
  paymentAccountId, petitioner, defendants, 
  amountInControversy, showAmountInControversy
}

// New DB migration for enhanced fields
ALTER TABLE cases ADD COLUMN payment_account_id TEXT;
ALTER TABLE cases ADD COLUMN amount_in_controversy DECIMAL(10,2);
CREATE TABLE case_parties (...);
```

### Centralized Config
```typescript
// /api/config/jurisdictions - avoid hardcoded mappings
// 5min cache, fallback to static config
```

### Feature Flags
```typescript
// Auto-enable in staging, disabled by default in production
ENHANCED_EFILING: isStaging || process.env.FEATURE_ENHANCED_EFILING === 'true'
```

## Testing Strategy
- [ ] Unit tests for payment accounts hook + validation
- [ ] Cypress tests for full party workflow
- [ ] API tests for enhanced payload structure
- [ ] Manual testing with real Tyler accounts

## Deployment Strategy
1. **Week 1:** Phase A to staging
2. **Week 2:** Phase A to 10% production 
3. **Week 3:** Phase B to staging, A to 50% production
4. **Week 4:** Full rollout

## Risk Mitigation
- Feature flag kill switch for instant rollback
- Tyler API fallback plans
- Database rollback procedures
- Real-time error monitoring

**Estimated Timeline:** 8-12 days total