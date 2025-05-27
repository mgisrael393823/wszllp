# Tyler Technologies Credential Verification

## 🚨 Action Required: Verify API Credentials

### Current Status
The e-filing implementation is **complete and merged** but requires credential verification with Tyler Technologies before live deployment.

### Credential Issue
Current authentication returns error `-4`:
```json
{
  "message_code": -4,
  "message": "Authentication failed, invalid/expired authentication token or email/password combination"
}
```

### Current Credentials (Need Verification)
```bash
Client Token: EVICT87
Username: czivin@wolfsolovy.com
Password: Zuj90820*
API Endpoint: https://api.uslegalpro.com/v4
```

## 📞 Contact Tyler Technologies

### Support Information
- **Contact**: Tyler Technologies Support
- **Account**: Wolf, Solvoy & Associates LLP
- **Service**: E-Filing API Integration

### Questions to Ask Tyler Support:

1. **Credential Verification**:
   - Confirm client token is correct: `EVICT87`
   - Verify username: `czivin@wolfsolovy.com`
   - Confirm current password validity
   - Check account status and permissions

2. **Environment Clarification**:
   - Are these staging or production credentials?
   - Is `https://api.uslegalpro.com/v4` the correct endpoint?
   - Do we need different credentials for testing vs production?

3. **Account Setup**:
   - Verify e-filing permissions are enabled
   - Confirm attorney and payment account setup
   - Check for any account restrictions or requirements

### Expected Resolution
Once credentials are verified, the following endpoints should work:
- ✅ `POST /v4/il/user/authenticate` - Authentication
- ✅ `GET /v4/il/firm/attorneys` - Attorney list  
- ✅ `GET /v4/il/payment_accounts` - Payment accounts
- ✅ `POST /v4/il/efile` - Filing submission

## 🧪 Testing After Credential Fix

### 1. Local Testing
```bash
# Test authentication directly
curl -X POST https://api.uslegalpro.com/v4/il/user/authenticate \
  -H "Content-Type: application/json" \
  -H "clienttoken: VERIFIED_TOKEN" \
  -d '{
    "data": {
      "username": "verified_username",
      "password": "verified_password"
    }
  }'
```

### 2. Application Testing
1. Update `.env.local` with verified credentials
2. Restart dev server: `npm run dev`
3. Test e-filing form submission
4. Verify attorney and payment account loading

### 3. End-to-End Testing
1. Submit initial filing (new case)
2. Submit subsequent filing (existing case)
3. Verify envelope creation and tracking
4. Test error handling scenarios

## 🚀 Deployment Preparation

### Environment Variables for Production
```bash
# Vercel/Netlify Environment Variables
VITE_EFILE_BASE_URL=https://api.uslegalpro.com/v4
VITE_EFILE_CLIENT_TOKEN=VERIFIED_TOKEN
VITE_EFILE_USERNAME=verified_username@wolfsolovy.com
VITE_EFILE_PASSWORD=verified_password
```

### Staging Environment (Optional)
If Tyler provides staging credentials:
```bash
# Staging Environment
VITE_EFILE_BASE_URL=https://staging-api.uslegalpro.com/v4
VITE_EFILE_CLIENT_TOKEN=STAGING_TOKEN
VITE_EFILE_USERNAME=staging_username
VITE_EFILE_PASSWORD=staging_password
```

## 📋 Implementation Status

### ✅ Ready for Production
- API compliance logic complete
- Form validation and UI
- Error handling and user feedback
- CORS issues resolved
- Comprehensive test coverage

### ⏳ Pending Credential Verification
- Live authentication with Tyler Technologies
- Attorney and payment account retrieval
- End-to-end filing submission testing

## 🎯 Next Steps

1. **Contact Tyler Technologies** (Priority 1)
2. **Update credentials** once verified
3. **Test authentication** in development
4. **Deploy to staging** environment
5. **Production deployment** with verified credentials

---

**Contact Tyler Technologies support as soon as possible to resolve the credential verification and enable live e-filing functionality.**