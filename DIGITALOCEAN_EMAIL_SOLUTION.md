# DigitalOcean Email Solution - SMTP Ports Blocked

## Problem

DigitalOcean **blocks all SMTP ports** (25, 465, 587) on all Droplets to prevent spam. This means:
- ❌ Cannot use Hostinger SMTP
- ❌ Cannot use Gmail SMTP
- ❌ Cannot use any SMTP service

## Solution: Use API-Based Email Service

Since SMTP is blocked, you **must** use an HTTP API-based email service. We'll use **SendGrid** (already integrated in the code).

## Why SendGrid?

- ✅ **Free tier: 100 emails/day** (permanent, not just 2 months!)
- ✅ **No SMTP ports needed** - Uses HTTP API
- ✅ **Works on DigitalOcean** - No port restrictions
- ✅ **Better deliverability** - Professional email service
- ✅ **Easy setup** - Just an API key

**Note**: SendGrid free tier is **permanent** (100 emails/day forever), not just 2 months. You might be thinking of a trial period, but the free tier continues after that.

## Alternative Services (If You Prefer)

### Mailgun
- **Free**: 5,000 emails/month (first 3 months), then 1,000/month
- **API-based** - No SMTP needed
- Good alternative to SendGrid

### AWS SES
- **Very cheap**: $0.10 per 1,000 emails
- **API-based** - No SMTP needed
- Requires AWS account setup

### Resend
- **Free**: 3,000 emails/month
- **Modern API** - Great developer experience
- Good for transactional emails

## Setup Steps

### 1. Sign Up for SendGrid (Free)

1. Go to: https://signup.sendgrid.com/
2. Sign up for a free account
3. Verify your email address
4. Complete the setup wizard

### 2. Create API Key

1. Go to **Settings** → **API Keys**
2. Click **"Create API Key"**
3. Name it: `Australia Storys Production`
4. Select **"Full Access"** (or "Restricted Access" with Mail Send permissions)
5. Click **"Create & View"**
6. **Copy the API key** (you won't see it again!)

### 3. Verify Sender Identity

1. Go to **Settings** → **Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Fill in:
   - **From Email Address**: `noreply@australiastorys.com`
   - **From Name**: `Australia Storys`
   - **Reply To**: `noreply@australiastorys.com`
   - **Company Address**: Your address
   - **Website URL**: `https://australiastorys.com`
4. Click **"Create"**
5. **Check your email** and click the verification link

### 4. Update Backend .env File

Add to `/var/www/blog-backend/.env`:

```env
# SendGrid Configuration (REQUIRED for DigitalOcean - SMTP ports are blocked)
SENDGRID_API_KEY=SG.your-api-key-here

# From email address (must be verified in SendGrid)
MAIL_FROM=noreply@australiastorys.com

FRONTEND_URL=https://australiastorys.com

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
3. Should see: `✅ [EmailService] Using SendGrid (HTTP API)`
4. Should see: `✅ Password reset email sent via SendGrid to ...`

## SendGrid Free Tier Details

- **100 emails/day** - Permanent free tier
- **3,000 emails/month** - Free tier limit
- **No credit card required** - Truly free
- **No expiration** - Free tier continues forever

**Note**: If you need more than 100 emails/day, paid plans start at $19.95/month for 50,000 emails.

## Using Your Hostinger Email Address

Even though you can't use Hostinger SMTP, you can still use your Hostinger email address (`noreply@australiastorys.com`) as the "From" address in SendGrid:

1. Verify `noreply@australiastorys.com` in SendGrid (step 3 above)
2. Set `MAIL_FROM=noreply@australiastorys.com` in `.env`
3. Emails will appear to come from your Hostinger email address
4. Replies will go to your Hostinger email inbox

## Troubleshooting

### Error: "The from address does not match a verified Sender Identity"

**Solution**: Verify your sender email in SendGrid:
1. Go to **Settings** → **Sender Authentication**
2. Verify `noreply@australiastorys.com`

### Error: "API key is invalid"

**Solution**: 
1. Check API key in `.env` file
2. Make sure there are no extra spaces
3. Regenerate API key if needed

### Still trying to use SMTP?

Check logs:
```bash
pm2 logs blog-backend | grep EmailService
```

Should see: `✅ [EmailService] Using SendGrid (HTTP API)`

If you see SMTP messages, `SENDGRID_API_KEY` is not set correctly.

## Summary

✅ **DigitalOcean blocks SMTP** - Must use API-based service  
✅ **SendGrid is free** - 100 emails/day permanently  
✅ **Already integrated** - Just add API key  
✅ **Use your Hostinger email** - Verify it in SendGrid  

## Next Steps

1. ✅ Sign up for SendGrid (free)
2. ✅ Create API key
3. ✅ Verify `noreply@australiastorys.com` in SendGrid
4. ✅ Add `SENDGRID_API_KEY` to `.env`
5. ✅ Rebuild and restart
6. ✅ Test email sending

That's it! No more SMTP port issues! 🎉
