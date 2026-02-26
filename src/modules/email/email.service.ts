import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private useResend: boolean = false;
  private resendClient: Resend | null = null;
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    this.fromEmail = this.configService.get<string>('MAIL_FROM') || this.configService.get<string>('MAIL_USER') || 'noreply@australiastorys.com';
    
    // Use Resend only (no SendGrid or SMTP fallback)
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    if (resendApiKey) {
      this.resendClient = new Resend(resendApiKey);
      this.useResend = true;
      this.logger.log('✅ [EmailService] Using Resend (HTTP API) - no SMTP ports needed');
      this.logger.log('✅ [EmailService] Perfect for DigitalOcean (SMTP ports are blocked)');
    } else {
      this.logger.error('❌ [EmailService] RESEND_API_KEY is required!');
      this.logger.error('❌ [EmailService] DigitalOcean blocks SMTP ports (25, 465, 587)');
      this.logger.error('❌ [EmailService] Please set RESEND_API_KEY in .env file');
      this.logger.error('❌ [EmailService] Email sending will fail until RESEND_API_KEY is configured');
    }
    
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
      if (!this.useResend || !this.resendClient) {
        this.logger.error('❌ [EmailService] Resend is not configured. Please set RESEND_API_KEY in .env file');
        return false;
      }

      // Use Resend API only
      await this.resendClient.emails.send({
        from: `Australia Storys <${this.fromEmail}>`,
        to: email,
        subject: 'Verify Your Email Address',
        html: emailHtml,
      });
      this.logger.log(`✅ Verification email sent via Resend to ${email}`);
      return true;
    } catch (error: any) {
      this.logger.error(`❌ Failed to send verification email to ${email}:`, error);
      this.logger.error(`❌ Resend error:`, error.message || error);
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
      if (!this.useResend || !this.resendClient) {
        this.logger.error('❌ [EmailService] Resend is not configured. Please set RESEND_API_KEY in .env file');
        return false;
      }

      // Use Resend API only
      await this.resendClient.emails.send({
        from: `Australia Storys <${this.fromEmail}>`,
        to: email,
        subject: 'Reset Your Password',
        html: emailHtml,
      });
      this.logger.log(`✅ Password reset email sent via Resend to ${email}`);
      return true;
    } catch (error: any) {
      this.logger.error(`❌ Failed to send password reset email to ${email}:`, error);
      this.logger.error(`❌ Resend error:`, error.message || error);
      return false;
    }
  }
}
