# Hostinger Email Setup Guide

## Recommended Email Addresses to Create

You have 10 email accounts available. Here's a recommended list:

### Essential (Must Have):
1. ✅ **noreply@australiastorys.com** - Already created (for automated emails)
2. **support@australiastorys.com** - Customer support
3. **admin@australiastorys.com** - Administrative tasks
4. **info@australiastorys.com** - General inquiries

### Optional (Based on Your Needs):
5. **contact@australiastorys.com** - Contact form submissions
6. **newsletter@australiastorys.com** - Newsletter subscriptions
7. **sales@australiastorys.com** - Business inquiries (if applicable)
8. **security@australiastorys.com** - Security-related emails
9. **help@australiastorys.com** - Help desk
10. **webmaster@australiastorys.com** - Technical issues

### Alternative Minimal Setup (If You Want to Save):
1. ✅ **noreply@australiastorys.com** - Automated emails (already created)
2. **support@australiastorys.com** - All user inquiries
3. **admin@australiastorys.com** - Administrative use

**Recommendation**: Start with 3-4 emails (noreply, support, admin, info) and create more as needed.

## Hostinger SMTP Settings

Hostinger typically uses these SMTP settings:

```
SMTP Host: smtp.hostinger.com
SMTP Port: 465 (SSL)
SMTP Username: noreply@australiastorys.com (your full email)
SMTP Password: (the password you set for this email)
Encryption: SSL
```

## Configuration Steps

### 1. Create Email Accounts in Hostinger

1. Log in to Hostinger control panel
2. Go to **Email** section
3. Create the recommended emails above
4. Set strong passwords for each

### 2. Update Backend .env File

Add to `/var/www/blog-backend/.env`:

```env
# Hostinger Email Configuration
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_USER=noreply@australiastorys.com
MAIL_PASS=your-email-password-here
MAIL_FROM=noreply@australiastorys.com
FRONTEND_URL=https://australiastorys.com
```

### 3. Test SMTP Connection

Test from your server:

```bash
# Test port 465 (SSL) - Hostinger's SMTP port
timeout 10 telnet smtp.hostinger.com 465
```

### 4. Rebuild and Restart

```bash
cd /var/www/blog-backend
npm run build
pm2 restart blog-backend
```

### 5. Test Email Sending

1. Try "Forgot Password" in your app
2. Check logs: `pm2 logs blog-backend | grep EmailService`
3. Should see: `✅ Password reset email sent via SMTP to ...`

## Important Notes

- **Hostinger uses port 465 (SSL)** - This is their standard SMTP port
- **Email password** is the password you set in Hostinger, NOT your hosting account password
- **From address** can be the main email or any alias you've created
- **SMTP credentials** use the main email account (noreply@australiastorys.com)

## Troubleshooting

### Connection Timeout
- Check if port 465 is open: `telnet smtp.hostinger.com 465`
- Verify firewall allows outbound port 465
- Contact Hostinger support if port 465 is blocked

### Authentication Failed
- Double-check email and password in `.env`
- Make sure you're using the full email address as username
- Verify the email account is active in Hostinger

### Email Not Received
- Check spam folder
- Verify email account is set up correctly in Hostinger
- Check email service logs for errors

## Email Best Practices

1. **noreply@** - Use for automated emails (verification, password reset)
2. **support@** - Use for user support inquiries
3. **admin@** - Use for administrative tasks
4. **info@** - Use for general information requests

## Next Steps

1. ✅ Create recommended email addresses in Hostinger
2. ✅ Update `.env` file with SMTP settings
3. ✅ Test SMTP connection
4. ✅ Rebuild and restart backend
5. ✅ Test email sending
