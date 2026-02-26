# Resend Email Setup Guide

## Why Resend?

- ✅ **Free tier: 3,000 emails/month** (100/day)
- ✅ **No SMTP ports needed** - Uses HTTP API
- ✅ **Works on DigitalOcean** - No port restrictions
- ✅ **Modern API** - Great developer experience
- ✅ **Better deliverability** - Professional email service
- ✅ **Easy setup** - Just an API key

## Setup Steps

### 1. Sign Up for Resend (Free)

1. Go to: https://resend.com/signup
2. Sign up with your email
3. Verify your email address
4. Complete the setup wizard

### 2. Create API Key

1. Go to **API Keys** in the dashboard
2. Click **"Create API Key"**
3. Name it: `Australia Storys Production`
4. Select **"Full Access"** (or "Sending Access" only)
5. Click **"Add"**
6. **Copy the API key** (starts with `re_`)

### 3. Verify Domain (Recommended)

1. Go to **Domains** in the dashboard
2. Click **"Add Domain"**
3. Enter: `australiastorys.com`
4. Follow the DNS setup instructions:
   - Add TXT record for domain verification
   - Add DKIM records (for better deliverability)
5. Wait for verification (usually a few minutes)

**Note**: You can also verify a single email address instead of the whole domain:
1. Go to **Emails** → **Add Email**
2. Enter: `noreply@australiastorys.com`
3. Verify via email link

### 4. Update Backend .env File

Add to `/var/www/blog-backend/.env`:

```env
# Resend Configuration (REQUIRED for DigitalOcean - SMTP ports are blocked)
RESEND_API_KEY=re_your-api-key-here

# From email address (must be verified in Resend)
MAIL_FROM=noreply@australiastorys.com

FRONTEND_URL=https://australiastorys.com

# Optional: Remove or comment out SendGrid if not using
# SENDGRID_API_KEY=

# SMTP settings are NOT needed (and won't work on DigitalOcean)
# MAIL_HOST=smtp.hostinger.com
# MAIL_PORT=465
# MAIL_USER=noreply@australiastorys.com
# MAIL_PASS=...
```

### 5. Rebuild and Restart

```bash
cd /var/www/blog-backend
npm run build
pm2 restart blog-backend
```

### 6. Test

1. Try "Forgot Password" in your app
2. Check logs: `pm2 logs blog-backend | grep EmailService`
3. Should see: `✅ [EmailService] Using Resend (HTTP API)`
4. Should see: `✅ Password reset email sent via Resend to ...`

## Resend Free Tier

- **3,000 emails/month** - Free tier
- **100 emails/day** - Daily limit
- **No credit card required** - Truly free
- **No expiration** - Free tier continues forever

**Note**: If you need more, paid plans start at $20/month for 50,000 emails.

## Using Your Hostinger Email Address

You can use your Hostinger email address (`noreply@australiastorys.com`) as the "From" address:

1. **Option 1**: Verify the domain `australiastorys.com` in Resend (recommended)
2. **Option 2**: Verify just the email `noreply@australiastorys.com` in Resend
3. Set `MAIL_FROM=noreply@australiastorys.com` in `.env`
4. Emails will appear to come from your Hostinger email address
5. Replies will go to your Hostinger email inbox

## Priority Order

The email service checks in this order:
1. **Resend** (if `RESEND_API_KEY` is set) ← **You're using this**
2. **SendGrid** (if `SENDGRID_API_KEY` is set)
3. **SMTP** (fallback, won't work on DigitalOcean)

## Troubleshooting

### Error: "The from address does not match a verified domain"

**Solution**: Verify your domain or email in Resend:
1. Go to **Domains** → **Add Domain** (for domain verification)
2. Or go to **Emails** → **Add Email** (for single email verification)

### Error: "API key is invalid"

**Solution**: 
1. Check API key in `.env` file
2. Make sure it starts with `re_`
3. Make sure there are no extra spaces
4. Regenerate API key if needed

### Still trying to use SMTP?

Check logs:
```bash
pm2 logs blog-backend | grep EmailService
```

Should see: `✅ [EmailService] Using Resend (HTTP API)`

If you see SMTP messages, `RESEND_API_KEY` is not set correctly.

## Resend vs SendGrid

| Feature | Resend | SendGrid |
|---------|--------|----------|
| Free Tier | 3,000/month | 100/day (3,000/month) |
| API Quality | Modern, clean | Established, mature |
| Setup | Very easy | Easy |
| Documentation | Excellent | Good |
| Developer Experience | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**Recommendation**: Resend is newer and has better developer experience, but both work great!

## Summary

✅ **Resend is installed** - Package added  
✅ **Email service updated** - Supports Resend  
✅ **Priority: Resend > SendGrid > SMTP**  
✅ **Works on DigitalOcean** - No SMTP ports needed  
✅ **Free tier: 3,000 emails/month**  

## Next Steps

1. ✅ Sign up for Resend (free)
2. ✅ Create API key
3. ✅ Verify domain or email in Resend
4. ✅ Add `RESEND_API_KEY` to `.env`
5. ✅ Rebuild and restart
6. ✅ Test email sending

That's it! Resend is ready to use! 🎉
