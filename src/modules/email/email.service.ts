import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as dns from 'dns';
import * as net from 'net';
import * as sgMail from '@sendgrid/mail';
import { Resend } from 'resend';

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
  private transporter: nodemailer.Transporter | null = null;
  private useSendGrid: boolean = false;
  private useResend: boolean = false;
  private resendClient: Resend | null = null;
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    this.fromEmail = this.configService.get<string>('MAIL_FROM') || this.configService.get<string>('MAIL_USER') || 'noreply@australiastorys.com';
    
    // Priority: Resend > SendGrid > SMTP
    // Check Resend first (modern, great free tier)
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    if (resendApiKey) {
      this.resendClient = new Resend(resendApiKey);
      this.useResend = true;
      this.logger.log('✅ [EmailService] Using Resend (HTTP API) - no SMTP ports needed');
      this.logger.log('✅ [EmailService] Perfect for DigitalOcean (SMTP ports are blocked)');
      return; // Skip other setups
    }
    
    // Check SendGrid as fallback
    const sendGridApiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (sendGridApiKey) {
      sgMail.setApiKey(sendGridApiKey);
      this.useSendGrid = true;
      this.logger.log('✅ [EmailService] Using SendGrid (HTTP API) - no SMTP ports needed');
      this.logger.log('✅ [EmailService] Perfect for DigitalOcean (SMTP ports are blocked)');
      return; // Skip SMTP setup
    }
    
    // SMTP is blocked on DigitalOcean - API key is required
    this.logger.error('❌ [EmailService] RESEND_API_KEY or SENDGRID_API_KEY is required!');
    this.logger.error('❌ [EmailService] DigitalOcean blocks SMTP ports (25, 465, 587)');
    this.logger.error('❌ [EmailService] Please set RESEND_API_KEY or SENDGRID_API_KEY in .env file');
    this.logger.warn('⚠️ [EmailService] Attempting SMTP setup (will likely fail on DigitalOcean)');
    
    // SMTP setup (works with Gmail, Hostinger, or any SMTP service)
    const host = this.configService.get<string>('MAIL_HOST') || 'smtp.hostinger.com';
    // Hostinger uses port 465 (SSL) - this is their standard SMTP port
    // Fallback to 587 (TLS) if configured for other providers
    const port = parseInt(this.configService.get<string>('MAIL_PORT') || '465');
    const useSSL = port === 465; // Port 465 uses SSL, port 587 uses STARTTLS
    
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
      secure: useSSL, // true for 465 (SSL), false for 587 (STARTTLS)
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'), // Gmail App Password
      },
      // Custom socket factory that bypasses hijacked DNS and handles errors gracefully
      getSocket: (options: any, callback: any) => {
        let callbackCalled = false;
        const safeCallback = (err: Error | null, socket?: net.Socket) => {
          if (!callbackCalled) {
            callbackCalled = true;
            if (err) {
              callback(err);
            } else {
              callback(null, socket);
            }
          }
        };
        
        checkAndResolveGmailSMTP((err, address) => {
          if (err || !address) {
            this.logger.error(`❌ [EmailService] Failed to get Gmail SMTP IP:`, err);
            // Last resort: use first known IP
            const fallbackIP = gmailSMTPIPs[0];
            this.logger.log(`🔵 [EmailService] Using fallback IP: ${fallbackIP}`);
            try {
              const socket = net.createConnection(port, fallbackIP, () => {
                safeCallback(null, socket);
              });
              // Add error handler to prevent unhandled error events
              socket.on('error', (error) => {
                this.logger.error(`❌ [EmailService] Socket error on ${fallbackIP}:${port}:`, error);
                safeCallback(error);
              });
              socket.setTimeout(20000, () => {
                if (!socket.destroyed) {
                  this.logger.error(`❌ [EmailService] Socket timeout on ${fallbackIP}:${port}`);
                  socket.destroy();
                  safeCallback(new Error('Connection timeout'));
                }
              });
              return socket;
            } catch (createError) {
              this.logger.error(`❌ [EmailService] Failed to create socket:`, createError);
              safeCallback(createError as Error);
              return null;
            }
          }
          
          // Create socket with resolved or known IPv4 address
          this.logger.log(`🔵 [EmailService] Connecting to Gmail SMTP at ${address}:${port} (SSL: ${useSSL})`);
          try {
            const socket = net.createConnection(port, address, () => {
              safeCallback(null, socket);
            });
            // Add error handler to prevent unhandled error events
            socket.on('error', (error) => {
              this.logger.error(`❌ [EmailService] Socket connection error on ${address}:${port}:`, error);
              safeCallback(error);
            });
            // Add timeout handler
            socket.setTimeout(20000, () => {
              if (!socket.destroyed) {
                this.logger.error(`❌ [EmailService] Socket timeout on ${address}:${port}`);
                socket.destroy();
                safeCallback(new Error('Connection timeout'));
              }
            });
            return socket;
          } catch (createError) {
            this.logger.error(`❌ [EmailService] Failed to create socket:`, createError);
            safeCallback(createError as Error);
            return null;
          }
        });
      },
      // Additional connection options for better reliability
      connectionTimeout: 20000, // 20 seconds
      greetingTimeout: 10000, // 10 seconds
      socketTimeout: 10000, // 10 seconds
      // Ignore TLS errors (some networks have issues with TLS)
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates (if any)
      },
    } as any);

    // Verify connection (with error handling to prevent crashes)
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('Email service connection error:', error);
        this.logger.warn(`⚠️ [EmailService] Email service will attempt to connect when sending emails`);
        this.logger.warn(`⚠️ [EmailService] Current config: port ${port}, SSL: ${useSSL}`);
        // Don't throw - let it try when actually sending
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
    
    const emailHtml = `
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
      `;

    try {
      if (this.useResend) {
        // Use Resend API
        await this.resendClient!.emails.send({
          from: `Australia Storys <${this.fromEmail}>`,
          to: email,
          subject: 'Verify Your Email Address',
          html: emailHtml,
        });
        this.logger.log(`✅ Verification email sent via Resend to ${email}`);
        return true;
      } else if (this.useSendGrid) {
        // Use SendGrid API
        await sgMail.send({
          to: email,
          from: `Australia Storys <${this.fromEmail}>`,
          subject: 'Verify Your Email Address',
          html: emailHtml,
        });
        this.logger.log(`✅ Verification email sent via SendGrid to ${email}`);
        return true;
      } else {
        // Use SMTP
        if (!this.transporter) {
          this.logger.error('❌ Email transporter not initialized');
          return false;
        }
        const info = await this.transporter.sendMail({
          from: `Australia Storys <${this.fromEmail}>`,
          to: email,
          subject: 'Verify Your Email Address',
          html: emailHtml,
        });
        this.logger.log(`✅ Verification email sent via SMTP to ${email}: ${info.messageId}`);
        return true;
      }
    } catch (error: any) {
      this.logger.error(`❌ Failed to send verification email to ${email}:`, error);
      
      if (this.useResend) {
        this.logger.error(`❌ Resend error:`, error.message || error);
      } else if (this.useSendGrid) {
        this.logger.error(`❌ SendGrid error:`, error.response?.body || error.message);
      } else {
        // Log specific error details for debugging
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.message?.includes('timeout')) {
          this.logger.warn(`⚠️ [EmailService] Connection timeout/refused - use RESEND_API_KEY or SENDGRID_API_KEY`);
        }
      }
      
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://australiastorys.com';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    
    const emailHtml = `
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
      `;

    try {
      if (this.useResend) {
        // Use Resend API
        await this.resendClient!.emails.send({
          from: `Australia Storys <${this.fromEmail}>`,
          to: email,
          subject: 'Reset Your Password',
          html: emailHtml,
        });
        this.logger.log(`✅ Password reset email sent via Resend to ${email}`);
        return true;
      } else if (this.useSendGrid) {
        // Use SendGrid API
        await sgMail.send({
          to: email,
          from: `Australia Storys <${this.fromEmail}>`,
          subject: 'Reset Your Password',
          html: emailHtml,
        });
        this.logger.log(`✅ Password reset email sent via SendGrid to ${email}`);
        return true;
      } else {
        // Use SMTP
        if (!this.transporter) {
          this.logger.error('❌ Email transporter not initialized');
          return false;
        }
        const info = await this.transporter.sendMail({
          from: `Australia Storys <${this.fromEmail}>`,
          to: email,
          subject: 'Reset Your Password',
          html: emailHtml,
        });
        this.logger.log(`✅ Password reset email sent via SMTP to ${email}: ${info.messageId}`);
        return true;
      }
    } catch (error: any) {
      this.logger.error(`❌ Failed to send password reset email to ${email}:`, error);
      
      if (this.useResend) {
        this.logger.error(`❌ Resend error:`, error.message || error);
      } else if (this.useSendGrid) {
        this.logger.error(`❌ SendGrid error:`, error.response?.body || error.message);
      } else {
        // Log specific error details for debugging
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.message?.includes('timeout')) {
          this.logger.warn(`⚠️ [EmailService] Connection timeout/refused - use RESEND_API_KEY or SENDGRID_API_KEY`);
        }
      }
      
      return false;
    }
  }
}
