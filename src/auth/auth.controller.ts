import { Controller, Request, Post, UseGuards, Get, Body, Res, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Public } from './public.decorator';
import { Response } from 'express';
import { ResponseData, ResponseDataOutput, ResponseDataWhenError } from '../global/GlobalResponseData';
import { handleRequest } from '../global/handleRequest';
import { ZodValidationPipe } from '../validation.pipe';
import { UserService } from '../modules/user/user.service';
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
      execute: () => this.userService.register(user_registerBody),
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
      console.log('7. req.user:', req.user);
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
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'Failed',
        message: error.message || 'An error occurred during login',
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

  // Wallet endpoint removed from template - can be added as needed
}
