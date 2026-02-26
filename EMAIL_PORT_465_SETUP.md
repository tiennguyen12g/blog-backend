# Email Service - Port 465 (SSL) Setup

## Current Configuration

The email service is now configured to use **port 465 (SSL)** by default instead of port 587 (TLS). Port 465 is often less blocked by firewalls and hosting providers.

## Environment Variable

Update your `blog-backend/.env` file:

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USER=australiastorys@gmail.com
MAIL_PASS=your-gmail-app-password
MAIL_FROM=australiastorys@gmail.com
```

**Important:** Port 465 uses SSL (secure: true), while port 587 uses STARTTLS (secure: false).

## Testing Port 465

Test if port 465 is accessible:

```bash
# Test port 465
telnet 74.125.200.108 465

# Or with timeout
timeout 10 telnet 74.125.200.108 465

# Or with nc
nc -zv 74.125.200.108 465
```

## If Port 465 Also Fails

If both ports 587 and 465 are blocked, you have these options:

### Option 1: Contact Hosting Provider
Ask your hosting provider to open outbound ports 587 and 465 for SMTP.

### Option 2: Use SendGrid (Recommended)
SendGrid uses HTTP API, no SMTP ports needed:
- Free tier: 100 emails/day
- Simple setup
- Better deliverability

### Option 3: Use Mailgun
- Free tier: 5,000 emails/month
- HTTP API based

### Option 4: Use AWS SES
- Very cheap
- Requires AWS account

## Current Status

- ✅ Default port changed to 465 (SSL)
- ✅ Error handling improved (prevents crashes)
- ✅ Socket timeout handlers added
- ✅ Better error logging

## Next Steps

1. **Update `.env` file:**
   ```env
   MAIL_PORT=465
   ```

2. **Rebuild and restart:**
   ```bash
   cd /var/www/blog-backend
   npm run build
   pm2 restart blog-backend
   ```

3. **Test forgot password** - should try port 465 now

4. **Check logs:**
   ```bash
   pm2 logs blog-backend | grep EmailService
   ```

If port 465 also times out, the hosting provider is blocking SMTP ports, and you should switch to SendGrid or Mailgun.
