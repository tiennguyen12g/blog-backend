import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as dns from 'dns';
import * as net from 'net';

// Force IPv4 DNS resolution to avoid IPv6 connection errors
// Try multiple methods to ensure IPv4 is used
try {
  // Method 1: Node.js 17+ (preferred)
  if (typeof (dns as any).setDefaultResultOrder === 'function') {
    (dns as any).setDefaultResultOrder('ipv4first');
    console.log('✅ [EmailService] DNS set to prefer IPv4 (Node.js 17+)');
  }
} catch (error) {
  // Ignore if not supported
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('MAIL_HOST') || 'smtp.gmail.com';
    const port = parseInt(this.configService.get<string>('MAIL_PORT') || '587');
    
    // Known Gmail SMTP IP addresses (IPv4) - use these if DNS is hijacked
    // These are common Gmail SMTP server IPs that should work
    const gmailSMTPIPs = [
      '74.125.200.108',  // Gmail SMTP server
      '74.125.200.109',
      '173.194.76.108',
      '173.194.76.109',
      '108.177.97.108',  // Additional Gmail SMTP IPs
      '108.177.97.109',
      '172.217.194.108',
      '172.217.194.109',
    ];
    
    // Check if DNS is hijacked by resolving and validating the IP
    const checkAndResolveGmailSMTP = (callback: (err: Error | null, address?: string) => void) => {
      dns.lookup(host, { family: 4 }, (err, address) => {
        if (err) {
          this.logger.warn(`⚠️ [EmailService] DNS lookup failed, using known Gmail SMTP IP`);
          return callback(null, gmailSMTPIPs[0]);
        }
        
        // Check if the resolved IP is a valid Gmail SMTP IP
        // Valid Gmail IPs typically start with: 74.125, 173.194, 108.177, 172.217, 142.250
        const isValidGmailIP = address.startsWith('74.125.') || 
                               address.startsWith('173.194.') || 
                               address.startsWith('108.177.') ||
                               address.startsWith('172.217.') ||
                               address.startsWith('142.250.');
        
        if (isValidGmailIP) {
          this.logger.log(`✅ [EmailService] Resolved ${host} to valid Gmail IP: ${address}`);
          return callback(null, address);
        } else {
          // DNS is hijacked - use known Gmail SMTP IP
          this.logger.warn(`⚠️ [EmailService] DNS returned invalid IP (${address}), using known Gmail SMTP IP: ${gmailSMTPIPs[0]}`);
          return callback(null, gmailSMTPIPs[0]);
        }
      });
    };
    
    // Store IPs for retry logic
    (this as any).gmailSMTPIPs = gmailSMTPIPs;
    
    // Initialize Nodemailer transporter with custom socket factory
    this.transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'), // Gmail App Password
      },
      // Custom socket factory that bypasses hijacked DNS
      getSocket: (options: any, callback: any) => {
        checkAndResolveGmailSMTP((err, address) => {
          if (err || !address) {
            this.logger.error(`❌ [EmailService] Failed to get Gmail SMTP IP:`, err);
            // Last resort: use first known IP
            const fallbackIP = gmailSMTPIPs[0];
            this.logger.log(`🔵 [EmailService] Using fallback IP: ${fallbackIP}`);
            const socket = net.createConnection(port, fallbackIP, callback);
            return socket;
          }
          
          // Create socket with resolved or known IPv4 address
          this.logger.log(`🔵 [EmailService] Connecting to Gmail SMTP at ${address}:${port}`);
          const socket = net.createConnection(port, address, callback);
          return socket;
        });
      },
      // Additional connection options for better reliability
      connectionTimeout: 30000, // 30 seconds (increased for slow connections)
      greetingTimeout: 15000, // 15 seconds
      socketTimeout: 15000, // 15 seconds
    } as any);

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('Email service connection error:', error);
      } else {
        this.logger.log('✅ Email service is ready to send messages');
      }
    });
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://australiastorys.com';
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
    const fromEmail = this.configService.get<string>('MAIL_FROM') || this.configService.get<string>('MAIL_USER');

    const mailOptions = {
      from: `Australia Storys <${fromEmail}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Welcome to Australia Storys!</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px;">Thank you for signing up! Please verify your email address to complete your registration.</p>
            <p style="font-size: 16px;">Click the button below to verify your email:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
            <p style="font-size: 12px; color: #999; word-break: break-all;">${verificationUrl}</p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">This link will expire in 24 hours.</p>
            <p style="font-size: 14px; color: #666;">If you didn't create an account, please ignore this email.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Australia Storys. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Verification email sent to ${email}: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send verification email to ${email}:`, error);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://australiastorys.com';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    const fromEmail = this.configService.get<string>('MAIL_FROM') || this.configService.get<string>('MAIL_USER');

    const mailOptions = {
      from: `Australia Storys <${fromEmail}>`,
      to: email,
      subject: 'Reset Your Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Password Reset Request</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px;">You requested to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
            <p style="font-size: 12px; color: #999; word-break: break-all;">${resetUrl}</p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">This link will expire in 1 hour.</p>
            <p style="font-size: 14px; color: #d32f2f; font-weight: bold;">If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Australia Storys. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Password reset email sent to ${email}: ${info.messageId}`);
      return true;
    } catch (error: any) {
      this.logger.error(`❌ Failed to send password reset email to ${email}:`, error);
      
      // Log specific error details for debugging
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.message?.includes('timeout')) {
        this.logger.warn(`⚠️ [EmailService] Connection timeout/refused - check firewall/network`);
        this.logger.warn(`⚠️ [EmailService] Ensure port 587 is open and Gmail SMTP is accessible`);
      }
      
      return false;
    }
  }
}
