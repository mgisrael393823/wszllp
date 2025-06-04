# Supabase Email Template Configuration

## Custom Auth Email Templates for WSZ Legal Case Management

### **1. Access Email Templates**
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Select "Confirm your signup" template

### **2. Customize Signup Confirmation Email**

**Subject Line:**
```
Welcome to WSZ Legal Case Management Platform
```

**Email Body:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to WSZ Legal</title>
    <style>
        body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { max-width: 200px; height: auto; }
        .button { 
            background: #2563eb; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            display: inline-block;
            margin: 20px 0;
        }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://wszllp.vercel.app/wszmainlogo.webp" alt="WSZ Legal" class="logo">
            <h1>Welcome to WSZ Legal Case Management</h1>
        </div>
        
        <p>Thank you for joining our professional legal case management platform.</p>
        
        <p>To complete your account setup and start managing your legal cases, please confirm your email address by clicking the button below:</p>
        
        <div style="text-align: center;">
            <a href="{{ .ConfirmationURL }}" class="button">Confirm Your Account</a>
        </div>
        
        <p>Once confirmed, you'll have access to:</p>
        <ul>
            <li>📁 Case Management System</li>
            <li>📄 Document Organization</li>
            <li>📅 Hearing Scheduling</li>
            <li>👥 Contact Management</li>
            <li>📊 Executive Dashboard</li>
        </ul>
        
        <p>If you have any questions or need assistance, please contact our support team.</p>
        
        <div class="footer">
            <p>This email was sent from WSZ Legal Case Management Platform.<br>
            If you didn't create an account, you can safely ignore this email.</p>
            
            <p><strong>Security Note:</strong> This confirmation link will expire in 24 hours for your security.</p>
        </div>
    </div>
</body>
</html>
```

### **3. Customize Password Reset Email**

**Subject Line:**
```
Reset Your WSZ Legal Account Password
```

**Email Body:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset - WSZ Legal</title>
    <style>
        body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { max-width: 200px; height: auto; }
        .button { 
            background: #2563eb; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            display: inline-block;
            margin: 20px 0;
        }
        .security-notice { 
            background: #fef2f2; 
            border: 1px solid #fecaca; 
            padding: 15px; 
            border-radius: 6px; 
            margin: 20px 0;
        }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://wszllp.vercel.app/wszmainlogo.webp" alt="WSZ Legal" class="logo">
            <h1>Password Reset Request</h1>
        </div>
        
        <p>We received a request to reset the password for your WSZ Legal Case Management account.</p>
        
        <div style="text-align: center;">
            <a href="{{ .ConfirmationURL }}" class="button">Reset Your Password</a>
        </div>
        
        <div class="security-notice">
            <strong>Security Information:</strong>
            <ul style="margin: 10px 0;">
                <li>This reset link expires in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password won't change until you create a new one</li>
            </ul>
        </div>
        
        <p>For security reasons, please ensure you:</p>
        <ul>
            <li>Use a strong, unique password</li>
            <li>Don't share your login credentials</li>
            <li>Log out from shared computers</li>
        </ul>
        
        <div class="footer">
            <p>This email was sent from WSZ Legal Case Management Platform.<br>
            If you're having trouble with the button above, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #2563eb;">{{ .ConfirmationURL }}</p>
        </div>
    </div>
</body>
</html>
```

### **4. Configure Email Settings**

1. **From Email**: Use a professional address like `noreply@wszlegal.com`
2. **From Name**: "WSZ Legal Case Management"
3. **Reply-To**: Set to your support email

### **5. Test the Email Flow**

1. Create a test user account
2. Check that emails are delivered
3. Verify links work correctly
4. Test on different email clients (Gmail, Outlook, etc.)

### **6. Domain Configuration (Optional)**

For professional email delivery:
1. Set up SPF, DKIM, and DMARC records
2. Configure custom domain in Supabase
3. Verify email deliverability

---

**Note**: Replace `wszllp.vercel.app` with your actual domain if using a custom domain.