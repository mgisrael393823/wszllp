# Security Notice

## Environment Variables Required

This project requires sensitive Supabase credentials to be set as environment variables. **Never commit these values to version control.**

### Required Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
```

### Security Best Practices

1. **Never commit `.env` files** - They are gitignored for security
2. **Use environment variables** - All scripts and tests require proper env vars
3. **Rotate keys if exposed** - If keys are accidentally committed, rotate them immediately
4. **Use service role key carefully** - Only for server-side operations and tests

### Getting Your Keys

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy the Project URL and keys

### If Keys Are Compromised

If any keys are accidentally exposed:

1. Go to Supabase Dashboard → Settings → API
2. Generate new keys
3. Update all environment variables
4. Update any deployed applications