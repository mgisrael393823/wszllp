# Fixed Invitation Configuration

## The Issue
The `&redirect_to=/accept-invitation` parameter doesn't work with Supabase's built-in invitation system. Supabase redirects to the Site URL, not custom paths.

## Solution: Configure Site URL Directly

### 1. Update Supabase Site URL
**Go to**: Supabase Dashboard → Authentication → URL Configuration

**Set Site URL to**:
```
https://www.wszevictions.com/accept-invitation
```

This will make ALL invitation links redirect directly to the setup page.

### 2. Updated Email Template (Use PNG for Logo)

Replace the Supabase invitation email template with this corrected version:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
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
      color: #ffffff !important;
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
      <img src="https://www.wszevictions.com/wsz-email-image.png" alt="WSZ Legal" class="logo">
      <h1 style="color: #111827; margin: 0; font-size: 28px;">Welcome to WSZ Legal</h1>
      <p style="color: #6b7280; margin: 10px 0 0; font-size: 16px;">
        You've been invited to join our case management platform
      </p>
    </div>

    <p style="font-size: 16px; color: #374151;">
      You have been invited to join the WSZ Legal Case Management platform. This professional system
      will give you secure access to manage legal cases, documents, and communications.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" class="button">
        Complete Account Setup
      </a>
    </div>

    <div class="features">
      <h3 style="margin: 0 0 15px; color: #111827;">What you'll have access to:</h3>
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
      <strong>Next Step:</strong> Click the button above to set your password and complete your account setup.
      You'll be guided through the process step by step.
    </p>

    <div class="footer">
      <p>
        This invitation was sent from WSZ Legal Case Management Platform<br>
        Visit us at: <a href="https://www.wszevictions.com">www.wszevictions.com</a>
      </p>
      <p style="margin-top: 15px;">
        <strong>Security Note:</strong> This invitation link will expire in 24 hours for your security.<br>
        If you're having trouble, copy and paste this link into your browser:<br>
        <span style="word-break: break-all; color: #2563eb; font-size: 12px;">
          {{ .ConfirmationURL }}
        </span>
      </p>
    </div>
  </div>
</body>
</html>
```

### 3. Alternative: Keep Main Login as Site URL

If you want to keep the main site URL as the homepage, you can:

1. **Set Site URL to**: `https://www.wszevictions.com`
2. **Add redirect URLs including**: `https://www.wszevictions.com/accept-invitation`
3. **Modify the invitation URL in the email template**:

```html
<!-- Replace the button href with: -->
<a href="{{ .ConfirmationURL }}" 
   onclick="window.location.href='{{ .ConfirmationURL }}'.replace('www.wszevictions.com', 'www.wszevictions.com/accept-invitation'); return false;"
   class="button">
  Complete Account Setup
</a>
```

### 4. Updated Redirect URLs List

Add ALL these URLs to your Supabase redirect URLs:

```
https://www.wszevictions.com
https://www.wszevictions.com/
https://www.wszevictions.com/dashboard
https://www.wszevictions.com/accept-invitation
https://www.wszevictions.com/reset-password
https://wszevictions.com
https://wszevictions.com/
```

## Key Changes Made:

✅ **Fixed Logo**: Changed from `.webp` to `.png` for email compatibility  
✅ **Removed Redirect Parameter**: Using Site URL configuration instead  
✅ **Added Password Reset**: Complete forgot password flow  
✅ **Fixed Navigation**: Proper routing between auth pages  

## Test Instructions:

1. Update Site URL to `https://www.wszevictions.com/accept-invitation`
2. Update email template with PNG logo version
3. Send test invitation
4. Verify it goes directly to account setup page

This should resolve all the invitation redirect issues!