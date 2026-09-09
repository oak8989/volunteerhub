# Email Configuration Guide

## Current Implementation

The email system in VolunteerHub is designed to work with SMTP servers, but the current frontend-only implementation **simulates** email sending for demonstration purposes. Emails will show as "delivered" in the outbox, but they are not actually sent to real email addresses.

## How Email Sending Works

### Frontend Simulation (Current)
- Emails are logged to localStorage
- Status shows as "delivered" after a simulated delay
- No actual SMTP connection is made
- Useful for testing the UI and workflow

### Production Setup (Required for Real Emails)

To enable actual email delivery, you need to:

#### Option 1: Backend API Service
Create a backend service that handles SMTP sending:

```javascript
// Example Node.js/Express backend
const nodemailer = require('nodemailer');

app.post('/api/send-email', async (req, res) => {
  const { to, subject, body, smtpConfig } = req.body;
  
  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.port === 465,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass
    }
  });

  try {
    const info = await transporter.sendMail({
      from: smtpConfig.from,
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>')
    });
    
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

Then update `src/services/emailService.ts` to call this API:

```typescript
async sendEmail(to: string, subject: string, body: string): Promise<EmailResult> {
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, body, smtpConfig: this.config })
  });
  
  return await response.json();
}
```

#### Option 2: Third-Party Email Services
Use services like:
- **SendGrid** - Free tier available
- **Mailgun** - Developer-friendly API
- **Amazon SES** - Cost-effective for high volume
- **Postmark** - Great for transactional emails

Example with SendGrid:

```typescript
async sendEmail(to: string, subject: string, body: string): Promise<EmailResult> {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: this.config.from },
      subject,
      content: [{ type: 'text/plain', value: body }]
    })
  });
  
  if (response.ok) {
    return { success: true, messageId: response.headers.get('X-Message-Id') };
  } else {
    const error = await response.json();
    return { success: false, error: error.errors[0].message };
  }
}
```

## SMTP Configuration in VolunteerHub

1. Go to **Admin Console** → **Settings** → **Email**
2. Enter your SMTP credentials:
   - **SMTP Host**: e.g., `smtp.gmail.com`, `smtp.sendgrid.net`
   - **SMTP Port**: 587 (TLS) or 465 (SSL)
   - **SMTP User**: Your email username or API key
   - **SMTP Password**: Your email password or API secret
   - **From Address**: The email address emails will come from

3. Click **Save Settings**
4. Click **Send Test Email** to verify the configuration

## Common SMTP Providers

### Gmail
- Host: `smtp.gmail.com`
- Port: 587
- Note: Requires "App Password" if 2FA is enabled

### Outlook/Office 365
- Host: `smtp.office365.com`
- Port: 587

### SendGrid
- Host: `smtp.sendgrid.net`
- Port: 587
- User: `apikey`
- Password: Your SendGrid API key

### Mailgun
- Host: `smtp.mailgun.org`
- Port: 587
- User: Your Mailgun SMTP username
- Password: Your Mailgun SMTP password

## Testing Email Delivery

1. Configure SMTP settings in Admin → Settings → Email
2. Click "Send Test Email"
3. Check the email outbox for status
4. If status shows "failed", check:
   - SMTP credentials are correct
   - Host and port are correct
   - Firewall allows outbound SMTP connections
   - Email provider allows SMTP access

## Email Templates

The system sends these types of emails:

1. **Welcome Email** - When admin adds a new member
   - Contains login credentials
   - Sent automatically

2. **Password Reset** - When user requests password reset
   - Contains reset instructions
   - Sent on demand

3. **Test Email** - For verifying SMTP configuration
   - Sent manually from Settings
   - Includes SMTP config details

## Security Notes

- SMTP credentials are stored in localStorage (browser-only)
- For production, use environment variables or a secure backend
- Never commit SMTP credentials to version control
- Consider using API keys instead of passwords where possible
- Enable 2FA on email accounts used for SMTP

## Troubleshooting

### Emails show as "delivered" but not received
- This is expected in the current simulation mode
- Configure a real SMTP backend for actual delivery

### Connection refused
- Check SMTP host and port
- Verify firewall settings
- Ensure email provider allows SMTP access

### Authentication failed
- Verify username and password
- Check if app-specific password is required
- Ensure account has SMTP access enabled

### Rate limiting
- Some providers limit emails per hour/day
- Consider using a dedicated email service for high volume
- Implement queuing for bulk emails

## Future Enhancements

Planned features for the email system:
- Email templates with HTML support
- Attachment support
- Email scheduling
- Bounce handling
- Delivery tracking
- Unsubscribe management
- Email analytics
