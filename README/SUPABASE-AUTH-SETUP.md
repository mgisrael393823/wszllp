# Setting Up Supabase Authentication

This guide explains how to set up and configure Supabase Authentication for the WSZLLP application.

## 1. Create a Supabase Project

1. Sign up or log in at [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key (you'll need these for configuration)

## 2. Configure Email Authentication

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Ensure **Email** provider is enabled
3. Configure your email settings:
   - Choose whether to require email confirmation
   - Set the redirect URL for email confirmations (e.g., `https://your-app-url.com/auth/callback`)

## 3. Set Up Environment Variables

1. Copy the `.env.local.example` file to `.env.local`
2. Add your Supabase project URL and anon key:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Enable Email Templates (Optional)

For a more branded experience:

1. Go to **Authentication** → **Email Templates**
2. Customize the templates for:
   - Confirmation emails
   - Invitation emails
   - Magic link emails
   - Reset password emails

## 5. Configure Access Control

1. Go to **Authentication** → **Policies**
2. Set up Row Level Security (RLS) policies for your tables
3. Create specific policies for different user roles

## 6. Test Authentication Flow

1. Start your development server: `npm run dev`
2. Navigate to `/register` to create a test account
3. Check your email for verification (if enabled)
4. Try logging in at `/login`
5. Test protected routes

## Troubleshooting

- **CORS Issues**: Make sure your site URL is added to the allowed URLs in Supabase settings
- **Redirect Problems**: Verify that your redirect URLs match what's configured in Supabase
- **Email Not Arriving**: Check spam folders and verify your email provider configuration

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [React Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)