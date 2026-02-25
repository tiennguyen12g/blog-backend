# Email Service Troubleshooting - Gmail SMTP Connection Timeout

## Problem

Email service is timing out when trying to connect to Gmail SMTP, even though we're using the correct Gmail IP (74.125.200.108).

## Root Cause

This is **NOT a nodemailer issue** - nodemailer works fine in production. The problem is likely:

1. **Firewall blocking port 587** - Your server's firewall or hosting provider may be blocking outbound SMTP connections
2. **Network restrictions** - Some cloud providers block SMTP ports by default
3. **ISP blocking** - Your server's ISP might block SMTP to prevent spam

## Solutions

### Option 1: Check Firewall (Recommended First Step)

```bash
# Test if port 587 is accessible from your server
telnet 74.125.200.108 587

# Or use nc (netcat)
nc -zv 74.125.200.108 587

# Or use curl
curl -v telnet://74.125.200.108:587
```

**If connection fails:**
- Port 587 is blocked by firewall
- Need to open outbound port 587

### Option 2: Open Firewall Port 587

#### Ubuntu/Debian (UFW):
```bash
sudo ufw allow out 587/tcp
sudo ufw reload
```

#### CentOS/RHEL (firewalld):
```bash
sudo firewall-cmd --add-port=587/tcp --permanent
sudo firewall-cmd --reload
```

#### iptables:
```bash
sudo iptables -A OUTPUT -p tcp --dport 587 -j ACCEPT
sudo iptables-save
```

### Option 3: Use Alternative Email Service (If Firewall Can't Be Changed)

If you can't open port 587, consider using:

#### SendGrid (Recommended):
- Free tier: 100 emails/day
- Simple API, no SMTP port issues
- Better deliverability

#### Mailgun:
- Free tier: 5,000 emails/month
- Good for transactional emails

#### AWS SES:
- Very cheap ($0.10 per 1,000 emails)
- Requires AWS account

### Option 4: Use Gmail SMTP Alternative Port

Try port 465 (SSL) instead of 587 (TLS):

```env
MAIL_PORT=465
```

And update email service:
```typescript
secure: true, // true for 465
```

### Option 5: Check Server Network Configuration

```bash
# Check if SMTP ports are blocked
sudo iptables -L -n | grep 587
sudo iptables -L OUTPUT -n | grep 587

# Check DNS resolution
nslookup smtp.gmail.com

# Test connection with timeout
timeout 10 telnet 74.125.200.108 587
```

## Quick Test Script

Create a test script to diagnose the issue:

```bash
# test-smtp.sh
#!/bin/bash
echo "Testing Gmail SMTP connection..."

# Test DNS
echo "1. Testing DNS resolution:"
nslookup smtp.gmail.com

# Test port 587
echo "2. Testing port 587:"
timeout 10 telnet 74.125.200.108 587 || echo "Connection failed or timed out"

# Test port 465
echo "3. Testing port 465:"
timeout 10 telnet 74.125.200.108 465 || echo "Connection failed or timed out"

# Check firewall
echo "4. Checking firewall rules:"
sudo ufw status | grep 587 || echo "Port 587 not in firewall rules"
```

Run it:
```bash
chmod +x test-smtp.sh
./test-smtp.sh
```

## Alternative: Use SendGrid (Easiest Solution)

If firewall can't be changed, switch to SendGrid:

1. **Sign up**: https://sendgrid.com
2. **Get API key**: Settings → API Keys → Create API Key
3. **Install**: `npm install @sendgrid/mail`
4. **Update email service** to use SendGrid instead of Gmail SMTP

This avoids SMTP port issues entirely.

## Current Status

- ✅ DNS hijacking detected and fixed (using known Gmail IPs)
- ✅ IPv4 connection forced
- ⚠️ Connection timeout (likely firewall/network issue)
- ⚠️ Port 587 may be blocked

## Next Steps

1. **Test port 587** from your server
2. **Open firewall** if port is blocked
3. **Or switch to SendGrid** if firewall can't be changed

Nodemailer works fine - this is a network/firewall configuration issue, not a code problem.
