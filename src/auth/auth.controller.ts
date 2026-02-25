import { Controller, Request, Post, UseGuards, Get, Body, Res, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GoogleAuthGuard } from './google-auth.guard';
import { Public } from './public.decorator';
import { Response } from 'express';
import { ResponseData, ResponseDataOutput, ResponseDataWhenError } from '../global/GlobalResponseData';
import { handleRequest } from '../global/handleRequest';
import { ZodValidationPipe } from '../validation.pipe';
import { UserService } from '../modules/user/user.service';
import { EmailService } from '../modules/email/email.service';
import { GoogleTokenVerifyService } from './google-token-verify.service';
import {
  User_Register_Schema,
  User_Login_Schema,
  User_Type,
  User_Register_Type,
  User_Login_Type,
  User_RegisterOutput_Type,
} from '../modules/user/user.interface';

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly emailService: EmailService,
    private readonly googleTokenVerifyService: GoogleTokenVerifyService,
  ) {}

  /**
   * @Register USER
   */

  // @Public()
  @Public()
  @Post('register')
  async user_register(
    @Body(new ZodValidationPipe({ schema: User_Register_Schema, action: 'createUser' }))
    user_registerBody: User_Register_Type,
  ): Promise<ResponseDataOutput<User_RegisterOutput_Type | ResponseDataWhenError>> {
    return handleRequest<User_RegisterOutput_Type>({
      execute: async () => {
        const result = await this.userService.register(user_registerBody);
        
        // If registration successful, send verification email
        if (result.status === 'Success' && result.user) {
          // Get the verification token from the newly created user
          const user = await this.userService.findByEmail(user_registerBody.email);
          if (user && (user as any).emailVerificationToken) {
            // Send verification email in background (don't wait for it)
            this.emailService.sendVerificationEmail(
              user_registerBody.email,
              (user as any).emailVerificationToken,
            ).catch((error) => {
              console.error('Failed to send verification email:', error);
              // Don't fail registration if email fails
            });
          }
        }
        
        return result;
      },
      actionName: 'createUser',
    });
  }

  /**
   * @Login User By user_manual
   */

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async user_login(@Request() req: any, @Res() response: Response) {
    try {
      // if(req.user.status === "Failed") return response.status(HttpStatus.BAD_REQUEST).json(req.user);
      // console.log('7. req.user:', req.user);
      const { access_token, refresh_token } = await this.authService.login(req.user);
      const getUserData = await this.userService.getBaseUserData({
        existingUser: req.user,
        network_name: req.body?.network_name,
      });
      if (getUserData.status === 'Success') {
        // Set cookies with proper settings for HTTPS through nginx
        response.cookie('access_token', access_token, {
          httpOnly: true,
          secure: true, // Required for HTTPS
          sameSite: 'none', // Required for cross-origin requests through nginx
          maxAge: 15 * 60 * 1000, // 15 minutes
          path: '/',
        });

        response.cookie('refresh_token', refresh_token, {
          httpOnly: true,
          secure: true, // Required for HTTPS
          sameSite: 'none', // Required for cross-origin requests through nginx
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          path: '/',
        });

        console.log('✅ [Login] Cookies set successfully');
        console.log('✅ [Login] Returning user data:', getUserData);
        return response.status(HttpStatus.OK).json(getUserData);
      } else {
        return response.status(HttpStatus.BAD_REQUEST).json(getUserData);
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during login';
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'Failed',
        message: errorMessage,
        error: error,
      });
    }
  }

  // Google login removed from template - can be added as needed
 
  @Post('refresh-token')
  async refreshToken(@Request() req: any, @Res() response: Response) {
    try {
      // console.log('Cookies received:', req.cookies);
      const refreshToken = req.cookies.refresh_token; // Get the refresh token from cookies
      const newTokens = await this.authService.refreshToken(refreshToken);
      // Set new tokens in cookies
      response.cookie('access_token', newTokens.access_token, {
        httpOnly: true,
        secure: false,
        maxAge: 15 * 60 * 1000, // 15 minutes
        sameSite: 'lax',
      });

      response.cookie('refresh_token', newTokens.refresh_token, {
        httpOnly: true,
        secure: false,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: 'lax',
      });

      response.status(HttpStatus.OK).json({ success: true });
    } catch (error) {
      response.status(HttpStatus.UNAUTHORIZED).json({ message: 'Invalid refresh token' });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('logout')
  async user_logout(@Res() response: Response) {
    console.log('call logout');
    try {
      response.clearCookie('access_token');
      response.clearCookie('refresh_token');
      return response.status(HttpStatus.OK).json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Logout error' });
    }
  }

  /**
   * Verify email with token
   */
  @Public()
  @Post('verify-email')
  async verifyEmail(@Body('token') token: string): Promise<ResponseDataOutput<any>> {
    return handleRequest({
      execute: () => this.userService.verifyEmail(token),
      actionName: 'verifyEmail',
    });
  }

  /**
   * Resend verification email
   */
  @Public()
  @Post('resend-verification')
  async resendVerification(@Body('email') email: string): Promise<ResponseDataOutput<any>> {
    return handleRequest({
      execute: async () => {
        const result = await this.userService.resendVerificationToken(email);
        
        // If token generated successfully, send email
        if (result.success && result.token) {
          const emailSent = await this.emailService.sendVerificationEmail(email, result.token);
          if (!emailSent) {
            return {
              success: false,
              message: 'Failed to send verification email. Please try again.',
            };
          }
        }
        
        return {
          success: result.success,
          message: result.message,
        };
      },
      actionName: 'resendVerification',
    });
  }

  /**
   * Request password reset
   */
  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string): Promise<ResponseDataOutput<any>> {
    return handleRequest({
      execute: async () => {
        const result = await this.userService.generatePasswordResetToken(email);
        
        // If token generated successfully, send email (even if user doesn't exist for security)
        if (result.success && result.token) {
          const emailSent = await this.emailService.sendPasswordResetEmail(email, result.token);
          
          // Log email sending result for debugging (but don't reveal to user for security)
          if (!emailSent) {
            console.error(`⚠️ [ForgotPassword] Failed to send email to ${email}, but returning success for security`);
            // Still return success to not reveal if user exists
            // In production, you might want to queue the email for retry
          }
          
          // Always return success message (security: don't reveal if user exists)
          return {
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent.',
          };
        }
        
        // Even if user doesn't exist, return success (security best practice)
        return {
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent.',
        };
      },
      actionName: 'forgotPassword',
    });
  }

  /**
   * Reset password with token
   */
  @Public()
  @Post('reset-password')
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ): Promise<ResponseDataOutput<any>> {
    return handleRequest({
      execute: () => this.userService.resetPassword(token, newPassword),
      actionName: 'resetPassword',
    });
  }

  /**
   * Google OAuth - Initiate login
   * The guard will automatically redirect to Google's OAuth page
   */
  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // This method should never be reached - the guard redirects to Google
    // If we reach here, there's a configuration issue
    console.log('⚠️ [Google OAuth] Method body reached - guard should have redirected');
    throw new Error('Google OAuth guard failed to redirect');
  }
  
  /**
   * Test endpoint to verify routing is working
   */
  @Public()
  @Get('google/test')
  async googleTest() {
    console.log('✅ [Google OAuth Test] Route is accessible');
    return {
      status: 'Success',
      message: 'Google OAuth route is accessible',
      timestamp: new Date().toISOString(),
      route: '/api/v1/auth/google/test',
    };
  }
  
  /**
   * Simple health check for auth routes
   */
  @Public()
  @Get('health')
  async healthCheck() {
    return {
      status: 'Success',
      message: 'Auth routes are working',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Google OAuth - Frontend JavaScript SDK flow
   * Accepts Google ID token from frontend and creates/logs in user
   */
  @Public()
  @Post('google')
  async googleAuthFrontend(
    @Body('credential') credential: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ResponseDataOutput<any>> {
    return handleRequest({
      execute: async () => {
        // Verify Google ID token
        const googleUser = await this.googleTokenVerifyService.verifyToken(credential);

        // Create or find user from Google OAuth
        const user = await this.userService.createOrFindGoogleUser({
          email: googleUser.email,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          picture: googleUser.picture,
        });

        // Generate JWT tokens
        const { access_token, refresh_token } = await this.authService.login(user);

        // Set cookies with proper settings for HTTPS
        response.cookie('access_token', access_token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 15 * 60 * 1000, // 15 minutes
          path: '/',
        });

        response.cookie('refresh_token', refresh_token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          path: '/',
        });

        // Get base user data
        const getUserData = await this.userService.getBaseUserData({
          existingUser: user,
          network_name: 'google',
        });

        if (getUserData.status === 'Success' && getUserData.data) {
          // Return user data directly (handleRequest will wrap it)
          return getUserData.data;
        } else {
          throw new Error('Failed to get user data after Google authentication');
        }
      },
      actionName: 'googleAuthFrontend',
    });
  }

  /**
   * Google OAuth - Callback handler
   */
  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Request() req: any, @Res() response: Response) {
    try {
      // req.user contains the Google user data from GoogleStrategy.validate()
      const googleUser = req.user;

      // Create or find user from Google OAuth
      const user = await this.userService.createOrFindGoogleUser({
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        picture: googleUser.picture,
      });

      // Generate JWT tokens
      const { access_token, refresh_token } = await this.authService.login(user);

      // Get base user data
      const getUserData = await this.userService.getBaseUserData({
        existingUser: user,
        network_name: 'google',
      });

      if (getUserData.status === 'Success') {
        // Set cookies with proper settings for HTTPS through nginx
        response.cookie('access_token', access_token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 15 * 60 * 1000, // 15 minutes
          path: '/',
        });

        response.cookie('refresh_token', refresh_token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          path: '/',
        });

        // Redirect to frontend with success
        const frontendUrl = process.env.FRONTEND_URL || 'https://australiastorys.com';
        response.redirect(`${frontendUrl}?google_auth=success`);
      } else {
        const frontendUrl = process.env.FRONTEND_URL || 'https://australiastorys.com';
        response.redirect(`${frontendUrl}/auth?google_auth=error`);
      }
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'https://australiastorys.com';
      response.redirect(`${frontendUrl}/auth?google_auth=error`);
    }
  }

  // Wallet endpoint removed from template - can be added as needed
}
