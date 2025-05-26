# User Invitation Setup Guide

## New Account Setup Flow

We've created a dedicated account setup page that provides a much better user experience for new invitations.

### How It Works

1. **User receives invitation email** with proper redirect URL
2. **Clicks invitation link** → Taken to `/accept-invitation` page
3. **Sets their password** with strength validation
4. **Automatically logged in** and redirected to dashboard

### Supabase Configuration Updates Needed

#### 1. Update Site URL (if not already done)
- **Supabase Dashboard** → **Authentication** → **URL Configuration**
- **Site URL**: `https://www.wszevictions.com`

#### 2. Update Redirect URLs
Add this URL to your redirect URLs list:
```
https://www.wszevictions.com/accept-invitation
```

#### 3. Update Invitation Email Template

**Go to**: Supabase Dashboard → Authentication → Email Templates → "Invite user"

**Replace the email template with**:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to WSZ Legal</title>
    <style>
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f9fafb;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 40px 20px; 
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            padding-bottom: 20px;
            border-bottom: 1px solid #e5e7eb;
        }
        .logo { 
            max-width: 180px; 
            height: auto; 
            margin-bottom: 20px;
        }
        .button { 
            background: #2563eb; 
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 6px; 
            display: inline-block;
            margin: 24px 0;
            font-weight: 600;
            font-size: 16px;
        }
        .button:hover {
            background: #1d4ed8;
        }
        .features {
            background: #f8fafc;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .features ul {
            margin: 0;
            padding-left: 20px;
        }
        .features li {
            margin: 8px 0;
            color: #374151;
        }
        .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb; 
            color: #6b7280; 
            font-size: 14px; 
            text-align: center;
        }
        .footer a {
            color: #2563eb;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://www.wszevictions.com/wszmainlogo.webp" alt="WSZ Legal" class="logo">
            <h1 style="color: #111827; margin: 0; font-size: 28px;">Welcome to WSZ Legal</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 16px;">You've been invited to join our case management platform</p>
        </div>
        
        <p style="font-size: 16px; color: #374151;">
            You have been invited to join the WSZ Legal Case Management platform. This professional system will give you secure access to manage legal cases, documents, and communications.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ .ConfirmationURL }}" class="button">Complete Account Setup</a>
        </div>
        
        <div class="features">
            <h3 style="margin: 0 0 15px 0; color: #111827;">What you'll have access to:</h3>
            <ul>
                <li>📁 Case Management System</li>
                <li>📄 Document Organization & Storage</li>
                <li>📅 Hearing Scheduling & Calendar</li>
                <li>👥 Contact & Client Management</li>
                <li>📊 Executive Dashboard & Reports</li>
                <li>🔒 Secure, Professional Environment</li>
            </ul>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; background: #fef3c7; padding: 12px; border-radius: 6px; border-left: 4px solid #f59e0b;">
            <strong>Next Step:</strong> Click the button above to set your password and complete your account setup. You'll be guided through the process step by step.
        </p>
        
        <div class="footer">
            <p>This invitation was sent from WSZ Legal Case Management Platform<br>
            Visit us at: <a href="https://www.wszevictions.com">www.wszevictions.com</a></p>
            
            <p style="margin-top: 15px;">
                <strong>Security Note:</strong> This invitation link will expire in 24 hours for your security.<br>
                If you're having trouble, copy and paste this link into your browser:<br>
                <span style="word-break: break-all; color: #2563eb; font-size: 12px;">{{ .ConfirmationURL }}</span>
            </p>
        </div>
    </div>
</body>
</html>
```

### 4. Test the New Flow

1. **Send a test invitation** from Supabase Dashboard
2. **Check the email** - should have new professional design
3. **Click the setup button** - should go to `/accept-invitation` page
4. **Complete password setup** - should redirect to dashboard

### Benefits of New Flow

✅ **Professional User Experience**
- Dedicated setup page with WSZ branding
- Clear password requirements with visual feedback
- Professional loading states and success messages

✅ **Better Security**
- Strong password requirements enforced
- Real-time password validation
- Secure token verification

✅ **Improved Onboarding**
- Clear step-by-step process
- No confusion about "forgot password" workaround
- Immediate access to dashboard after setup

### Troubleshooting

**Issue**: "Invalid invitation link"
- **Solution**: Check that redirect URL is added to Supabase settings
- **Solution**: Ensure URL exactly matches: `https://www.wszevictions.com/accept-invitation`

**Issue**: Password requirements not showing
- **Solution**: Clear browser cache and reload page

**Issue**: Not redirecting to dashboard
- **Solution**: Check browser console for any JavaScript errors

---

**Expected Result**: New users will have a smooth, professional account setup experience that matches the quality of your legal case management platform.