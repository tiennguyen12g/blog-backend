# SendGrid Email Setup - No SMTP Ports Needed!

## Why SendGrid?

Your hosting provider (1&1 IONOS) is blocking SMTP ports (587, 465) at the network level. **SendGrid uses HTTP API instead of SMTP**, so it bypasses all port restrictions!

## Benefits

- ✅ **No SMTP ports needed** - Uses HTTP API
- ✅ **Free tier**: 100 emails/day
- ✅ **Better deliverability** - Professional email service
- ✅ **Simple setup** - Just an API key
- ✅ **Works everywhere** - No firewall issues

## Setup Steps

### 1. Sign Up for SendGrid

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
   - **From Email Address**: `australiastorys@gmail.com`
   - **From Name**: `Australia Storys`
   - **Reply To**: `australiastorys@gmail.com`
   - **Company Address**: Your address
   - **Website URL**: `https://australiastorys.com`
4. Click **"Create"**
5. **Check your email** and click the verification link

### 4. Update Backend Environment

Add to `/var/www/blog-backend/.env`:

```env
# SendGrid Configuration (Preferred - No SMTP ports needed)
SENDGRID_API_KEY=SG.your-api-key-here

# Optional: Custom from email (must be verified in SendGrid)
MAIL_FROM=australiastorys@gmail.com

# Gmail SMTP (fallback - only used if SENDGRID_API_KEY is not set)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USER=australiastorys@gmail.com
MAIL_PASS=your-gmail-app-password
```

### 5. Install Package (Already Done)

```bash
cd /var/www/blog-backend
npm install @sendgrid/mail
```

### 6. Rebuild and Restart

```bash
cd /var/www/blog-backend
npm run build
pm2 restart blog-backend
```

### 7. Test

1. Try "Forgot Password" in your app
2. Check logs:
   ```bash
   pm2 logs blog-backend | grep EmailService
   ```
3. Should see: `✅ Password reset email sent via SendGrid to ...`

## How It Works

The email service automatically detects if `SENDGRID_API_KEY` is set:
- **If set**: Uses SendGrid HTTP API (no SMTP ports)
- **If not set**: Falls back to Gmail SMTP (requires open ports)

## SendGrid Free Tier Limits

- **100 emails/day** (free tier)
- **40,000 emails/month** (free tier)
- Perfect for small to medium apps

## Troubleshooting

### Error: "The from address does not match a verified Sender Identity"

**Solution**: Verify your sender email in SendGrid:
1. Go to **Settings** → **Sender Authentication**
2. Verify `australiastorys@gmail.com`

### Error: "API key is invalid"

**Solution**: 
1. Check API key in `.env` file
2. Make sure there are no extra spaces
3. Regenerate API key if needed

### Still using SMTP?

Check logs:
```bash
pm2 logs blog-backend | grep EmailService
```

Should see: `✅ [EmailService] Using SendGrid (HTTP API)`

If you see SMTP messages, `SENDGRID_API_KEY` is not set correctly.

## Cost

- **Free**: 100 emails/day
- **Essentials**: $19.95/month for 50,000 emails
- **Pro**: $89.95/month for 100,000 emails

For most apps, free tier is enough!

## Next Steps

1. ✅ Sign up for SendGrid
2. ✅ Create API key
3. ✅ Verify sender email
4. ✅ Add `SENDGRID_API_KEY` to `.env`
5. ✅ Rebuild and restart
6. ✅ Test forgot password

That's it! No more SMTP port issues! 🎉
