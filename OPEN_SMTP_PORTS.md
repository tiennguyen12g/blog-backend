# Opening SMTP Ports (587 and 465) - Ubuntu Server

## Step 1: Check Current Firewall Status

```bash
# Check if UFW is enabled
sudo ufw status

# Check iptables rules
sudo iptables -L -n | grep -E '587|465'
sudo iptables -L OUTPUT -n | grep -E '587|465'
```

## Step 2: Open Outbound Ports (If UFW is Enabled)

If UFW is enabled, allow outbound connections:

```bash
# Allow outbound port 587 (TLS)
sudo ufw allow out 587/tcp

# Allow outbound port 465 (SSL)
sudo ufw allow out 465/tcp

# Reload firewall
sudo ufw reload

# Verify rules
sudo ufw status numbered
```

## Step 3: Open Ports with iptables (If UFW Not Enabled)

If UFW is not enabled, use iptables directly:

```bash
# Allow outbound port 587
sudo iptables -A OUTPUT -p tcp --dport 587 -j ACCEPT

# Allow outbound port 465
sudo iptables -A OUTPUT -p tcp --dport 465 -j ACCEPT

# Save iptables rules (Ubuntu/Debian)
sudo netfilter-persistent save
# Or
sudo iptables-save > /etc/iptables/rules.v4
```

## Step 4: Check Hosting Provider Restrictions

Many hosting providers block SMTP ports at the network level. Check:

1. **1&1 IONOS** (your provider) - They often block SMTP ports to prevent spam
2. Check your hosting control panel for "SMTP restrictions" or "Port blocking"
3. Contact support to request SMTP port access

## Step 5: Test Connectivity

After opening ports, test:

```bash
# Test port 587
timeout 10 telnet 74.125.200.108 587

# Test port 465
timeout 10 telnet 74.125.200.108 465

# Or use nc (netcat)
nc -zv 74.125.200.108 587
nc -zv 74.125.200.108 465
```

## If Ports Still Don't Work

If ports are still blocked after firewall configuration, it's likely your **hosting provider is blocking SMTP at the network level**. In this case:

### Option 1: Contact 1&1 IONOS Support
Ask them to:
- Unblock outbound SMTP ports (587, 465)
- Or provide SMTP relay service

### Option 2: Use SendGrid (Recommended - No Ports Needed)
SendGrid uses HTTP API, bypasses SMTP port restrictions:
- Free tier: 100 emails/day
- Simple setup
- Better deliverability

### Option 3: Use Mailgun
- Free tier: 5,000 emails/month
- HTTP API based

## Quick Commands Summary

```bash
# Check firewall
sudo ufw status
sudo iptables -L OUTPUT -n

# Open ports (UFW)
sudo ufw allow out 587/tcp
sudo ufw allow out 465/tcp
sudo ufw reload

# Open ports (iptables)
sudo iptables -A OUTPUT -p tcp --dport 587 -j ACCEPT
sudo iptables -A OUTPUT -p tcp --dport 465 -j ACCEPT
sudo netfilter-persistent save

# Test
timeout 10 telnet 74.125.200.108 465
```
