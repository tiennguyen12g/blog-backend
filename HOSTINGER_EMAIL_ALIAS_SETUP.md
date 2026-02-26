# Hostinger Email Alias Setup Guide

## ✅ How Email Aliases Work

**Yes, aliases work perfectly for sending emails!** 

You have:
- **1 main email**: `noreply@australiastorys.com`
- **50 aliases available** (you've used 4/50)
- **4 aliases created**:
  - `admin@australiastorys.com`
  - `support@australiastorys.com`
  - `info@australiastorys.com`
  - `contact@australiastorys.com`

### How It Works:
- **SMTP Login**: Use the main email credentials (`noreply@australiastorys.com` + password)
- **From Address**: Can be set to ANY alias (admin, support, info, contact, etc.)
- **All emails** sent from aliases will appear to come from that alias address
- **All emails** sent to aliases will be delivered to the main inbox (`noreply@australiastorys.com`)

## Configuration

### Update `/var/www/blog-backend/.env`:

```env
# Hostinger Email Configuration
# Use the MAIN email account credentials for SMTP login
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_USER=noreply@australiastorys.com
MAIL_PASS=your-noreply-password-here

# You can set FROM address to any alias
# For automated emails (verification, password reset):
MAIL_FROM=noreply@australiastorys.com

# Or use different aliases for different purposes:
# MAIL_FROM=support@australiastorys.com  (for support emails)
# MAIL_FROM=admin@australiastorys.com    (for admin emails)

FRONTEND_URL=https://australiastorys.com
```

## Recommended Alias Usage

You can create more aliases as needed (you have 46 more available):

### Current Aliases (4/50):
1. ✅ **noreply@australiastorys.com** - Main email (automated emails)
2. ✅ **admin@australiastorys.com** - Administrative tasks
3. ✅ **support@australiastorys.com** - Customer support
4. ✅ **info@australiastorys.com** - General inquiries
5. ✅ **contact@australiastorys.com** - Contact form

### Optional Additional Aliases (if needed):
- `newsletter@australiastorys.com` - Newsletter subscriptions
- `security@australiastorys.com` - Security-related emails
- `help@australiastorys.com` - Help desk
- `webmaster@australiastorys.com` - Technical issues
- `sales@australiastorys.com` - Business inquiries

## Using Different Aliases in Code

If you want to send from different aliases for different purposes, you can update the email service:

### Example: Send support emails from support@ alias

In `email.service.ts`, you can set different FROM addresses:

```typescript
// For password reset (use noreply)
MAIL_FROM=noreply@australiastorys.com

// For support emails (use support alias)
// You can modify the service to use support@ for support-related emails
```

For now, using `noreply@australiastorys.com` for all automated emails is fine. Users can reply to that address if needed.

## Testing

### 1. Test SMTP Connection

```bash
# Test port 465 (SSL) - Hostinger's SMTP port
timeout 10 telnet smtp.hostinger.com 465
```

### 2. Update .env and Restart

```bash
cd /var/www/blog-backend
# Edit .env file with Hostinger SMTP settings
npm run build
pm2 restart blog-backend
```

### 3. Test Email Sending

1. Try "Forgot Password" in your app
2. Check logs: `pm2 logs blog-backend | grep EmailService`
3. Should see: `✅ Password reset email sent via SMTP to ...`
4. Email should appear to come from `noreply@australiastorys.com`

## Important Notes

✅ **Aliases work for sending** - Use main email credentials, set FROM to any alias  
✅ **All emails go to main inbox** - Replies to aliases go to `noreply@australiastorys.com`  
✅ **You have 46 more aliases available** - Create more as needed  
✅ **SMTP credentials** - Always use the main email (`noreply@australiastorys.com`)  
✅ **FROM address** - Can be any alias you've created  

## Troubleshooting

### Authentication Failed
- Make sure you're using `noreply@australiastorys.com` (main email) as `MAIL_USER`
- Use the password for the main email account, not an alias password
- Aliases don't have separate passwords

### Email Not Received
- Check spam folder
- Verify the alias is created in Hostinger
- All emails sent to aliases go to the main inbox

### Can't Send from Alias
- Make sure the alias is created in Hostinger
- Use main email credentials for SMTP login
- Set `MAIL_FROM` to the alias address you want to use

## Summary

**Your setup is perfect!** You have:
- ✅ Main email: `noreply@australiastorys.com`
- ✅ 4 aliases created (admin, support, info, contact)
- ✅ 46 more aliases available

**Configuration:**
- Use `noreply@australiastorys.com` + password for SMTP login
- Set `MAIL_FROM` to any alias you want to send from
- All emails work perfectly! 🎉
